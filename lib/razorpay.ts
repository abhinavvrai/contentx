const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

export const shortFormPlans = {
  basic: { name: "Basic short-form reel", amount: 1500 },
  better_edit: { name: "Better edit reel", amount: 2500 },
  premium_motion: { name: "Premium motion reel", amount: 3500 },
} as const;

export type PlanId = keyof typeof shortFormPlans;
export type BillingMode = "monthly" | "one_off";

export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured yet.");
  }

  return { keyId, keySecret };
}

export function calculateOrder(input: {
  planId: string;
  quantity: unknown;
  billing: unknown;
}) {
  const plan = shortFormPlans[input.planId as PlanId];
  if (!plan) throw new Error("Choose a valid short-form package.");

  const quantity = Number(input.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 30) {
    throw new Error("Choose between 1 and 30 reels.");
  }

  const billing: BillingMode = input.billing === "monthly" ? "monthly" : "one_off";
  const unitAmount = billing === "one_off" ? Math.round(plan.amount * 1.2) : plan.amount;
  const totalAmount = unitAmount * quantity;

  return {
    billing,
    planId: input.planId as PlanId,
    planName: plan.name,
    quantity,
    unitAmount,
    totalAmount,
    totalAmountPaise: totalAmount * 100,
  };
}

export function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function signHmacSha256(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function createRazorpayOrder(order: ReturnType<typeof calculateOrder>) {
  const { keyId, keySecret } = getRazorpayConfig();
  const receipt = `cx_${crypto.randomUUID().replaceAll("-", "").slice(0, 32)}`;
  const credentials = btoa(`${keyId}:${keySecret}`);
  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: order.totalAmountPaise,
      currency: "INR",
      receipt,
      notes: {
        plan: order.planId,
        billing: order.billing,
        quantity: String(order.quantity),
      },
    }),
  });

  const payload = await response.json() as { id?: string; error?: { description?: string } };
  if (!response.ok || !payload.id) {
    throw new Error(payload.error?.description || "Razorpay could not create the order.");
  }

  return { orderId: payload.id, receipt };
}
