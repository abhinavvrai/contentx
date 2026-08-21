import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const load = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("presents Basic, Standard and Premium with quantified scopes", async () => {
  const features = await load("public/site/src/features.js");
  for (const price of [1500, 2500, 5000]) {
    assert.match(features, new RegExp(`price:${price}`));
  }
  for (const plan of ["Basic", "Standard", "Premium"]) assert.match(features, new RegExp(`name:"${plan}"`));
  assert.match(features, /1 video up to 60 seconds/);
  assert.match(features, /Up to 5 relevant B-roll inserts/);
  assert.match(features, /Up to 10 B-roll inserts/);
  assert.match(features, /B-roll \+ Sound Effects", price:500/);
  assert.match(features, /data-unified-service="video"/);
  assert.match(features, /data-unified-service="podcast"/);
  assert.match(features, /Instagram Reel Script/);
  assert.match(features, /Podcast Episode Script/);
  assert.doesNotMatch(features, /setupUnifiedPricing[\s\S]*One-off flexibility premium/);
});

test("keeps payment totals server-calculated with allowlisted add-ons", async () => {
  const razorpay = await load("lib/razorpay.ts");
  const orderRoute = await load("app/api/payments/razorpay/order/route.ts");
  assert.match(razorpay, /reel_script: \{ name: "Instagram Reel Script", amount: 500/);
  assert.match(razorpay, /broll_sfx: \{ name: "B-roll \+ Sound Effects", amount: 500/);
  assert.match(razorpay, /podcast_script: \{ name: "Podcast Episode Script", amount: 1500/);
  assert.match(razorpay, /const totalAmount = baseAmount \+ addOnAmount/);
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
