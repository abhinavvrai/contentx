import { calculateOrder, createRazorpayOrder, json } from "../../../../../lib/razorpay";
import { getDb } from "../../../../../db";
import { paymentOrders } from "../../../../../db/schema";

export async function POST(request: Request) {
  try {
    const input = await request.json() as { planId?: string; quantity?: number; billing?: string; name?: string; email?: string; phone?: string };
    const order = calculateOrder({
      planId: input.planId || "",
      quantity: input.quantity,
      billing: input.billing,
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
      currency: "INR",
      status: "created",
      customerName: input.name?.trim().slice(0, 120) || null,
      customerEmail: input.email?.trim().toLowerCase().slice(0, 254) || null,
      customerPhone: input.phone?.trim().slice(0, 32) || null,
      createdAt: now,
      updatedAt: now,
    });

    return json({
      orderId: razorpay.orderId,
      amount: order.totalAmountPaise,
      currency: "INR",
      plan: order,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create your payment order.";
    const status = message.includes("valid") || message.includes("between") ? 400 : 503;
    return json({ error: message }, status);
  }
}
