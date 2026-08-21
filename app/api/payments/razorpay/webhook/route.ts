import { ensurePaymentSchema, getRazorpayConfig, json, signHmacSha256, timingSafeEqual } from "../../../../../lib/razorpay";
import { getDb } from "../../../../../db";
import { paymentOrders } from "../../../../../db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  const rawBody = await request.text();
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) return json({ error: "Webhook is not configured." }, 400);

  const expectedSignature = await signHmacSha256(rawBody, webhookSecret);
  if (!timingSafeEqual(expectedSignature, signature)) {
    return json({ error: "Webhook signature could not be verified." }, 400);
  }

  try {
    await ensurePaymentSchema();
    getRazorpayConfig();
    const event = JSON.parse(rawBody) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
    const payment = event.payload?.payment?.entity;
    if ((event.event === "payment.captured" || event.event === "order.paid") && payment?.order_id) {
      await getDb().update(paymentOrders).set({ status: "captured", paymentId: payment.id || null, updatedAt: new Date() }).where(eq(paymentOrders.razorpayOrderId, payment.order_id));
    }
    return json({ received: true, event: event.event || "unknown" });
  } catch {
    return json({ error: "Invalid webhook payload." }, 400);
  }
}
