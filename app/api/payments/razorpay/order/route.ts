import { calculateOrder, createRazorpayOrder, json } from "../../../../../lib/razorpay";

export async function POST(request: Request) {
  try {
    const input = await request.json() as { planId?: string; quantity?: number; billing?: string };
    const order = calculateOrder({
      planId: input.planId || "",
      quantity: input.quantity,
      billing: input.billing,
    });
    const razorpay = await createRazorpayOrder(order);

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
