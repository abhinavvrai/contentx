import { AccountError, ensureAccountSchema, getAccountDatabase, requireSameOrigin } from "../../../../lib/auth";
import { recordAdminAudit, requireAdminAccess } from "../../../../lib/admin-access";
import { ensurePaymentSchema, json, normalizeCouponCode } from "../../../../lib/razorpay";

export async function GET(request: Request) {
  try {
    await ensureAccountSchema();
    await ensurePaymentSchema();
    const actor = await requireAdminAccess(request, "payments:read");
    const db = getAccountDatabase();
    const [codes, redemptions] = await Promise.all([
      db.prepare(`SELECT c.*,
        COUNT(r.id) AS redemption_count,
        COALESCE(SUM(CASE WHEN r.status = 'earned' THEN r.discount_paise ELSE 0 END), 0) AS total_discount_paise,
        COALESCE(SUM(CASE WHEN r.status = 'earned' THEN r.commission_paise ELSE 0 END), 0) AS total_commission_paise
        FROM discount_codes c LEFT JOIN discount_redemptions r ON r.discount_code_id = c.id
        GROUP BY c.id ORDER BY c.updated_at DESC LIMIT 250`).all<Record<string, unknown>>(),
      db.prepare(`SELECT r.*, c.code, c.affiliate_name, c.affiliate_email, p.amount_paise, p.currency,
        p.customer_name FROM discount_redemptions r
        JOIN discount_codes c ON c.id = r.discount_code_id
        JOIN payment_orders p ON p.razorpay_order_id = r.razorpay_order_id
        ORDER BY r.created_at DESC LIMIT 250`).all<Record<string, unknown>>(),
    ]);
    return json({ admin:{ email:actor.email, role:actor.role }, codes:codes.results, redemptions:redemptions.results });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await ensureAccountSchema();
    await ensurePaymentSchema();
    const actor = await requireAdminAccess(request, "payments:manage");
    const input = await request.json() as Record<string, unknown>;
    const action = text(input.action, 40);
    const db = getAccountDatabase();
    if (action === "set_coupon_status") {
      const id = text(input.id, 100);
      const status = input.status === "active" ? "active" : input.status === "paused" ? "paused" : "";
      if (!id || !status) throw new AccountError("Choose a coupon and a valid status.");
      const result = await db.prepare("UPDATE discount_codes SET status = ?, updated_at = ? WHERE id = ?")
        .bind(status, Date.now(), id).run();
      if (!result.meta.changes) throw new AccountError("Coupon code not found.", 404);
      await recordAdminAudit(actor, status === "active" ? "coupon_activated" : "coupon_paused", "discount_code", id);
      return json({ ok:true, status });
    }
    if (action !== "save_coupon") throw new AccountError("Choose a valid coupon action.", 404);

    const requestedId = text(input.id, 100);
    const existing = requestedId
      ? await db.prepare("SELECT id, code FROM discount_codes WHERE id = ? LIMIT 1").bind(requestedId).first<{ id:string; code:string }>()
      : null;
    if (requestedId && !existing) throw new AccountError("Coupon code not found.", 404);
    const code = existing?.code || normalizeCouponCode(input.code);
    const discountType = input.discountType === "fixed" ? "fixed" : "percent";
    const discountValue = integer(input.discountValue, 1, discountType === "percent" ? 100 : 1_000_000);
    const assignedCustomerEmail = email(input.assignedCustomerEmail, true);
    const affiliateName = text(input.affiliateName, 120) || null;
    const affiliateEmail = email(input.affiliateEmail, true);
    const commissionPercent = integer(input.commissionPercent ?? 0, 0, 100);
    const maxUses = input.maxUses === "" || input.maxUses === null || input.maxUses === undefined ? null : integer(input.maxUses, 1, 1_000_000);
    const expiresAt = input.expiresAt ? Number(input.expiresAt) : null;
    const status = input.status === "paused" ? "paused" : "active";
    if (code.length < 3) throw new AccountError("Use at least 3 letters or numbers for the coupon code.");
    if (!discountValue) throw new AccountError("Enter a valid discount value.");
    if (input.assignedCustomerEmail && !assignedCustomerEmail) throw new AccountError("Enter a valid assigned customer email.");
    if (input.affiliateEmail && !affiliateEmail) throw new AccountError("Enter a valid partner email.");
    if (commissionPercent > 0 && (!affiliateName || !affiliateEmail)) throw new AccountError("Add the partner name and email before assigning commission.");
    if (expiresAt !== null && (!Number.isFinite(expiresAt) || expiresAt <= Date.now())) throw new AccountError("Choose a future expiry date.");
    const now = Date.now();
    const id = existing?.id || `coupon_${crypto.randomUUID().replaceAll("-", "")}`;
    if (existing) {
      await db.prepare(`UPDATE discount_codes SET discount_type = ?, discount_value = ?, status = ?,
        assigned_customer_email = ?, affiliate_name = ?, affiliate_email = ?, commission_percent = ?,
        max_uses = ?, expires_at = ?, updated_at = ? WHERE id = ?`).bind(
          discountType, discountValue, status, assignedCustomerEmail, affiliateName, affiliateEmail,
          commissionPercent, maxUses, expiresAt, now, id,
        ).run();
    } else {
      try {
        await db.prepare(`INSERT INTO discount_codes
          (id, code, discount_type, discount_value, status, assigned_customer_email, affiliate_name,
            affiliate_email, commission_percent, max_uses, uses_count, expires_at, created_by_email, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`).bind(
            id, code, discountType, discountValue, status, assignedCustomerEmail, affiliateName,
            affiliateEmail, commissionPercent, maxUses, expiresAt, actor.email, now, now,
          ).run();
      } catch (error) {
        if (String(error).toLowerCase().includes("unique")) throw new AccountError("That coupon code already exists.", 409);
        throw error;
      }
    }
    await recordAdminAudit(actor, existing ? "coupon_updated" : "coupon_created", "discount_code", id, {
      code, discountType, discountValue, assignedCustomerEmail, affiliateEmail, commissionPercent, maxUses, expiresAt, status,
    });
    return json({ ok:true, id, code }, existing ? 200 : 201);
  } catch (error) {
    return failure(error);
  }
}

function text(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function email(value: unknown, optional = false) {
  const candidate = text(value, 254).toLowerCase();
  if (!candidate && optional) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : null;
}

function integer(value: unknown, minimum: number, maximum: number) {
  const candidate = Number(value);
  return Number.isInteger(candidate) && candidate >= minimum && candidate <= maximum ? candidate : 0;
}

function failure(error: unknown) {
  if (error instanceof AccountError || error instanceof Error && "status" in error) {
    const status = typeof (error as { status?:unknown }).status === "number" ? Number((error as { status:number }).status) : 400;
    return json({ error:error instanceof Error ? error.message : "Coupon request failed." }, status);
  }
  console.error("Content X coupon admin error", error);
  return json({ error:"Coupon service is temporarily unavailable." }, 503);
}
