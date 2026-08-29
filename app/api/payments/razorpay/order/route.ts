import { calculateOrder, createRazorpayOrder, ensurePaymentSchema, json, revisionPolicyForPlan } from "../../../../../lib/razorpay";
import { getDb } from "../../../../../db";
import { paymentOrders } from "../../../../../db/schema";
import { AccountError, ensureAccountSchema, getAccountDatabase, requireSameOrigin, requireSessionUser } from "../../../../../lib/auth";
import { ensureUploadSchema } from "../../../../../lib/uploads";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await Promise.all([ensureAccountSchema(), ensurePaymentSchema(), ensureUploadSchema()]);
    const user = await requireSessionUser(request);
    const input = await request.json() as { planId?: string; quantity?: number; billing?: string; addOns?: string[]; durationMinutes?: number; rawFootageMinutes?: number; rawFootageHours?: number; currency?: string; contentType?: string; deliveryFormat?: string; projectId?: string; assetId?: string; name?: string; email?: string; phone?: string };
    const revisionPurchase = input.planId === "revision_short" || input.planId === "revision_long";
    let targetProjectId: string | null = null;
    let targetAssetId: string | null = null;
    if (revisionPurchase) {
      targetProjectId = input.projectId?.trim().slice(0, 80) || null;
      targetAssetId = input.assetId?.trim().slice(0, 80) || null;
      if (!targetProjectId || !targetAssetId) throw new AccountError("Choose the video that needs another revision round.", 400);
      const database = getAccountDatabase();
      const target = await database.prepare(`SELECT u.project_id, p.plan_id, p.status, p.refund_status
        FROM user_upload_projects u
        JOIN payment_orders p ON p.razorpay_order_id = u.razorpay_order_id
        WHERE u.project_id = ? AND u.user_id = ? LIMIT 1`)
        .bind(targetProjectId, user.id).first<{ project_id: string; plan_id: string; status: string; refund_status?: string | null }>();
      const policy = target ? revisionPolicyForPlan(target.plan_id) : null;
      if (!target || !policy) throw new AccountError("This project does not have a paid revision package.", 403);
      if (!["verified", "captured"].includes(target.status) || ["requested", "processing", "refunded"].includes(target.refund_status || "")) {
        throw new AccountError("The original project payment must be active before buying another revision.", 409);
      }
      const expectedPlan = policy.service === "longform" ? "revision_long" : "revision_short";
      if (input.planId !== expectedPlan) throw new AccountError("Choose the revision price assigned to this project.", 400);
      const asset = await database.prepare(`SELECT COUNT(*) AS version_count FROM upload_files
        WHERE project_id = ? AND COALESCE(asset_id, id) = ? AND status = 'ready' AND content_type LIKE 'video/%'`)
        .bind(targetProjectId, targetAssetId).first<{ version_count: number }>();
      if (!asset || Number(asset.version_count || 0) < 1) throw new AccountError("Choose a video from this project.", 400);
      const purchased = await database.prepare(`SELECT COUNT(*) AS purchased FROM order_selections s
        JOIN payment_orders p ON p.razorpay_order_id = s.razorpay_order_id
        WHERE s.project_id = ? AND s.asset_id = ? AND p.plan_id IN ('revision_short', 'revision_long')
          AND p.status IN ('verified', 'captured')
          AND COALESCE(p.refund_status, 'none') NOT IN ('requested', 'processing', 'refunded')`)
        .bind(targetProjectId, targetAssetId).first<{ purchased: number }>();
      const usedRounds = Math.max(0, Number(asset.version_count) - 1);
      const availableRounds = policy.included + Number(purchased?.purchased || 0);
      if (usedRounds < availableRounds) throw new AccountError(`This video still has ${availableRounds - usedRounds} revision round available.`, 409);
    }
    const order = calculateOrder({
      planId: input.planId || "",
      quantity: input.quantity,
      billing: input.billing,
      addOns: input.addOns,
      durationMinutes: input.durationMinutes,
      rawFootageMinutes: input.rawFootageMinutes,
      rawFootageHours: input.rawFootageHours,
      currency: input.currency,
    });
    const razorpay = await createRazorpayOrder(order);
    const now = new Date();
    await getDb().insert(paymentOrders).values({
      razorpayOrderId: razorpay.orderId,
      receipt: razorpay.receipt,
      planId: order.planId,
      planName: order.planName,
      billing: order.billing,
      quantity: order.quantity,
      amountPaise: order.totalAmountPaise,
      currency: order.currency,
      status: "created",
      customerName: input.name?.trim().slice(0, 120) || user.name,
      customerEmail: input.email?.trim().toLowerCase().slice(0, 254) || user.email,
      customerPhone: input.phone?.trim().slice(0, 32) || null,
      createdAt: now,
      updatedAt: now,
    });
    const contentType = order.planId.startsWith("podcast_") ? "podcast" : order.planId.startsWith("long_") || order.planId === "revision_long" ? "longform" : "video";
    const deliveryFormat = input.deliveryFormat?.trim().slice(0, 80) || null;
    await getAccountDatabase().prepare(`INSERT INTO order_selections
      (razorpay_order_id, user_id, content_type, delivery_format, add_ons_json, project_id, asset_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(razorpay.orderId, user.id, contentType, deliveryFormat, JSON.stringify([...order.addOns, ...order.adjustments]), targetProjectId, targetAssetId, now.getTime()).run();

    return json({
      orderId: razorpay.orderId,
      amount: order.totalAmountPaise,
      currency: order.currency,
      settlementCurrency: order.settlementCurrency,
      plan: order,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create your payment order.";
    const status = error instanceof AccountError ? error.status : message.includes("valid") || message.includes("between") || message.includes("add-on") ? 400 : 503;
    return json({ error: message }, status);
  }
}
