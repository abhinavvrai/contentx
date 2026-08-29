import { env } from "cloudflare:workers";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";
const USD_INR_RATE = 96;
let paymentSchemaPromise: Promise<void> | null = null;

export const servicePlans = {
  basic_reel: { name: "Basic", amount: 1500 },
  better_edit: { name: "Clean Edit", amount: 2000 },
  growth_reel: { name: "Standard", amount: 2500 },
  premium_motion: { name: "Motion Plus", amount: 3500 },
  advanced_reel: { name: "Premium", amount: 5000 },
  long_basic: { name: "Long-form Basic", amount: 5000 },
  long_standard: { name: "Long-form Standard", amount: 8000 },
  long_premium: { name: "Long-form Premium", amount: 12000 },
  saas_animation: { name: "SaaS Animation · up to 30 seconds", amount: 9000 },
  script_hook: { name: "Hook & Idea Script", amount: 1000 },
  script_full: { name: "Full Reel Script", amount: 1500 },
  script_research: { name: "Research-led Script", amount: 2000 },
  podcast_30: { name: "Podcast Edit · 30 minutes", amount: 5000 },
  podcast_45: { name: "Podcast Edit · 45 minutes", amount: 7500 },
  podcast_60: { name: "Podcast Edit · 60 minutes", amount: 10000 },
  revision_short: { name: "Extra Short-form Revision Round", amount: 300 },
  revision_long: { name: "Extra Long-form Revision Round", amount: 500 },
} as const;

export type PlanId = keyof typeof servicePlans;
export type BillingMode = "monthly" | "one_off";

const reelPlanIds = new Set<PlanId>(["basic_reel", "better_edit", "growth_reel", "premium_motion", "advanced_reel", "saas_animation"]);
const longformPlanIds = new Set<PlanId>(["long_basic", "long_standard", "long_premium"]);
const podcastPlanIds = new Set<PlanId>(["podcast_30", "podcast_45", "podcast_60"]);
const revisionPlanIds = new Set<PlanId>(["revision_short", "revision_long"]);
const revisionPolicies = {
  basic_reel: { service: "video", included: 1 },
  better_edit: { service: "video", included: 2 },
  growth_reel: { service: "video", included: 2 },
  premium_motion: { service: "video", included: 3 },
  advanced_reel: { service: "video", included: 3 },
  saas_animation: { service: "video", included: 2 },
  long_basic: { service: "longform", included: 1 },
  long_standard: { service: "longform", included: 2 },
  long_premium: { service: "longform", included: 3 },
} satisfies Record<string, { service: "video" | "longform"; included: number }>;

export function revisionPolicyForPlan(planId: string) {
  return revisionPolicies[planId as keyof typeof revisionPolicies] || null;
}
const longformScope = {
  long_basic: { includedMinutes: 10, includedRawMinutes: 60 },
  long_standard: { includedMinutes: 10, includedRawMinutes: 120 },
  long_premium: { includedMinutes: 10, includedRawMinutes: 180 },
} satisfies Record<string, { includedMinutes: number; includedRawMinutes: number }>;

