import { AccountError, ensureAccountSchema, getAccountDatabase, requireSameOrigin } from "../../../lib/auth";
import { DEFAULT_MAX_FILE_BYTES, ensureUploadSchema, hashToken, randomId, randomToken, requireOwner } from "../../../lib/uploads";
import { ensurePaymentSchema, servicePlans, json } from "../../../lib/razorpay";

const PASSWORD_ITERATIONS = 100_000;

export async function GET(request: Request) {
  return handle(async () => {
    await requireOwner(request);
    await Promise.all([ensureAccountSchema(), ensurePaymentSchema(), ensureUploadSchema()]);
    const db = getAccountDatabase();
    const [users, payments, projects] = await Promise.all([
      db.prepare(`SELECT u.id, u.name, u.email, u.created_at, u.updated_at,
        COUNT(DISTINCT s.token_hash) AS active_sessions,
        COUNT(DISTINCT o.razorpay_order_id) AS orders,
        COUNT(DISTINCT p.project_id) AS projects
        FROM account_users u
        LEFT JOIN account_sessions s ON s.user_id = u.id AND s.expires_at > ?
        LEFT JOIN order_selections o ON o.user_id = u.id
        LEFT JOIN user_upload_projects p ON p.user_id = u.id
        GROUP BY u.id ORDER BY u.created_at DESC LIMIT 250`).bind(Date.now()).all<Record<string, unknown>>(),
      db.prepare(`SELECT razorpay_order_id, plan_name, billing, quantity, amount_paise,
        currency, status, customer_name, customer_email, created_at
        FROM payment_orders ORDER BY created_at DESC LIMIT 250`).all<Record<string, unknown>>(),
      db.prepare(`SELECT id, name, client_name, client_email, status, created_at, updated_at
        FROM upload_projects ORDER BY updated_at DESC LIMIT 250`).all<Record<string, unknown>>(),
    ]);
    return json({
      users: users.results.map(publicUser),
      payments: payments.results,
      projects: projects.results,
      summary: {
        users: users.results.length,
        paidOrders: payments.results.filter(row => ["verified", "captured"].includes(String(row.status))).length,
        projects: projects.results.length,
      },
    });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request);
    await requireOwner(request);
    await Promise.all([ensureAccountSchema(), ensurePaymentSchema(), ensureUploadSchema()]);
    const input = await request.json() as Record<string, unknown>;
    const action = cleanText(input.action, 40);
    if (action !== "create_offline_client") throw new AccountError("Choose a valid admin action.", 404);

    const name = cleanText(input.name, 100);
    const email = cleanEmail(input.email);
    const planId = cleanText(input.planId, 80) || "basic_reel";
    const plan = servicePlans[planId as keyof typeof servicePlans] || servicePlans.basic_reel;
    const billing = input.billing === "monthly" ? "monthly" : "one_off";
    const quantity = clampInteger(input.quantity, billing === "monthly" ? 10 : 1, 1, 30);
    const amountRupees = clampInteger(input.amountRupees, plan.amount * quantity, 1, 5_000_000);
    const title = cleanText(input.projectTitle, 140) || `${name || "Client"} Workspace`;
    const note = cleanText(input.note, 800);

    if (name.length < 2) throw new AccountError("Enter the client's name.");
    if (!email) throw new AccountError("Enter a valid client email.");

    const db = getAccountDatabase();
    const now = Date.now();
    let user = await db.prepare("SELECT id, name, email, created_at FROM account_users WHERE email = ? LIMIT 1")
      .bind(email).first<{ id: string; name: string; email: string; created_at: number }>();
    if (!user) {
      const id = randomId("usr");
      const salt = randomToken();
      const passwordHash = await derivePasswordHash(randomToken(), salt, PASSWORD_ITERATIONS);
      await db.prepare(`INSERT INTO account_users
        (id, name, email, password_hash, password_salt, password_iterations, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, name, email, passwordHash, salt, PASSWORD_ITERATIONS, now, now).run();
      user = { id, name, email, created_at: now };
    } else if (user.name !== name) {
      await db.prepare("UPDATE account_users SET name = ?, updated_at = ? WHERE id = ?").bind(name, now, user.id).run();
      user = { ...user, name };
    }

    const orderId = `manual_${crypto.randomUUID().replaceAll("-", "")}`;
    const receipt = `offline_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
    const projectId = randomId("prj");
    const tokenHash = await hashToken(randomToken());
    await db.batch([
      db.prepare(`INSERT INTO payment_orders
        (razorpay_order_id, receipt, plan_id, plan_name, billing, quantity, amount_paise,
          currency, status, payment_id, customer_name, customer_email, created_at, updated_at, refund_note)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'INR', 'captured', ?, ?, ?, ?, ?, ?)`)
        .bind(orderId, receipt, planId, `${plan.name} · offline paid`, billing, quantity, amountRupees * 100,
          `bank_${receipt}`, name, email, now, now, note || "Marked paid outside website by owner."),
      db.prepare(`INSERT INTO order_selections
        (razorpay_order_id, user_id, content_type, delivery_format, add_ons_json, created_at)
        VALUES (?, ?, ?, ?, '[]', ?)`)
        .bind(orderId, user.id, inferContentType(planId), "Client selected later", now),
      db.prepare(`INSERT INTO upload_projects
        (id, name, client_name, client_email, upload_token_hash, status, max_file_size, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`)
        .bind(projectId, title, name, email, tokenHash, DEFAULT_MAX_FILE_BYTES, now, now),
      db.prepare(`INSERT INTO user_upload_projects (project_id, user_id, razorpay_order_id, created_at)
        VALUES (?, ?, ?, ?)`)
        .bind(projectId, user.id, orderId, now),
    ]);

    return json({ user: publicUser(user), orderId, projectId }, 201);
  });
}

function publicUser(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    created_at: row.created_at,
    updated_at: row.updated_at,
    active_sessions: Number(row.active_sessions || 0),
    orders: Number(row.orders || 0),
    projects: Number(row.projects || 0),
  };
}

function inferContentType(planId: string) {
  if (planId.startsWith("podcast")) return "podcast";
  if (planId.startsWith("long")) return "longform";
  return "video";
}

function cleanText(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function cleanEmail(value: unknown): string {
  const email = cleanText(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function clampInteger(value: unknown, fallback: number, minimum: number, maximum: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum ? number : fallback;
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

async function handle(handler: () => Promise<Response>) {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof AccountError || error instanceof Error && "status" in error) {
      const status = typeof (error as { status?: unknown }).status === "number" ? (error as { status: number }).status : 400;
      return json({ error: error.message }, status);
    }
    console.error("Content X admin error", error);
    return json({ error: "Admin service is temporarily unavailable." }, 503);
  }
}
