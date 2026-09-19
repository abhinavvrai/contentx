import { ensurePaymentSchema, json } from "../../../../../lib/razorpay";
import { getDb } from "../../../../../db";
import { paymentOrders } from "../../../../../db/schema";
import { eq } from "drizzle-orm";
import { ensureAccountSchema, requireSameOrigin } from "../../../../../lib/auth";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await Promise.all([ensureAccountSchema(), ensurePaymentSchema()]);
    const input = await request.json() as {
      name?: string;
      email?: string;
      phone?: string;
      planName?: string;
      planId?: string;
      amount?: number;
      currency?: string;
      reference?: string;
      code?: string;
      orderId?: string;
    };

    const orderId = (input.orderId || `wise_${Date.now()}`).trim();
    const receipt = `rcpt_${orderId}`;
    const amountPaise = Math.round(Number(input.amount || 0) * 100);
    const db = getDb();

    const existing = await db.select().from(paymentOrders).where(eq(paymentOrders.razorpayOrderId, orderId)).get();
    if (!existing) {
      await db.insert(paymentOrders).values({
        razorpayOrderId: orderId,
        receipt,
        planId: input.planId || "wise_custom",
        planName: input.planName || "Content X Package",
        billing: "one_off",
        quantity: 1,
        amountPaise,
        currency: input.currency || "USD",
        status: "verified",
        paymentId: input.reference || "wise_pay",
        customerName: input.name || "Wise Client",
        customerEmail: input.email || "",
        customerPhone: input.phone || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return json({
      verified: true,
      orderId,
      paymentId: input.reference || orderId,
      planName: input.planName || "Content X Package",
      payUrl: "https://wise.com/pay/business/abhinavrai"
    });
  } catch (error: any) {
    return json({ error: error?.message || "Wise payment confirmation unavailable." }, 500);
  }
}
