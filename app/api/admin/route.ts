import { AccountError, ensureAccountSchema, getAccountDatabase, requireSameOrigin } from "../../../lib/auth";
import { DEFAULT_MAX_FILE_BYTES, ensureUploadSchema, hashToken, randomId, randomToken } from "../../../lib/uploads";
import { ensurePaymentSchema, servicePlans, json } from "../../../lib/razorpay";
import { isStaffRole, recordAdminAudit, requireAdminAccess } from "../../../lib/admin-access";

const PASSWORD_ITERATIONS = 100_000;

export async function GET(request: Request) {
  return handle(async () => {
    const actor = await requireAdminAccess(request, "clients:manage");
    await Promise.all([ensureAccountSchema(), ensurePaymentSchema(), ensureUploadSchema()]);
    const db = getAccountDatabase();
    const [users, payments, projects, projectAccess, recentUploads, recentActivity] = await Promise.all([
      db.prepare(`SELECT u.id, u.name, u.email, u.phone_number, u.company_name, u.role_title, u.account_status, u.deletion_scheduled_at, u.created_at, u.updated_at,
        sm.role AS staff_role, sm.status AS staff_status,
        COUNT(DISTINCT s.token_hash) AS active_sessions,
        COUNT(DISTINCT o.razorpay_order_id) AS orders,
        COUNT(DISTINCT p.project_id) AS projects
        FROM account_users u
        LEFT JOIN account_sessions s ON s.user_id = u.id AND s.expires_at > ?
        LEFT JOIN staff_members sm ON sm.user_id = u.id
        LEFT JOIN order_selections o ON o.user_id = u.id
        LEFT JOIN user_upload_projects p ON p.user_id = u.id
        GROUP BY u.id ORDER BY u.created_at DESC LIMIT 250`).bind(Date.now()).all<Record<string, unknown>>(),
      db.prepare(`SELECT razorpay_order_id, plan_name, billing, quantity, amount_paise,
        currency, status, customer_name, customer_email, created_at
        FROM payment_orders ORDER BY created_at DESC LIMIT 250`).all<Record<string, unknown>>(),
      db.prepare(`SELECT p.id, p.name, p.client_name, p.client_email, p.status, p.created_at, p.updated_at,
        COUNT(f.id) AS file_count, COALESCE(SUM(f.size_bytes),0) AS storage_bytes, MAX(f.completed_at) AS latest_upload_at
        FROM upload_projects p LEFT JOIN upload_files f ON f.project_id=p.id AND f.status='ready'
        GROUP BY p.id ORDER BY p.updated_at DESC LIMIT 250`).all<Record<string, unknown>>(),
      db.prepare(`SELECT staff_user_id, project_id, access_level, created_at, updated_at
        FROM staff_project_access ORDER BY updated_at DESC LIMIT 1000`).all<Record<string, unknown>>(),
      db.prepare(`SELECT f.project_id, f.original_name, f.size_bytes, f.uploader_name, f.uploader_email, f.completed_at,
        p.name AS project_name, p.client_name, p.client_email
        FROM upload_files f JOIN upload_projects p ON p.id = f.project_id
        WHERE f.status = 'ready' ORDER BY f.completed_at DESC LIMIT 100`).all<Record<string, unknown>>(),
      db.prepare(`SELECT c.project_id, c.author_name, c.author_email, c.body, c.status, c.created_at,
        p.name AS project_name, p.client_name, p.client_email
        FROM project_review_comments c JOIN upload_projects p ON p.id = c.project_id
        WHERE c.deleted_at IS NULL ORDER BY c.created_at DESC LIMIT 100`).all<Record<string, unknown>>(),
    ]);
    return json({
      admin: { email:actor.email, role:actor.role },
      users: users.results.map(publicUser),
      payments: payments.results,
      projects: projects.results,
      projectAccess: projectAccess.results,
      recentUploads: recentUploads.results,
      recentActivity: recentActivity.results,
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
    await Promise.all([ensureAccountSchema(), ensurePaymentSchema(), ensureUploadSchema()]);
    const input = await request.json() as Record<string, unknown>;
    const action = cleanText(input.action, 40);
    if (action === "update_user_email") return updateUserEmail(request, input);
    if (action === "set_user_status") return setUserStatus(request, input);
    if (action === "set_staff_role") return setStaffRole(request, input);
    if (action === "remove_staff") return removeStaff(request, input);
    if (action === "set_project_access") return setProjectAccess(request, input);
    if (action === "remove_project_access") return removeProjectAccess(request, input);
    if (action !== "create_offline_client") throw new AccountError("Choose a valid admin action.", 404);
    const actor = await requireAdminAccess(request, "clients:manage");

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

    await recordAdminAudit(actor, "offline_payment_approved", "account_user", user.id, { orderId, projectId, amountRupees, planId });
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
    status: row.account_status || "active",
    phone: row.phone_number || null,
    company: row.company_name || null,
    roleTitle: row.role_title || null,
    deletionScheduledAt: row.deletion_scheduled_at || null,
    staffRole: row.staff_role || null,
    staffStatus: row.staff_status || null,
  };
}

async function updateUserEmail(request: Request, input: Record<string, unknown>) {
  const actor = await requireAdminAccess(request, "clients:manage");
  const userId = cleanText(input.userId, 100);
  const email = cleanEmail(input.email);
  if (!userId || !email) throw new AccountError("Choose a client and enter a valid new email.");
  if (actor.userId === userId) throw new AccountError("Change the owner email through the protected deployment configuration, not client administration.", 409);
  const db = getAccountDatabase();
  const existing = await db.prepare("SELECT id FROM account_users WHERE email = ? AND id <> ? LIMIT 1").bind(email, userId).first();
  if (existing) throw new AccountError("That email already belongs to another account.", 409);
  const current = await db.prepare("SELECT email FROM account_users WHERE id = ? LIMIT 1").bind(userId).first<{email:string}>();
  if (!current) throw new AccountError("Client account not found.", 404);
  await db.batch([
    db.prepare("UPDATE account_users SET email = ?, updated_at = ? WHERE id = ?").bind(email, Date.now(), userId),
    db.prepare("UPDATE auth_identities SET email = ? WHERE user_id = ?").bind(email, userId),
    db.prepare("UPDATE notification_preferences SET email_address = ? WHERE user_id = ?").bind(email, userId),
    db.prepare("UPDATE upload_projects SET client_email = ?, updated_at = ? WHERE id IN (SELECT project_id FROM user_upload_projects WHERE user_id = ?)").bind(email, Date.now(), userId),
    db.prepare("DELETE FROM account_sessions WHERE user_id = ?").bind(userId),
  ]);
  await recordAdminAudit(actor, "client_email_changed", "account_user", userId, { from:current.email, to:email });
  return json({ ok:true });
}

async function setUserStatus(request: Request, input: Record<string, unknown>) {
  const actor = await requireAdminAccess(request, "clients:manage");
  const userId = cleanText(input.userId, 100);
  const status = cleanText(input.status, 30);
  if (!userId || !["active", "suspended", "deletion_pending"].includes(status)) throw new AccountError("Choose a valid account status.");
  if (status === "deletion_pending" && input.confirmation !== "DELETE") throw new AccountError("Type DELETE to confirm account deletion.", 400);
  if (actor.userId === userId) throw new AccountError("You cannot suspend or delete your own administrator account.", 409);
  const db = getAccountDatabase();
  const deletionAt = status === "deletion_pending" ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null;
  const result = await db.prepare("UPDATE account_users SET account_status = ?, deletion_scheduled_at = ?, updated_at = ? WHERE id = ?")
    .bind(status, deletionAt, Date.now(), userId).run();
  if (!result.meta.changes) throw new AccountError("Client account not found.", 404);
  if (status !== "active") await db.prepare("DELETE FROM account_sessions WHERE user_id = ?").bind(userId).run();
  await recordAdminAudit(actor, status === "active" ? "client_restored" : status === "suspended" ? "client_suspended" : "client_deletion_scheduled", "account_user", userId, { deletionAt });
  return json({ ok:true, status, deletionScheduledAt:deletionAt });
}

async function setStaffRole(request: Request, input: Record<string, unknown>) {
  const actor = await requireAdminAccess(request, "team:manage");
  const userId = cleanText(input.userId, 100);
  const role = cleanText(input.role, 40);
  if (!userId || !isStaffRole(role) || role === "owner") throw new AccountError("Choose a valid staff member and role.");
  const now = Date.now();
  await getAccountDatabase().prepare(`INSERT INTO staff_members (user_id, role, status, invited_by_user_id, created_at, updated_at)
    VALUES (?, ?, 'active', ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET role = excluded.role, status = 'active', updated_at = excluded.updated_at`)
    .bind(userId, role, actor.userId, now, now).run();
  await recordAdminAudit(actor, "staff_role_assigned", "account_user", userId, { role });
  return json({ ok:true, role });
}

async function removeStaff(request: Request, input: Record<string, unknown>) {
  const actor = await requireAdminAccess(request, "team:manage");
  const userId = cleanText(input.userId, 100);
  if (!userId || actor.userId === userId) throw new AccountError("Choose another staff account.");
  await getAccountDatabase().batch([
    getAccountDatabase().prepare("UPDATE staff_members SET status = 'revoked', updated_at = ? WHERE user_id = ?").bind(Date.now(), userId),
    getAccountDatabase().prepare("DELETE FROM staff_project_access WHERE staff_user_id = ?").bind(userId),
    getAccountDatabase().prepare("DELETE FROM account_sessions WHERE user_id = ?").bind(userId),
  ]);
  await recordAdminAudit(actor, "staff_access_revoked", "account_user", userId);
  return json({ ok:true });
}

async function setProjectAccess(request: Request, input: Record<string, unknown>) {
  const actor = await requireAdminAccess(request, "team:manage");
  const userId = cleanText(input.userId, 100);
  const projectId = cleanText(input.projectId, 100);
  const accessLevel = cleanText(input.accessLevel, 30);
  if (!userId || !projectId || !["manager", "editor", "reviewer"].includes(accessLevel)) throw new AccountError("Choose a staff member, project and access level.");
  const db = getAccountDatabase();
  const eligible = await db.prepare("SELECT user_id FROM staff_members WHERE user_id = ? AND status = 'active' LIMIT 1").bind(userId).first();
  const project = await db.prepare("SELECT id FROM upload_projects WHERE id = ? LIMIT 1").bind(projectId).first();
  if (!eligible) throw new AccountError("Assign a staff role before adding project access.", 409);
  if (!project) throw new AccountError("Project not found.", 404);
  const now = Date.now();
  await db.prepare(`INSERT INTO staff_project_access (staff_user_id, project_id, access_level, granted_by_user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(staff_user_id, project_id) DO UPDATE SET access_level = excluded.access_level, granted_by_user_id = excluded.granted_by_user_id, updated_at = excluded.updated_at`)
    .bind(userId, projectId, accessLevel, actor.userId, now, now).run();
  await recordAdminAudit(actor, "project_access_granted", "upload_project", projectId, { userId, accessLevel });
  return json({ ok:true, userId, projectId, accessLevel });
}

async function removeProjectAccess(request: Request, input: Record<string, unknown>) {
  const actor = await requireAdminAccess(request, "team:manage");
  const userId = cleanText(input.userId, 100);
  const projectId = cleanText(input.projectId, 100);
  if (!userId || !projectId) throw new AccountError("Choose a staff member and project.");
  await getAccountDatabase().prepare("DELETE FROM staff_project_access WHERE staff_user_id = ? AND project_id = ?").bind(userId, projectId).run();
  await recordAdminAudit(actor, "project_access_revoked", "upload_project", projectId, { userId });
  return json({ ok:true });
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
