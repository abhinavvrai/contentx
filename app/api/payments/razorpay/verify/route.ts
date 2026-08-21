import { ensurePaymentSchema, getRazorpayConfig, json, signHmacSha256, timingSafeEqual } from "../../../../../lib/razorpay";
import { getDb } from "../../../../../db";
import { paymentOrders } from "../../../../../db/schema";
import { eq } from "drizzle-orm";
import { AccountError, ensureAccountSchema, getAccountDatabase, requireSameOrigin, requireSessionUser } from "../../../../../lib/auth";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await Promise.all([ensureAccountSchema(), ensurePaymentSchema()]);
    const user = await requireSessionUser(request);
    const input = await request.json() as {
      razorpay_payment_id?: string;
      razorpay_order_id?: string;
      razorpay_signature?: string;
    };
    const paymentId = input.razorpay_payment_id?.trim();
    const orderId = input.razorpay_order_id?.trim();
    const signature = input.razorpay_signature?.trim();

    if (!paymentId || !orderId || !signature) {
      return json({ error: "Payment verification details are missing." }, 400);
    }

    const { keySecret } = getRazorpayConfig();
    const db = getDb();
    const paymentOrder = await db.select().from(paymentOrders).where(eq(paymentOrders.razorpayOrderId, orderId)).get();
    if (!paymentOrder) return json({ error: "This payment order was not created by Content X." }, 400);
    const ownership = await getAccountDatabase().prepare("SELECT razorpay_order_id FROM order_selections WHERE razorpay_order_id = ? AND user_id = ? LIMIT 1")
      .bind(orderId, user.id).first();
    if (!ownership) return json({ error: "This payment order does not belong to your account." }, 403);
    const expectedSignature = await signHmacSha256(`${orderId}|${paymentId}`, keySecret);
    if (!timingSafeEqual(expectedSignature, signature)) {
      return json({ error: "Payment signature could not be verified." }, 400);
    }

    await db.update(paymentOrders).set({ status: "verified", paymentId, updatedAt: new Date() }).where(eq(paymentOrders.razorpayOrderId, orderId));
    return json({ verified: true, paymentId, orderId, planName: paymentOrder.planName });
  } catch (error) {
    if (error instanceof AccountError) return json({ error: error.message }, error.status);
    return json({ error: "Payment verification is unavailable." }, 503);
  }
}
