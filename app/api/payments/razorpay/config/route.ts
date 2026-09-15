import { getRazorpayConfig, json, paymentRegionForRequest } from "../../../../../lib/razorpay";

export async function GET(request: Request) {
  try {
    const region = paymentRegionForRequest(request);
    return json({ keyId: getRazorpayConfig().keyId, currency: region.currency || "USD", country: region.country });
  } catch {
    return json({ error: "Payments are not configured yet." }, 503);
  }
}
