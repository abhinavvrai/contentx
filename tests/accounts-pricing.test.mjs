import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const load = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("presents Basic, Standard and Premium with quantified scopes", async () => {
  const features = await load("public/site/src/features.js");
  for (const price of [1500, 2000, 3500]) {
    assert.match(features, new RegExp(`price:${price}`));
  }
  for (const plan of ["Basic", "Standard", "Premium"]) assert.match(features, new RegExp(`name:"${plan}"`));
  assert.match(features, /1 reel up to 60 seconds/);
  assert.match(features, /Quick Delivery", price:700/);
  assert.match(features, />Short-form</);
  assert.match(features, /Stickers, emojis and simple highlights/);
  assert.match(features, /B-roll placement and visual cutaways/);
  assert.match(features, /Up to 10 relevant B-roll inserts/);
  assert.match(features, /state\.billing === "monthly" \? Math\.max\(minimumQuantity\(\), state\.quantity\) : 1/);
  assert.match(features, /range:"₹2,000–₹2,500"/);
  assert.match(features, /range:"₹3,500–₹5,000"/);
  assert.match(features, /availableAddOns:\["motion_graphics", "reel_script", "cover_design", "extra_revision"\]/);
  assert.match(features, /availableAddOns:\["advanced_motion_graphics", "reel_script", "cover_design", "rush_delivery", "extra_revision"\]/);
  assert.match(features, /Extra B-roll \+ Sound Design", price:500/);
  assert.match(features, /Motion Graphics", price:500/);
  assert.match(features, /Advanced Motion Graphics", price:1500/);
  assert.match(features, /Optional upgrades for \$\{plan\.name\}/);
  assert.match(features, /addOnsRevealed:false/);
  assert.match(features, /Show add-ons for \$\{plan\.name\}/);
  assert.match(features, /Package volume/);
  assert.doesNotMatch(features, /Package upgrade option/);
  assert.doesNotMatch(features, /data-addons-step/);
  assert.match(features, /data-plan-tab/);
  assert.match(features, /data-unified-billing="monthly" class="active">Monthly/);
  assert.match(features, />Per reel</);
  assert.match(features, /USD_INR_RATE = 96/);
  assert.match(features, /data-unified-currency="USD"/);
  assert.match(features, /billingPremiumAmount = amount => state\.billing === "one_off" \? Math\.round\(amount \* 0\.2\) : 0/);
  assert.match(features, /if \(false && pricing\)/);
  assert.match(features, /data-unified-service="video"/);
  assert.match(features, /data-unified-service="longform"/);
  assert.match(features, /data-unified-service="podcast"/);
  assert.match(features, /Long-form Basic", price:5000/);
  assert.match(features, /Final video length/);
  assert.match(features, /Raw footage to review/);
  assert.match(features, /Instagram Reel Script/);
  assert.match(features, /Podcast Episode Script/);
  assert.match(features, /One-off \+20%/);
});

test("adds browser security headers at the custom domain worker", async () => {
  const worker = await load("worker/index.ts");
  assert.match(worker, /Content-Security-Policy/);
  assert.match(worker, /X-Content-Type-Options/);
  assert.match(worker, /frame-ancestors 'self'/);
  assert.match(worker, /no-store, must-revalidate/);
  assert.match(worker, /site-v2\/src/);
});

test("keeps the live shell and site module versions in sync", async () => {
  const [page, html, main] = await Promise.all([
    load("app/page.tsx"),
    load("public/site/index.html"),
    load("public/site/src/main.js"),
  ]);
  assert.match(page, /\/site\/index\.html\?v=visual-flow-1/);
  assert.match(html, /contentx-release" content="visual-flow-1/);
  assert.match(html, /main\.js\?v=visual-flow-1/);
  assert.match(main, /features\.js\?v=visual-flow-1/);
  assert.match(main, /uploads\.js\?v=team-controls-1/);
});

test("passes marketing data into pricing so the homepage loader cannot crash", async () => {
  const [features, main] = await Promise.all([
    load("public/site/src/features.js"),
    load("public/site/src/main.js"),
  ]);
  assert.match(features, /export function enhanceMarketing\(root, actions, data = \{\}\)/);
  assert.match(features, /data\.whatsapp \|\| "#contact-form"/);
  assert.match(main, /enhanceMarketing\(root, actions, studio\)/);
});

test("keeps payment totals server-calculated with allowlisted add-ons", async () => {
  const razorpay = await load("lib/razorpay.ts");
  const orderRoute = await load("app/api/payments/razorpay/order/route.ts");
  assert.match(razorpay, /reel_script: \{ name: "Instagram Reel Script", amount: 500/);
  assert.match(razorpay, /broll_sfx: \{ name: "B-roll \+ Sound Design", amount: 500/);
  assert.match(razorpay, /motion_graphics: \{ name: "Motion Graphics", amount: 500/);
  assert.match(razorpay, /advanced_motion_graphics: \{ name: "Advanced Motion Graphics", amount: 1500/);
  assert.match(razorpay, /quick_delivery: \{ name: "Quick Delivery", amount: 700/);
  assert.match(razorpay, /long_basic: \{ name: "Long-form Basic", amount: 5000/);
  assert.match(razorpay, /longform_extra_minutes/);
  assert.match(razorpay, /longform_raw_review/);
  assert.match(razorpay, /podcast_script: \{ name: "Podcast Episode Script", amount: 1500/);
  assert.match(razorpay, /const subtotalAmount = baseAmount \+ addOnAmount \+ adjustmentAmount/);
  assert.match(razorpay, /const billingPremiumAmount = billing === "one_off" && usesBillingPremium \? Math\.round\(subtotalAmount \* 0\.2\) : 0/);
  assert.match(razorpay, /const totalAmount = subtotalAmount \+ billingPremiumAmount/);
  assert.match(orderRoute, /requireSessionUser/);
  assert.match(orderRoute, /order_selections/);
});

test("offers verified email OTP and Google identity sign-in", async () => {
  const [auth, route, account] = await Promise.all([
    load("lib/auth.ts"),
    load("app/api/auth/route.ts"),
    load("public/site/src/account.js"),
  ]);
  assert.match(auth, /requestEmailOtp/);
  assert.match(auth, /loginWithGoogle/);
  assert.match(auth, /RSASSA-PKCS1-v1_5/);
  assert.match(route, /request_otp/);
  assert.match(route, /verify_otp/);
  assert.match(account, /Continue with email OTP/);
  assert.match(account, /accounts\.google\.com\/gsi\/client/);
});

test("stores password hashes and server-side sessions instead of readable passwords", async () => {
  const auth = await load("lib/auth.ts");
  assert.match(auth, /PBKDF2/);
  assert.match(auth, /PASSWORD_ITERATIONS = 310_000/);
  assert.match(auth, /HttpOnly; SameSite=Lax/);
  assert.match(auth, /token_hash/);
  assert.doesNotMatch(auth, /password TEXT/);
});

test("collects the detailed brief after verified payment and opens private uploads", async () => {
  const briefs = await load("app/api/briefs/route.ts");
  const account = await load("public/site/src/account.js");
  assert.match(briefs, /\["verified", "captured"\]/);
  assert.match(briefs, /project_briefs/);
  assert.match(briefs, /user_upload_projects/);
  assert.match(account, /Video or episode title/);
  assert.match(account, /Editing and creative instructions/);
  assert.match(account, /Reference link/);
});