export const serviceAddOns = {
  broll_sfx: { name: "B-roll + Sound Design", amount: 500, service: "video" },
  motion_graphics: { name: "Motion Graphics", amount: 500, service: "video" },
  advanced_motion_graphics: { name: "Advanced Motion Graphics", amount: 1500, service: "video" },
  reel_script: { name: "Instagram Reel Script", amount: 500, service: "video" },
  cover_design: { name: "Cover / Thumbnail", amount: 500, service: "video" },
  extra_revision: { name: "Extra Revision Round", amount: 300, service: "video" },
  rush_delivery: { name: "Priority Delivery", amount: 1000, service: "video" },
  quick_delivery: { name: "Quick Delivery", amount: 700, service: "video" },
  long_thumbnail: { name: "Thumbnail / Cover", amount: 700, service: "longform" },
  long_chapters: { name: "Chapters + Description", amount: 700, service: "longform" },
  long_shorts: { name: "2 Shorts From Long Video", amount: 1500, service: "longform" },
  long_motion: { name: "Advanced Motion Pack", amount: 2000, service: "longform" },
  long_extra_revision: { name: "Extra Revision Round", amount: 500, service: "longform" },
  long_rush_delivery: { name: "Priority Delivery", amount: 1000, service: "longform" },
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
      refund_status TEXT NOT NULL DEFAULT 'none',
      refund_reason TEXT,
      refund_amount_paise INTEGER,
      refund_requested_at INTEGER,
      refund_updated_at INTEGER,
      refund_note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`).run().then(async () => {
      await ensurePaymentSchemaColumns(db);
    }).then(() => undefined).catch((error: unknown) => {
      paymentSchemaPromise = null;
      throw error;
    });
  }
  await paymentSchemaPromise;
}

async function ensurePaymentSchemaColumns(db: D1Database): Promise<void> {
  const existing = await db.prepare("PRAGMA table_info(payment_orders)").all<{ name: string }>();
  const names = new Set(existing.results.map((column: { name: string }) => column.name));
  const columns: Array<[string, string]> = [
    ["refund_status", "TEXT NOT NULL DEFAULT 'none'"],
    ["refund_reason", "TEXT"],
    ["refund_amount_paise", "INTEGER"],
    ["refund_requested_at", "INTEGER"],
    ["refund_updated_at", "INTEGER"],
    ["refund_note", "TEXT"],
  ];
  for (const [name, definition] of columns) {
    if (!names.has(name)) await db.prepare(`ALTER TABLE payment_orders ADD COLUMN ${name} ${definition}`).run();
  }
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
  durationMinutes?: unknown;
  rawFootageMinutes?: unknown;
  rawFootageHours?: unknown;
  currency?: unknown;
}) {
  const plan = servicePlans[input.planId as PlanId];
  if (!plan) throw new Error("Choose a valid Content X service.");

  const quantity = Number(input.quantity);
  const planId = input.planId as PlanId;
  const isReelPlan = reelPlanIds.has(planId);
  const isLongformPlan = longformPlanIds.has(planId);
  const isPodcastPlan = podcastPlanIds.has(planId);
  const isRevisionPlan = revisionPlanIds.has(planId);
  const usesBillingPremium = ((isReelPlan && planId !== "saas_animation") || isLongformPlan || isPodcastPlan);
  const billing: BillingMode = input.billing === "monthly" ? "monthly" : "one_off";
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 30) {
    throw new Error("Choose between 1 and 30 items.");
  }
  if (!isReelPlan && !isLongformPlan && !isPodcastPlan && quantity !== 1) {
    throw new Error("Each standalone payment covers one selected service.");
  }
  if (!isReelPlan && !isLongformPlan && !isPodcastPlan && billing !== "one_off") {
    throw new Error("Standalone services use one-time pricing.");
  }
  if (isReelPlan && billing === "monthly" && quantity < 10) {
    throw new Error("Monthly reel production starts at 10 videos.");
  }
  if (isPodcastPlan && billing === "monthly" && quantity < 2) {
    throw new Error("Monthly podcast production starts at 2 episodes.");
  }
  if (isPodcastPlan && quantity > 12) {
    throw new Error("Podcast packages allow up to 12 episodes per order.");
  }
  if (isLongformPlan && billing === "monthly" && quantity < 4) {
    throw new Error("Monthly long-form production starts at 4 videos.");
  }
  if (isLongformPlan && quantity > 8) {
    throw new Error("Long-form packages allow up to 8 videos per order.");
  }

  const unitAmount = plan.amount;
  const service = isPodcastPlan ? "podcast" : isLongformPlan || planId === "revision_long" ? "longform" : "video";
  const requestedAddOns = Array.isArray(input.addOns) ? [...new Set(input.addOns.filter(value => typeof value === "string"))] : [];
  if (isRevisionPlan && requestedAddOns.length) throw new Error("Revision round payments cannot include other add-ons.");
  const addOns = requestedAddOns.map(value => {
    const id = value as AddOnId;
    const addOn = serviceAddOns[id];
    if (!addOn || addOn.service !== service) throw new Error("Choose valid add-ons for this service.");
    return { id, name: addOn.name, unitAmount: addOn.amount, totalAmount: addOn.amount * quantity };
  });
  const baseAmount = unitAmount * quantity;
  const addOnAmount = addOns.reduce((total, addOn) => total + addOn.totalAmount, 0);
  const adjustments: Array<{ id: string; name: string; unitAmount: number; totalAmount: number }> = [];
  if (isLongformPlan) {
    const scope = longformScope[planId as keyof typeof longformScope];
    const durationMinutes = Number(input.durationMinutes || scope.includedMinutes);
    const legacyRawHours = Number(input.rawFootageHours);
    const rawFootageMinutes = Number(input.rawFootageMinutes ?? (Number.isFinite(legacyRawHours) && legacyRawHours > 0 ? legacyRawHours * 60 : scope.includedRawMinutes));
    if (!Number.isInteger(durationMinutes) || durationMinutes < scope.includedMinutes || durationMinutes > 60) {
      throw new Error("Long-form final length must match the selected package and stay within 60 minutes.");
    }
    if (!Number.isInteger(rawFootageMinutes) || rawFootageMinutes < scope.includedRawMinutes || rawFootageMinutes > 600 || rawFootageMinutes % 15 !== 0) {
      throw new Error("Raw footage review must use 15-minute steps, match the selected package, and stay within 600 minutes.");
    }
    const extraMinutes = durationMinutes - scope.includedMinutes;
    const extraRawMinutes = rawFootageMinutes - scope.includedRawMinutes;
    if (extraMinutes) adjustments.push({ id: "longform_extra_minutes", name: `Extra final length · ${extraMinutes} min`, unitAmount: extraMinutes * 400, totalAmount: extraMinutes * 400 * quantity });
    if (extraRawMinutes) {
      const rawFootageBands = extraRawMinutes / 15;
      adjustments.push({ id: "longform_raw_review", name: `Extra raw footage review · ${extraRawMinutes} min`, unitAmount: rawFootageBands * 200, totalAmount: rawFootageBands * 200 * quantity });
    }
  }
  const adjustmentAmount = adjustments.reduce((total, item) => total + item.totalAmount, 0);
  const subtotalAmount = baseAmount + addOnAmount + adjustmentAmount;
  const billingPremiumAmount = billing === "one_off" && usesBillingPremium ? Math.round(subtotalAmount * 0.2) : 0;
  const totalAmount = subtotalAmount + billingPremiumAmount;
  const currency = input.currency === "USD" ? "USD" : "INR";
  const totalAmountMinor = currency === "USD" ? roundedUsdFromInr(totalAmount) * 100 : totalAmount * 100;

  return {
    billing,
    planId,
    planName: plan.name,
    quantity,
    unitAmount,
    baseAmount,
    addOns,
    addOnAmount,
    adjustments,
    adjustmentAmount,
    subtotalAmount,
    billingPremiumAmount,
    totalAmount,
    currency,
    settlementCurrency: "INR",
    totalAmountPaise: totalAmountMinor,
    totalAmountInrPaise: totalAmount * 100,
  };
}

function roundedUsdFromInr(amount: number) {
  if (!amount) return 0;
  return Math.max(5, Math.ceil(amount / USD_INR_RATE / 5) * 5);
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
      currency: order.currency,
      receipt,
      notes: {
        plan: order.planId,
        billing: order.billing,
        quantity: String(order.quantity),
        settlement_currency: order.settlementCurrency,
        add_ons: [...order.addOns, ...order.adjustments].map(addOn => addOn.id).join(",").slice(0, 240),
      },
    }),
  });

  const payload = await response.json() as { id?: string; error?: { description?: string } };
  if (!response.ok || !payload.id) {
    throw new Error(payload.error?.description || "Razorpay could not create the order.");
  }

  return { orderId: payload.id, receipt };
}
