import { env } from "cloudflare:workers";

const SESSION_COOKIE = "cx_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_ITERATIONS = 310_000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 6;

type AuthBindings = { DB?: D1Database };

export type AccountUser = {
  id: string;
  name: string;
  email: string;
  createdAt: number;
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
      db.prepare("CREATE INDEX IF NOT EXISTS idx_order_selections_user_created ON order_selections(user_id, created_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_project_briefs_user_updated ON project_briefs(user_id, updated_at)"),
      db.prepare("PRAGMA optimize"),
    ]).then(() => undefined).catch(error => {
      authSchemaPromise = null;
      throw error;
    });
  }
  await authSchemaPromise;
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
