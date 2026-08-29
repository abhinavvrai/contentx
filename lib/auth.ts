import { env } from "cloudflare:workers";
import { contentXEmailShell, sendTransactionalEmail } from "./email";

const SESSION_COOKIE = "cx_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_ITERATIONS = 100_000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 6;
const OTP_REQUEST_WINDOW_MS = 15 * 60 * 1000;
const OTP_REQUEST_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_REQUESTS = 5;
const GOOGLE_NONCE_COOKIE = "cx_google_nonce";
const GOOGLE_NONCE_TTL_SECONDS = 10 * 60;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

type AuthBindings = {
  DB?: D1Database;
  GOOGLE_CLIENT_ID?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  RESEND_API_KEY?: string;
  CONTENTX_EMAIL_FROM?: string;
};

export type AccountUser = {
  id: string;
  name: string;
  email: string;
  createdAt: number;
};

export type AccountCapabilities = {
  google: { available: boolean; clientId: string };
  emailOtp: { available: boolean };
  passwordReset: { available: boolean };
};

type StoredUser = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  password_iterations: number;
  created_at: number;
};

let authSchemaPromise: Promise<void> | null = null;
let googleKeysPromise: Promise<Array<JsonWebKey & { kid?: string }>> | null = null;

export class AccountError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function getAccountDatabase(): D1Database {
  const bindings = env as unknown as AuthBindings;
  if (!bindings.DB) throw new Error("Account database is unavailable.");
  return bindings.DB;
}

export function getAccountCapabilities(): AccountCapabilities {
  const googleClientId = bindingValue("GOOGLE_CLIENT_ID");
  const otpAvailable = Boolean(bindingValue("SUPABASE_URL") && bindingValue("SUPABASE_ANON_KEY"));
  return {
    google: { available: Boolean(googleClientId), clientId: googleClientId },
    emailOtp: { available: otpAvailable },
    passwordReset: { available: Boolean(bindingValue("RESEND_API_KEY") && bindingValue("CONTENTX_EMAIL_FROM")) },
  };
}

export async function requestEmailOtp(request: Request, input: Record<string, unknown>): Promise<void> {
  requireSameOrigin(request);
  await ensureAccountSchema();
  const email = cleanEmail(input.email);
  if (!email) throw new AccountError("Enter a valid email address.");
  const { url, anonKey } = supabaseConfig();
  const db = getAccountDatabase();
  const attemptKey = await otpAttemptKey(request, email);
  await enforceOtpRequestLimit(db, attemptKey);
  const name = cleanText(input.name, 100);
  const response = await fetch(`${url}/auth/v1/otp`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, create_user: true, data: name ? { full_name: name, name } : undefined }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { msg?: string; message?: string };
    throw new AccountError(payload.msg || payload.message || "We could not send the verification code.", response.status === 429 ? 429 : 503);
  }
  await recordOtpRequest(db, attemptKey);
}

