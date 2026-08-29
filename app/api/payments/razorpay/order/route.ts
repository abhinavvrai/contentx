import { calculateOrder, createRazorpayOrder, ensurePaymentSchema, json } from "../../../../../lib/razorpay";
import { getDb } from "../../../../../db";
import { paymentOrders } from "../../../../../db/schema";
import { AccountError, ensureAccountSchema, getAccountDatabase, requireSameOrigin, requireSessionUser } from "../../../../../lib/auth";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await Promise.all([ensureAccountSchema(), ensurePaymentSchema()]);
    const user = await requireSessionUser(request);
    const input = await request.json() as { planId?: string; quantity?: number; billing?: string; addOns?: string[]; durationMinutes?: number; rawFootageMinutes?: number; rawFootageHours?: number; currency?: string; contentType?: string; deliveryFormat?: string; name?: string; email?: string; phone?: string };
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
    const contentType = order.planId.startsWith("podcast_") ? "podcast" : order.planId.startsWith("long_") ? "longform" : "video";
    const deliveryFormat = input.deliveryFormat?.trim().slice(0, 80) || null;
    await getAccountDatabase().prepare(`INSERT INTO order_selections
      (razorpay_order_id, user_id, content_type, delivery_format, add_ons_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(razorpay.orderId, user.id, contentType, deliveryFormat, JSON.stringify([...order.addOns, ...order.adjustments]), now.getTime()).run();

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
