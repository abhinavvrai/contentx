import { getRazorpayConfig, json } from "../../../../../lib/razorpay";

export async function GET() {
  try {
    return json({ keyId: getRazorpayConfig().keyId });
  } catch {
    return json({ error: "Payments are not configured yet." }, 503);
  }
}