export async function verifyEmailOtp(request: Request, input: Record<string, unknown>): Promise<{ user: AccountUser; token: string }> {
  requireSameOrigin(request);
  await ensureAccountSchema();
  const email = cleanEmail(input.email);
  const otp = cleanText(input.otp, 12).replace(/\s+/g, "");
  if (!email || !/^\d{6,8}$/.test(otp)) throw new AccountError("Enter the verification code sent to your email.");
  const { url, anonKey } = supabaseConfig();
  const response = await fetch(`${url}/auth/v1/verify`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, token: otp, type: "email" }),
  });
  const payload = await response.json().catch(() => ({})) as {
    user?: { id?: string; email?: string; email_confirmed_at?: string | null; confirmed_at?: string | null; user_metadata?: { full_name?: string; name?: string } };
    access_token?: string;
    session?: { access_token?: string };
    msg?: string;
    message?: string;
  };
  if (!response.ok || !payload.user?.id || !payload.user.email) {
    throw new AccountError(payload.msg || payload.message || "That verification code is invalid or expired.", 401);
  }
  const verifiedEmail = cleanEmail(payload.user.email || email);
  if (!verifiedEmail || verifiedEmail !== email) throw new AccountError("The verified email did not match this sign-in.", 403);
  const displayName = cleanText(payload.user.user_metadata?.full_name || payload.user.user_metadata?.name, 100) || email.split("@")[0];
  let user = await findOrCreateIdentityUser("supabase", payload.user.id, verifiedEmail, cleanText(input.name, 100) || displayName);
  const requestedPassword = typeof input.password === "string" ? input.password : "";
  if (requestedPassword) {
    validatePassword(requestedPassword);
    const requestedName = cleanText(input.name, 100) || user.name;
    const salt = randomToken(16);
    const passwordHash = await derivePasswordHash(requestedPassword, salt, PASSWORD_ITERATIONS);
    await getAccountDatabase().prepare(`UPDATE account_users SET name = ?, password_hash = ?,
      password_salt = ?, password_iterations = ?, updated_at = ? WHERE id = ?`)
      .bind(requestedName, passwordHash, salt, PASSWORD_ITERATIONS, Date.now(), user.id).run();
    user = { ...user, name: requestedName };
  }
  return { user, token: await createSession(request, user.id) };
}

export function issueGoogleNonce(request: Request): { nonce: string; cookie: string } {
  requireSameOrigin(request);
  if (!getAccountCapabilities().google.available) throw new AccountError("Google sign-in is not configured yet.", 503);
  const nonce = randomToken(24);
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return {
    nonce,
    cookie: `${GOOGLE_NONCE_COOKIE}=${nonce}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${GOOGLE_NONCE_TTL_SECONDS}${secure}`,
  };
}

export async function loginWithGoogle(request: Request, input: Record<string, unknown>): Promise<{ user: AccountUser; token: string }> {
  requireSameOrigin(request);
  await ensureAccountSchema();
  const credential = cleanText(input.credential, 6000);
  const nonce = cookieValue(request, GOOGLE_NONCE_COOKIE);
  if (!credential || !nonce) throw new AccountError("Restart Google sign-in and try again.", 401);
  const claims = await verifyGoogleCredential(credential, nonce);
  const user = await findOrCreateIdentityUser("google", claims.sub, claims.email, claims.name || claims.email.split("@")[0]);
  return { user, token: await createSession(request, user.id) };
}

