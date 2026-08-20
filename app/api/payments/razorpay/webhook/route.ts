import { getRazorpayConfig, json, signHmacSha256, timingSafeEqual } from "../../../../../lib/razorpay";

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
    getRazorpayConfig();
    const event = JSON.parse(rawBody) as { event?: string };
    return json({ received: true, event: event.event || "unknown" });
  } catch {
    return json({ error: "Invalid webhook payload." }, 400);
  }
}
