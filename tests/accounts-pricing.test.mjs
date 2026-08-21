import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const load = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("presents the five requested video prices in one unified builder", async () => {
  const features = await load("public/site/src/features.js");
  for (const price of [1500, 2000, 2500, 3500, 5000]) {
    assert.match(features, new RegExp(`price:${price}`));
  }
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
  assert.match(razorpay, /podcast_script: \{ name: "Podcast Episode Script", amount: 1500/);
  assert.match(razorpay, /const totalAmount = baseAmount \+ addOnAmount/);
  assert.match(orderRoute, /requireSessionUser/);
  assert.match(orderRoute, /order_selections/);
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