export function expiredGoogleNonceCookie(request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${GOOGLE_NONCE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export async function ensureAccountSchema(): Promise<void> {
  const db = getAccountDatabase();
  if (!authSchemaPromise) {
    authSchemaPromise = db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS account_users (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        password_iterations INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS account_sessions (
        token_hash TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        last_seen_at INTEGER NOT NULL,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES account_users(id) ON DELETE CASCADE
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS auth_login_attempts (
        attempt_key TEXT PRIMARY KEY NOT NULL,
        attempts INTEGER NOT NULL,
        window_started_at INTEGER NOT NULL,
        blocked_until INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS auth_identities (
        provider TEXT NOT NULL,
        provider_user_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        verified_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (provider, provider_user_id),
        FOREIGN KEY (user_id) REFERENCES account_users(id) ON DELETE CASCADE
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS account_password_resets (
        token_hash TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        used_at INTEGER,
        created_at INTEGER NOT NULL,
        request_ip_hash TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES account_users(id) ON DELETE CASCADE
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS order_selections (
        razorpay_order_id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        content_type TEXT NOT NULL,
        delivery_format TEXT,
        add_ons_json TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES account_users(id) ON DELETE CASCADE
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS project_briefs (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        razorpay_order_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        instructions TEXT NOT NULL,
        reference_url TEXT,
        status TEXT NOT NULL DEFAULT 'submitted',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES account_users(id) ON DELETE CASCADE
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS user_upload_projects (
        project_id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        razorpay_order_id TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES account_users(id) ON DELETE CASCADE
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_account_sessions_user_expires ON account_sessions(user_id, expires_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_auth_identities_user ON auth_identities(user_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_auth_identities_email ON auth_identities(email)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_account_password_resets_user_email ON account_password_resets(user_id, email, expires_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_order_selections_user_created ON order_selections(user_id, created_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_project_briefs_user_updated ON project_briefs(user_id, updated_at)"),
      db.prepare("PRAGMA optimize"),
    ]).then(async () => {
      await ensureAuthSchemaColumns(db);
    }).catch(error => {
      authSchemaPromise = null;
      throw error;
    });
  }
  await authSchemaPromise;
}

async function ensureAuthSchemaColumns(db: D1Database): Promise<void> {
  await ensureColumns(db, "account_users", [
    ["password_hash", "TEXT NOT NULL DEFAULT ''"],
    ["password_salt", "TEXT NOT NULL DEFAULT ''"],
    ["password_iterations", `INTEGER NOT NULL DEFAULT ${PASSWORD_ITERATIONS}`],
    ["updated_at", "INTEGER"],
  ]);
  await db.prepare("UPDATE account_users SET updated_at = created_at WHERE updated_at IS NULL").run();
  await ensureColumns(db, "account_sessions", [
    ["last_seen_at", "INTEGER NOT NULL DEFAULT 0"],
    ["user_agent", "TEXT"],
  ]);
  await ensureColumns(db, "auth_login_attempts", [
    ["blocked_until", "INTEGER NOT NULL DEFAULT 0"],
  ]);
  await ensureColumns(db, "auth_identities", [
    ["verified_at", "INTEGER NOT NULL DEFAULT 0"],
    ["created_at", "INTEGER NOT NULL DEFAULT 0"],
  ]);
  await ensureColumns(db, "account_password_resets", [
    ["request_ip_hash", "TEXT"],
    ["user_agent", "TEXT"],
  ]);
  await ensureColumns(db, "order_selections", [
    ["delivery_format", "TEXT"],
    ["add_ons_json", "TEXT NOT NULL DEFAULT '[]'"],
  ]);
  await ensureColumns(db, "project_briefs", [
    ["reference_url", "TEXT"],
    ["status", "TEXT NOT NULL DEFAULT 'submitted'"],
    ["updated_at", "INTEGER"],
  ]);
  await db.prepare("UPDATE project_briefs SET updated_at = created_at WHERE updated_at IS NULL").run();
}

async function ensureColumns(db: D1Database, table: string, columns: Array<[string, string]>): Promise<void> {
  const existing = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  const names = new Set(existing.results.map(column => column.name));
  for (const [name, definition] of columns) {
    if (!names.has(name)) await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`).run();
  }
}

export function requireSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new AccountError("This request was not accepted.", 403);
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new AccountError("This request was not accepted.", 403);
}

export async function registerAccount(request: Request, input: Record<string, unknown>): Promise<{ user: AccountUser; token: string }> {
  requireSameOrigin(request);
  await ensureAccountSchema();
  const name = cleanText(input.name, 100);
  const email = cleanEmail(input.email);
  const password = typeof input.password === "string" ? input.password : "";
  if (name.length < 2) throw new AccountError("Enter your full name.");
  if (!email) throw new AccountError("Enter a valid email address.");
  validatePassword(password);
  const db = getAccountDatabase();
  const existing = await db.prepare("SELECT id FROM account_users WHERE email = ? LIMIT 1").bind(email).first();
  if (existing) throw new AccountError("An account already exists for this email. Sign in instead.", 409);
  const salt = randomToken(16);
  const passwordHash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS);
  const id = `usr_${crypto.randomUUID().replaceAll("-", "")}`;
  const now = Date.now();
  await db.prepare(`INSERT INTO account_users
    (id, name, email, password_hash, password_salt, password_iterations, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, name, email, passwordHash, salt, PASSWORD_ITERATIONS, now, now).run();
  const user = { id, name, email, createdAt: now };
  return { user, token: await createSession(request, user.id) };
}

export async function loginAccount(request: Request, input: Record<string, unknown>): Promise<{ user: AccountUser; token: string }> {
  requireSameOrigin(request);
  await ensureAccountSchema();
  const email = cleanEmail(input.email);
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || !password) throw new AccountError("Enter your email and password.");
  const db = getAccountDatabase();
  const attemptKey = await loginAttemptKey(request, email);
  await enforceLoginRateLimit(db, attemptKey);
  const stored = await db.prepare("SELECT * FROM account_users WHERE email = ? LIMIT 1").bind(email).first<StoredUser>();
  const accepted = stored && await verifyPassword(password, stored);
  if (!stored || !accepted) {
    await recordFailedLogin(db, attemptKey);
    throw new AccountError("Email or password is incorrect.", 401);
  }
  await db.prepare("DELETE FROM auth_login_attempts WHERE attempt_key = ?").bind(attemptKey).run();
  const user = { id: stored.id, name: stored.name, email: stored.email, createdAt: stored.created_at };
  return { user, token: await createSession(request, user.id) };
}

export async function requestPasswordReset(request: Request, input: Record<string, unknown>): Promise<void> {
  requireSameOrigin(request);
  await ensureAccountSchema();
  const email = cleanEmail(input.email);
  if (!email) throw new AccountError("Enter a valid email address.");
  const db = getAccountDatabase();
  const attemptKey = await resetAttemptKey(request, email);
  await enforceOtpRequestLimit(db, attemptKey);
  const user = await db.prepare("SELECT id, name, email FROM account_users WHERE email = ? LIMIT 1")
    .bind(email).first<{ id: string; name: string; email: string }>();
  await recordOtpRequest(db, attemptKey);
  if (!user) return;
  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const now = Date.now();
  await db.prepare(`INSERT INTO account_password_resets
    (token_hash, user_id, email, expires_at, created_at, request_ip_hash, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(tokenHash, user.id, user.email, now + PASSWORD_RESET_TTL_MS, now, await requestIpHash(request), cleanText(request.headers.get("user-agent"), 240) || null).run();
  const resetUrl = new URL("/site/index.html", request.url);
  resetUrl.hash = `access?reset=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
  await sendTransactionalEmail({
    to: user.email,
    subject: "Reset your Content X password",
    html: contentXEmailShell(
      "Reset your Content X password",
      "Use this secure link to set a new password. The link expires in 60 minutes. If you did not request this, you can ignore this email.",
      { label: "Reset password", url: resetUrl.toString() },
    ),
    idempotencyKey: `reset_${tokenHash.slice(0, 32)}`,
  });
}

export async function resetAccountPassword(request: Request, input: Record<string, unknown>): Promise<{ user: AccountUser; token: string }> {
  requireSameOrigin(request);
  await ensureAccountSchema();
  const email = cleanEmail(input.email);
  const resetToken = cleanText(input.token, 256);
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || !resetToken) throw new AccountError("Open the latest password reset link from your email.");
  validatePassword(password);
  const db = getAccountDatabase();
  const tokenHash = await sha256(resetToken);
  const row = await db.prepare(`SELECT r.token_hash, r.user_id, u.name, u.email, u.created_at
    FROM account_password_resets r JOIN account_users u ON u.id = r.user_id
    WHERE r.token_hash = ? AND r.email = ? AND r.used_at IS NULL AND r.expires_at > ? LIMIT 1`)
    .bind(tokenHash, email, Date.now()).first<{ token_hash: string; user_id: string; name: string; email: string; created_at: number }>();
  if (!row) throw new AccountError("This reset link is invalid or expired.", 401);
  const salt = randomToken(16);
  const passwordHash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS);
  const now = Date.now();
  await db.batch([
    db.prepare(`UPDATE account_users SET password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = ? WHERE id = ?`)
      .bind(passwordHash, salt, PASSWORD_ITERATIONS, now, row.user_id),
    db.prepare("UPDATE account_password_resets SET used_at = ? WHERE token_hash = ?").bind(now, row.token_hash),
    db.prepare("DELETE FROM account_sessions WHERE user_id = ?").bind(row.user_id),
  ]);
  const user = { id: row.user_id, name: row.name, email: row.email, createdAt: row.created_at };
  return { user, token: await createSession(request, user.id) };
}

export async function logoutAccount(request: Request): Promise<void> {
  requireSameOrigin(request);
  await ensureAccountSchema();
  const token = cookieValue(request, SESSION_COOKIE);
  if (token) await getAccountDatabase().prepare("DELETE FROM account_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
}

export async function getSessionUser(request: Request): Promise<AccountUser | null> {
  await ensureAccountSchema();
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  const db = getAccountDatabase();
  const now = Date.now();
  const row = await db.prepare(`SELECT u.id, u.name, u.email, u.created_at, s.last_seen_at
    FROM account_sessions s JOIN account_users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`)
    .bind(await sha256(token), now).first<{ id: string; name: string; email: string; created_at: number; last_seen_at: number }>();
  if (!row) return null;
  if (now - row.last_seen_at > 15 * 60 * 1000) {
    await db.prepare("UPDATE account_sessions SET last_seen_at = ? WHERE token_hash = ?").bind(now, await sha256(token)).run();
  }
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at };
}

export async function requireSessionUser(request: Request): Promise<AccountUser> {
  const user = await getSessionUser(request);
  if (!user) throw new AccountError("Sign in to continue.", 401);
  return user;
}

export function sessionCookie(request: Request, token: string): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`;
}

export function expiredSessionCookie(request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

async function findOrCreateIdentityUser(provider: string, providerUserId: string, email: string, name: string): Promise<AccountUser> {
  const db = getAccountDatabase();
  const existingIdentity = await db.prepare(`SELECT u.id, u.name, u.email, u.created_at
    FROM auth_identities i JOIN account_users u ON u.id = i.user_id
    WHERE i.provider = ? AND i.provider_user_id = ? LIMIT 1`)
    .bind(provider, providerUserId).first<{ id: string; name: string; email: string; created_at: number }>();
  if (existingIdentity) return { id: existingIdentity.id, name: existingIdentity.name, email: existingIdentity.email, createdAt: existingIdentity.created_at };

  const normalizedEmail = cleanEmail(email);
  if (!normalizedEmail) throw new AccountError("The identity provider did not return a valid email.", 403);
  let stored = await db.prepare("SELECT id, name, email, created_at FROM account_users WHERE email = ? LIMIT 1")
    .bind(normalizedEmail).first<{ id: string; name: string; email: string; created_at: number }>();
  const now = Date.now();
  if (!stored) {
    const id = `usr_${crypto.randomUUID().replaceAll("-", "")}`;
    const salt = randomToken(16);
    const unusablePassword = randomToken(48);
    const passwordHash = await derivePasswordHash(unusablePassword, salt, PASSWORD_ITERATIONS);
    await db.prepare(`INSERT INTO account_users
      (id, name, email, password_hash, password_salt, password_iterations, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, cleanText(name, 100) || normalizedEmail.split("@")[0], normalizedEmail, passwordHash, salt, PASSWORD_ITERATIONS, now, now).run();
    stored = { id, name: cleanText(name, 100) || normalizedEmail.split("@")[0], email: normalizedEmail, created_at: now };
  }
  await db.prepare(`INSERT INTO auth_identities (provider, provider_user_id, user_id, email, verified_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(provider, provider_user_id) DO UPDATE SET user_id = excluded.user_id,
      email = excluded.email, verified_at = excluded.verified_at`)
    .bind(provider, providerUserId, stored.id, normalizedEmail, now, now).run();
  return { id: stored.id, name: stored.name, email: stored.email, createdAt: stored.created_at };
}

function supabaseConfig(): { url: string; anonKey: string } {
  const url = bindingValue("SUPABASE_URL").replace(/\/+$/, "");
  const anonKey = bindingValue("SUPABASE_ANON_KEY");
  if (!url || !anonKey || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    throw new AccountError("Email verification is not configured yet.", 503);
  }
  return { url, anonKey };
}

async function otpAttemptKey(request: Request, email: string): Promise<string> {
  const address = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  return sha256(`otp|${email}|${address.trim()}`);
}

async function enforceOtpRequestLimit(db: D1Database, key: string): Promise<void> {
  const now = Date.now();
  const row = await db.prepare("SELECT attempts, window_started_at, blocked_until FROM auth_login_attempts WHERE attempt_key = ? LIMIT 1")
    .bind(key).first<{ attempts: number; window_started_at: number; blocked_until: number }>();
  if (row?.blocked_until && row.blocked_until > now) throw new AccountError("Too many verification requests. Try again later.", 429);
  if (row && now - row.window_started_at < OTP_REQUEST_COOLDOWN_MS) throw new AccountError("Wait one minute before requesting another code.", 429);
}

async function recordOtpRequest(db: D1Database, key: string): Promise<void> {
  const now = Date.now();
  const row = await db.prepare("SELECT attempts, window_started_at FROM auth_login_attempts WHERE attempt_key = ? LIMIT 1")
    .bind(key).first<{ attempts: number; window_started_at: number }>();
  const withinWindow = row && now - row.window_started_at < OTP_REQUEST_WINDOW_MS;
  const attempts = withinWindow ? row.attempts + 1 : 1;
  const blockedUntil = attempts >= MAX_OTP_REQUESTS ? now + OTP_REQUEST_WINDOW_MS : 0;
  await db.prepare(`INSERT INTO auth_login_attempts (attempt_key, attempts, window_started_at, blocked_until)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(attempt_key) DO UPDATE SET attempts = excluded.attempts,
      window_started_at = excluded.window_started_at, blocked_until = excluded.blocked_until`)
    .bind(key, attempts, now, blockedUntil).run();
}

async function verifyGoogleCredential(token: string, expectedNonce: string): Promise<{ sub: string; email: string; name: string }> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new AccountError("Google sign-in was not valid.", 401);
  const header = decodeJwtPart<{ alg?: string; kid?: string }>(parts[0]);
  const claims = decodeJwtPart<{
    iss?: string;
    aud?: string | string[];
    exp?: number;
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    nonce?: string;
  }>(parts[1]);
  if (header.alg !== "RS256" || !header.kid) throw new AccountError("Google sign-in used an unsupported signature.", 401);
  const clientId = bindingValue("GOOGLE_CLIENT_ID");
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud || ""];
  if (!clientId || !audiences.includes(clientId)) throw new AccountError("Google sign-in was intended for another application.", 401);
  if (!["accounts.google.com", "https://accounts.google.com"].includes(claims.iss || "")) throw new AccountError("Google sign-in issuer was not accepted.", 401);
  if (!claims.exp || claims.exp * 1000 <= Date.now()) throw new AccountError("Google sign-in expired. Try again.", 401);
  if (!claims.sub || !claims.email || !claims.email_verified) throw new AccountError("Use a verified Google account.", 403);
  if (!claims.nonce || !(await constantTimeTokenEqual(claims.nonce, expectedNonce))) throw new AccountError("Google sign-in could not be verified.", 401);
  const keys = await googlePublicKeys();
  const jwk = keys.find(key => key.kid === header.kid);
  if (!jwk) {
    googleKeysPromise = null;
    throw new AccountError("Google sign-in keys changed. Please try again.", 401);
  }
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const accepted = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64urlDecode(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!accepted) throw new AccountError("Google sign-in signature was not accepted.", 401);
  const email = cleanEmail(claims.email);
  if (!email) throw new AccountError("Google did not return a valid email.", 403);
  return { sub: claims.sub, email, name: cleanText(claims.name, 100) };
}

async function googlePublicKeys(): Promise<Array<JsonWebKey & { kid?: string }>> {
  if (!googleKeysPromise) {
    googleKeysPromise = fetch("https://www.googleapis.com/oauth2/v3/certs")
      .then(async response => {
        if (!response.ok) throw new Error("Google signing keys are unavailable.");
        const payload = await response.json() as { keys?: Array<JsonWebKey & { kid?: string }> };
        if (!Array.isArray(payload.keys)) throw new Error("Google signing keys were invalid.");
        return payload.keys;
      })
      .catch(error => {
        googleKeysPromise = null;
        throw error;
      });
  }
  return googleKeysPromise;
}

function decodeJwtPart<T>(value: string): T {
  try {
    return JSON.parse(new TextDecoder().decode(base64urlDecode(value))) as T;
  } catch {
    throw new AccountError("Google sign-in payload was not valid.", 401);
  }
}

async function constantTimeTokenEqual(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([sha256(left), sha256(right)]);
  return constantTimeEqual(leftHash, rightHash);
}

function bindingValue(key: keyof Omit<AuthBindings, "DB">): string {
  const bindings = env as unknown as AuthBindings;
  const value = bindings[key] || process.env[key];
  return typeof value === "string" ? value.trim() : "";
}

function validatePassword(password: string): void {
  if (password.length < 10) throw new AccountError("Use at least 10 characters for your password.");
  if (password.length > 128) throw new AccountError("Your password is too long.");
}

async function createSession(request: Request, userId: string): Promise<string> {
  const token = randomToken(32);
  const now = Date.now();
  const db = getAccountDatabase();
  await db.batch([
    db.prepare("DELETE FROM account_sessions WHERE expires_at <= ?").bind(now),
    db.prepare(`INSERT INTO account_sessions
      (token_hash, user_id, expires_at, created_at, last_seen_at, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(await sha256(token), userId, now + SESSION_TTL_MS, now, now, cleanText(request.headers.get("user-agent"), 240) || null),
  ]);
  return token;
}

async function verifyPassword(password: string, stored: StoredUser): Promise<boolean> {
  const candidate = await derivePasswordHash(password, stored.password_salt, stored.password_iterations);
  return constantTimeEqual(candidate, stored.password_hash);
}

async function derivePasswordHash(password: string, salt: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: base64urlDecode(salt), iterations },
    key,
    256,
  );
  return base64url(new Uint8Array(bits));
}

async function loginAttemptKey(request: Request, email: string): Promise<string> {
  const address = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  return sha256(`${email}|${address.trim()}`);
}

async function resetAttemptKey(request: Request, email: string): Promise<string> {
  const address = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  return sha256(`reset|${email}|${address.trim()}`);
}

async function requestIpHash(request: Request): Promise<string> {
  const address = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  return sha256(`ip|${address.trim()}`);
}

async function enforceLoginRateLimit(db: D1Database, key: string): Promise<void> {
  const row = await db.prepare("SELECT attempts, window_started_at, blocked_until FROM auth_login_attempts WHERE attempt_key = ? LIMIT 1")
    .bind(key).first<{ attempts: number; window_started_at: number; blocked_until: number }>();
  if (row?.blocked_until && row.blocked_until > Date.now()) throw new AccountError("Too many attempts. Try again in 15 minutes.", 429);
}

async function recordFailedLogin(db: D1Database, key: string): Promise<void> {
  const now = Date.now();
  const row = await db.prepare("SELECT attempts, window_started_at FROM auth_login_attempts WHERE attempt_key = ? LIMIT 1")
    .bind(key).first<{ attempts: number; window_started_at: number }>();
  const withinWindow = row && now - row.window_started_at < LOGIN_WINDOW_MS;
  const attempts = withinWindow ? row.attempts + 1 : 1;
  const windowStart = withinWindow ? row.window_started_at : now;
  const blockedUntil = attempts >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_WINDOW_MS : 0;
  await db.prepare(`INSERT INTO auth_login_attempts (attempt_key, attempts, window_started_at, blocked_until)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(attempt_key) DO UPDATE SET attempts = excluded.attempts,
      window_started_at = excluded.window_started_at, blocked_until = excluded.blocked_until`)
    .bind(key, attempts, windowStart, blockedUntil).run();
}

function cleanText(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function cleanEmail(value: unknown): string {
  const email = cleanText(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function cookieValue(request: Request, name: string): string {
  const source = request.headers.get("cookie") || "";
  for (const part of source.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function randomToken(size: number): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64url(new Uint8Array(digest));
}

function constantTimeEqual(left: string, right: string): boolean {
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}
