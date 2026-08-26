import { env } from "cloudflare:workers";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";
let paymentSchemaPromise: Promise<void> | null = null;

export const servicePlans = {
  basic_reel: { name: "Basic", amount: 1500 },
  better_edit: { name: "Clean Edit", amount: 2000 },
  growth_reel: { name: "Standard", amount: 2500 },
  premium_motion: { name: "Motion Plus", amount: 3500 },
  advanced_reel: { name: "Premium", amount: 5000 },
  saas_animation: { name: "SaaS Animation · up to 30 seconds", amount: 9000 },
  script_hook: { name: "Hook & Idea Script", amount: 1000 },
  script_full: { name: "Full Reel Script", amount: 1500 },
  script_research: { name: "Research-led Script", amount: 2000 },
  podcast_30: { name: "Podcast Edit · 30 minutes", amount: 5000 },
  podcast_45: { name: "Podcast Edit · 45 minutes", amount: 7500 },
  podcast_60: { name: "Podcast Edit · 60 minutes", amount: 10000 },
} as const;

export type PlanId = keyof typeof servicePlans;
export type BillingMode = "monthly" | "one_off";

const reelPlanIds = new Set<PlanId>(["basic_reel", "better_edit", "growth_reel", "premium_motion", "advanced_reel", "saas_animation"]);
const podcastPlanIds = new Set<PlanId>(["podcast_30", "podcast_45", "podcast_60"]);

export const serviceAddOns = {
  broll_sfx: { name: "B-roll + Sound Design", amount: 500, service: "video" },
  motion_graphics: { name: "Motion Graphics", amount: 500, service: "video" },
  advanced_motion_graphics: { name: "Advanced Motion Graphics", amount: 1500, service: "video" },
  reel_script: { name: "Instagram Reel Script", amount: 500, service: "video" },
  cover_design: { name: "Cover / Thumbnail", amount: 500, service: "video" },
  extra_revision: { name: "Extra Revision Round", amount: 300, service: "video" },
  rush_delivery: { name: "Priority Delivery", amount: 1000, service: "video" },
  quick_delivery: { name: "Quick Delivery", amount: 700, service: "video" },
  podcast_script: { name: "Podcast Episode Script", amount: 1500, service: "podcast" },
  podcast_notes: { name: "Show Notes & Chapters", amount: 500, service: "podcast" },
  podcast_clips: { name: "Two Short Social Clips", amount: 1500, service: "podcast" },
  podcast_cover: { name: "Episode Cover", amount: 500, service: "podcast" },
} as const;

type AddOnId = keyof typeof serviceAddOns;

export async function ensurePaymentSchema(): Promise<void> {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error("Payment database is unavailable.");
  if (!paymentSchemaPromise) {
    paymentSchemaPromise = db.prepare(`CREATE TABLE IF NOT EXISTS payment_orders (
      razorpay_order_id TEXT PRIMARY KEY NOT NULL,
      receipt TEXT NOT NULL UNIQUE,
      plan_id TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      billing TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      amount_paise INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL,
      payment_id TEXT,
      customer_name TEXT,
      customer_email TEXT,
      customer_phone TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`).run().then(() => undefined).catch(error => {
      paymentSchemaPromise = null;
      throw error;
    });
  }
  await paymentSchemaPromise;
}

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
  addOns?: unknown;
}) {
  const plan = servicePlans[input.planId as PlanId];
  if (!plan) throw new Error("Choose a valid Content X service.");

  const quantity = Number(input.quantity);
  const planId = input.planId as PlanId;
  const isReelPlan = reelPlanIds.has(planId);
  const isPodcastPlan = podcastPlanIds.has(planId);
  const billing: BillingMode = input.billing === "monthly" ? "monthly" : "one_off";
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 30) {
    throw new Error("Choose between 1 and 30 items.");
  }
  if (!isReelPlan && !isPodcastPlan && quantity !== 1) {
    throw new Error("Each standalone script payment covers one selected service.");
  }
  if (!isReelPlan && !isPodcastPlan && billing !== "one_off") {
    throw new Error("Standalone scripts use one-time pricing.");
  }
  if (isReelPlan && billing === "monthly" && quantity < 10) {
    throw new Error("Monthly reel production starts at 10 videos.");
  }
  if (isPodcastPlan && billing === "monthly" && quantity < 4) {
    throw new Error("Monthly podcast production starts at 4 episodes.");
  }

  const unitAmount = plan.amount;
  const service = isPodcastPlan ? "podcast" : "video";
  const requestedAddOns = Array.isArray(input.addOns) ? [...new Set(input.addOns.filter(value => typeof value === "string"))] : [];
  const addOns = requestedAddOns.map(value => {
    const id = value as AddOnId;
    const addOn = serviceAddOns[id];
    if (!addOn || addOn.service !== service) throw new Error("Choose valid add-ons for this service.");
    return { id, name: addOn.name, unitAmount: addOn.amount, totalAmount: addOn.amount * quantity };
  });
  const baseAmount = unitAmount * quantity;
  const addOnAmount = addOns.reduce((total, addOn) => total + addOn.totalAmount, 0);
  const totalAmount = baseAmount + addOnAmount;

  return {
    billing,
    planId,
    planName: plan.name,
    quantity,
    unitAmount,
    baseAmount,
    addOns,
    addOnAmount,
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
        add_ons: order.addOns.map(addOn => addOn.id).join(",").slice(0, 240),
      },
    }),
  });

  const payload = await response.json() as { id?: string; error?: { description?: string } };
  if (!response.ok || !payload.id) {
    throw new Error(payload.error?.description || "Razorpay could not create the order.");
  }

  return { orderId: payload.id, receipt };
}
