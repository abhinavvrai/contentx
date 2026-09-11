import { env } from "cloudflare:workers";
import { AccountError, getAccountDatabase, getSessionUser } from "./auth";
import { requireOwner } from "./uploads";

export type StaffRole = "owner" | "admin" | "project_manager" | "editor" | "reviewer" | "finance";
export type AdminPermission = "clients:read" | "clients:manage" | "payments:read" | "payments:manage" | "team:manage" | "audit:read";
export type AdminIdentity = { userId: string | null; email: string; role: StaffRole; via: "account" | "owner-token" };

const rolePermissions: Record<StaffRole, ReadonlySet<AdminPermission>> = {
  owner: new Set(["clients:read", "clients:manage", "payments:read", "payments:manage", "team:manage", "audit:read"]),
  admin: new Set(["clients:read", "clients:manage", "payments:read", "payments:manage", "audit:read"]),
  project_manager: new Set(["clients:read"]),
  editor: new Set(),
  reviewer: new Set(),
  finance: new Set(["payments:read", "payments:manage"]),
};

export async function requireAdminAccess(request: Request, permission: AdminPermission): Promise<AdminIdentity> {
  const user = await getSessionUser(request);
  const ownerEmail = String((env as unknown as { CONTENTX_OWNER_EMAIL?: string }).CONTENTX_OWNER_EMAIL || "").trim().toLowerCase();
  if (user && ownerEmail && user.email.toLowerCase() === ownerEmail) return { userId:user.id, email:user.email, role:"owner", via:"account" };
  if (user) {
    const row = await getAccountDatabase().prepare("SELECT role FROM staff_members WHERE user_id = ? AND status = 'active' LIMIT 1")
      .bind(user.id).first<{ role:string }>();
    if (row && isStaffRole(row.role) && rolePermissions[row.role].has(permission)) return { userId:user.id, email:user.email, role:row.role, via:"account" };
  }
  if (request.headers.get("x-contentx-owner-token")) {
    await requireOwner(request);
    return { userId:null, email:ownerEmail || "owner-token", role:"owner", via:"owner-token" };
  }
  throw new AccountError("Sign in with an authorized staff account.", 403);
}

export async function recordAdminAudit(actor: AdminIdentity, action: string, targetType: string, targetId: string, details: Record<string, unknown> = {}) {
  await getAccountDatabase().prepare(`INSERT INTO admin_audit_log
    (id, actor_user_id, actor_email, action, target_type, target_id, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      `audit_${crypto.randomUUID().replaceAll("-", "")}`, actor.userId, actor.email, action, targetType, targetId,
      JSON.stringify(details), Date.now(),
    ).run();
}

export function isStaffRole(value: string): value is StaffRole {
  return ["owner", "admin", "project_manager", "editor", "reviewer", "finance"].includes(value);
}
