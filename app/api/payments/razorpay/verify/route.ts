import { getRazorpayConfig, json, signHmacSha256, timingSafeEqual } from "../../../../../lib/razorpay";
import { getDb } from "../../../../../db";
import { paymentOrders } from "../../../../../db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
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
    const expectedSignature = await signHmacSha256(`${orderId}|${paymentId}`, keySecret);
    if (!timingSafeEqual(expectedSignature, signature)) {
      return json({ error: "Payment signature could not be verified." }, 400);
    }

    await db.update(paymentOrders).set({ status: "verified", paymentId, updatedAt: new Date() }).where(eq(paymentOrders.razorpayOrderId, orderId));
    return json({ verified: true, paymentId, orderId, planName: paymentOrder.planName });
  } catch {
    return json({ error: "Payment verification is unavailable." }, 503);
  }
}
