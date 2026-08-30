import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const load = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("presents Basic, Standard and Premium with quantified scopes", async () => {
  const features = await load("public/site/src/features.js");
  for (const price of [1500, 2000, 3500]) {
    assert.match(features, new RegExp(`price:${price}`));
  }
  for (const plan of ["Basic", "Standard"]) assert.match(features, new RegExp(`name:"${plan}"`));
  assert.match(features, /name:"Premium · Motion Plus"/);
  assert.match(features, /1 reel up to 60 seconds/);
  assert.match(features, /Quick Delivery", price:700/);
  assert.match(features, />Short-form</);
  assert.match(features, /Stickers, emojis and simple highlights/);
  assert.match(features, /B-roll placement and visual cutaways/);
  assert.match(features, /Up to 10 relevant B-roll inserts/);
  assert.match(features, /state\.billing === "monthly" \? Math\.max\(minimumQuantity\(\), state\.quantity\) : 1/);
  assert.match(features, /range:"₹2,000–₹2,500"/);
  assert.match(features, /range:"₹3,500–₹5,000"/);
  assert.match(features, /availableAddOns:\["motion_graphics", "reel_script", "cover_design", "quick_delivery", "extra_revision"\]/);
  assert.match(features, /availableAddOns:\["advanced_motion_graphics", "reel_script", "cover_design", "rush_delivery", "extra_revision"\]/);
  assert.match(features, /Extra B-roll \+ Sound Design", price:500/);
  assert.match(features, /Motion Graphics", price:500/);
  assert.match(features, /Advanced Motion Upgrade", price:1500/);
  assert.match(features, /₹3,500 Motion Plus/);
  assert.match(features, /tracked graphics, masking, compositing and custom animated scenes/);
  assert.match(features, /Total: ₹5,000 per reel/);
  assert.match(features, /For Basic or Standard/);
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
  assert.match(features, /function roundedUsdFromInr/);
  assert.match(features, /Math\.ceil\(amount \/ USD_INR_RATE \/ 5\) \* 5/);
  assert.match(features, /pricing switches automatically by visitor region/);
  assert.doesNotMatch(features, /data-currency-auto-label/);
  assert.match(features, /billingPremiumAmount = amount => state\.billing === "one_off" \? Math\.round\(amount \* 0\.2\) : 0/);
  assert.match(features, /if \(false && pricing\)/);
  assert.match(features, /data-unified-service="video"/);
  assert.match(features, /data-unified-service="longform"/);
  assert.match(features, /data-unified-service="podcast"/);
  assert.match(features, /state\.service === "podcast" \? 2 : state\.service === "longform" \? 4 : 10/);
  assert.match(features, /Long-form Basic", price:5000/);
  assert.match(features, /Final video length/);
  assert.match(features, /Raw footage to review/);
  assert.match(features, /long_extra_revision", name:"Extra Revision Round", price:500/);
  assert.match(features, /extra_revision", name:"Extra Revision Round", price:300/);
  assert.match(features, /includedRawMinutes:60/);
  assert.match(features, /includedRawMinutes:120/);
  assert.match(features, /includedRawMinutes:180/);
  assert.match(features, /step="15"/);
  assert.match(features, /price:\(extraRawMinutes \/ 15\) \* 200/);
  assert.match(features, /rawFootageMinutes:plan\.rawFootageMinutes/);
  assert.match(features, /Instagram Reel Script/);
  assert.match(features, /Podcast Episode Script/);
  assert.match(features, /One-off \+20%/);
});

test("adds browser security headers at the custom domain worker", async () => {
  const worker = await load("worker/index.ts");
  assert.match(worker, /Content-Security-Policy/);
  assert.match(worker, /X-Content-Type-Options/);
  assert.match(worker, /Strict-Transport-Security/);
  assert.match(worker, /Cross-Origin-Opener-Policy/);
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
  assert.match(page, /\/site\/index\.html\?v=frame-native-5/);
  assert.match(html, /contentx-release" content="frame-native-5/);
  assert.match(html, /main\.js\?v=frame-native-5/);
  assert.match(html, /commerce\.css\?v=free-workspace-foundation-1/);
  assert.match(main, /features\.js\?v=auth-health-1/);
  assert.match(main, /uploads\.js\?v=frame-native-3/);
  assert.match(main, /account\.js\?v=frame-native-5/);
});

test("autoplays public preview videos without center overlay controls", async () => {
  const [ui, marketplace] = await Promise.all([
    load("public/site/src/ui.js"),
    load("public/site/src/marketplace.js"),
  ]);
  assert.match(ui, /data-preview-autoplay/);
  assert.match(ui, /muted loop playsinline autoplay preload="auto"/);
  assert.doesNotMatch(ui, /class="play-work"/);
  assert.doesNotMatch(ui, /class="center-play"/);
  assert.doesNotMatch(ui, /class="fake-controls"/);
  assert.match(marketplace, /muted loop playsinline autoplay preload="auto" data-preview-autoplay/);
  assert.doesNotMatch(marketplace, /data-preview-video/);
});

test("lets visitors explore a demo dashboard before login", async () => {
  const [main, ui] = await Promise.all([
    load("public/site/src/main.js"),
    load("public/site/src/ui.js"),
  ]);
  assert.doesNotMatch(main, /route\.startsWith\("workspace"\) \|\|/);
  assert.match(main, /renderDashboard\(root, actions, \{ demo:true \}\)/);
  assert.match(ui, /Demo workspace · Sign in/);
  assert.match(ui, /data-demo-login/);
  assert.match(ui, /<h1>Projects<\/h1>/);
  assert.match(ui, /aria-label="Search Content X"/);
  assert.match(ui, /class="cx-app-rail"/);
  assert.doesNotMatch(ui, /Good afternoon/);
  assert.doesNotMatch(ui, /◦<i><\/i>/);
});

test("keeps the workspace shell visible while projects refresh", async () => {
  const [workspace, styles] = await Promise.all([
    load("public/site/src/workspace.js"),
    load("public/site/src/frame-workspace.css"),
  ]);
  assert.match(workspace, /const existingShell = root\.querySelector\("\.workspace-shell"\)/);
  assert.match(workspace, /existingShell\.classList\.add\("is-refreshing"\)/);
  assert.match(workspace, /workspaceOpeningShell\(\)/);
  assert.match(workspace, /renderVersion !== workspaceRenderVersion/);
  assert.doesNotMatch(workspace, /Opening your workspace…/);
  assert.match(styles, /workspace-shell\.is-refreshing::after/);
  assert.match(styles, /workspace-opening-shell/);
});

test("keeps account settings inside the workspace shell", async () => {
  const [main, workspace, account] = await Promise.all([
    load("public/site/src/main.js"),
    load("public/site/src/workspace.js"),
    load("public/site/src/account.js"),
  ]);
  assert.match(main, /openAccount: \(\) => go\("workspace\?panel=account"\)/);
  assert.match(main, /renderClientWorkspace\(root, actions, "workspace\?panel=account"\)/);
  assert.match(workspace, /data-workspace-account/);
  assert.match(workspace, /renderWorkspaceAccountPanel/);
  assert.match(account, /export async function renderWorkspaceAccountPanel/);
  assert.match(account, /workspace-account-tabs/);
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
  assert.match(razorpay, /advanced_motion_graphics: \{ name: "Advanced Motion Upgrade", amount: 1500/);
  assert.match(razorpay, /quick_delivery: \{ name: "Quick Delivery", amount: 700/);
  assert.match(razorpay, /long_basic: \{ name: "Long-form Basic", amount: 5000/);
  assert.match(razorpay, /Monthly podcast production starts at 2 episodes/);
  assert.match(razorpay, /Monthly long-form production starts at 4 videos/);
  assert.match(razorpay, /longform_extra_minutes/);
  assert.match(razorpay, /longform_raw_review/);
  assert.match(razorpay, /extra_revision: \{ name: "Extra Revision Round", amount: 300/);
  assert.match(razorpay, /long_extra_revision: \{ name: "Extra Revision Round", amount: 500/);
  assert.match(razorpay, /revision_short: \{ name: "Extra Short-form Revision Round", amount: 300/);
  assert.match(razorpay, /revision_long: \{ name: "Extra Long-form Revision Round", amount: 500/);
  assert.match(razorpay, /includedRawMinutes: 60/);
  assert.match(razorpay, /includedRawMinutes: 120/);
  assert.match(razorpay, /includedRawMinutes: 180/);
  assert.match(razorpay, /rawFootageMinutes % 15/);
  assert.match(razorpay, /extraRawMinutes \/ 15/);
  assert.match(razorpay, /podcast_script: \{ name: "Podcast Episode Script", amount: 1500/);
  assert.match(razorpay, /const subtotalAmount = baseAmount \+ addOnAmount \+ adjustmentAmount/);
  assert.match(razorpay, /const billingPremiumAmount = billing === "one_off" && usesBillingPremium \? Math\.round\(subtotalAmount \* 0\.2\) : 0/);
  assert.match(razorpay, /const totalAmount = subtotalAmount \+ billingPremiumAmount/);
  assert.match(razorpay, /currency = input\.currency === "USD" \? "USD" : "INR"/);
  assert.match(razorpay, /settlementCurrency: "INR"/);
  assert.match(razorpay, /currency: order\.currency/);
  assert.match(orderRoute, /requireSessionUser/);
  assert.match(orderRoute, /currency: input\.currency/);
  assert.match(orderRoute, /rawFootageMinutes: input\.rawFootageMinutes/);
  assert.match(orderRoute, /revisionPolicyForPlan/);
  assert.match(orderRoute, /This video still has \$\{availableRounds - usedRounds\} revision round available/);
  assert.match(orderRoute, /project_id, asset_id/);
  assert.match(orderRoute, /order_selections/);
});

test("offers another paid revision only after a video's allowance is exhausted", async () => {
  const [workspace, features, uploads, auth, account] = await Promise.all([
    load("public/site/src/workspace.js"),
    load("public/site/src/features.js"),
    load("app/api/uploads/route.ts"),
    load("lib/auth.ts"),
    load("public/site/src/account.js"),
  ]);
  assert.match(workspace, /used >= allowed/);
  assert.match(workspace, /Buy another revision · \$\{revisionPolicy\.service === "longform" \? "₹500" : "₹300"\}/);
  assert.match(workspace, /revisionPurchase:true/);
  assert.match(workspace, /projectId:project\.id/);
  assert.match(workspace, /assetId:button\.dataset\.assetId/);
  assert.match(features, /projectId:plan\.projectId, assetId:plan\.assetId/);
  assert.match(features, /One more revision round is ready/);
  assert.match(uploads, /purchasedByAsset/);
  assert.match(uploads, /COUNT\(\*\) AS purchased/);
  assert.match(auth, /\["project_id", "TEXT"\]/);
  assert.match(auth, /\["asset_id", "TEXT"\]/);
  assert.match(account, /revision_short", "revision_long/);
});

test("keeps revision promises aligned with the selected package", async () => {
  const [data, creatorTools, ui, marketplace] = await Promise.all([
    load("public/site/src/data.js"),
    load("public/site/src/creator-tools.js"),
    load("public/site/src/ui.js"),
    load("public/site/src/marketplace.js"),
  ]);
  for (const source of [data, creatorTools, ui, marketplace]) {
    assert.doesNotMatch(source, /Every project includes two revision rounds/);
    assert.doesNotMatch(source, /Each video includes two consolidated revision rounds/);
    assert.doesNotMatch(source, /Two revision rounds included unless stated otherwise/);
  }
  assert.match(data, /Basic includes 1, Standard includes 2 and Premium includes 3/);
  assert.match(data, /₹300 for short-form and ₹500 for long-form/);
});

test("offers verified email OTP and Google identity sign-in", async () => {
  const [auth, route, account] = await Promise.all([
    load("lib/auth.ts"),
    load("app/api/auth/route.ts"),
    load("public/site/src/account.js"),
  ]);
  assert.match(auth, /requestEmailOtp/);
  assert.match(auth, /loginWithGoogle/);
  assert.match(auth, /\/auth\/v1\/health/);
  assert.match(auth, /SELECT 1 AS ok/);
  assert.match(auth, /OTP_HEALTH_CACHE_MS/);
  assert.match(auth, /RSASSA-PKCS1-v1_5/);
  assert.match(route, /request_otp/);
  assert.match(route, /getVerifiedAccountCapabilities/);
  assert.match(route, /database: \{ available: databaseAvailable \}/);
  assert.match(route, /verify_otp/);
  assert.match(route, /request_password_reset/);
  assert.match(route, /reset_password/);
  assert.match(account, /Continue with email code/);
  assert.doesNotMatch(account, /if \(register && accountProviders\.emailOtp\?\.available\)/);
  assert.match(account, /action:register \? "register" : "login"/);
  assert.match(account, /host\.isConnected/);
  assert.match(account, /theme:"filled_black"/);
  assert.match(auth, /Email-code sign-in is temporarily unavailable/);
  assert.match(account, /Forgot password/);
  assert.match(account, /request_password_reset/);
  assert.match(account, /reset_password/);
  assert.match(account, /const form = event\.currentTarget/);
  assert.match(account, /new FormData\(form\)/);
  assert.doesNotMatch(account, /event\.currentTarget\.innerHTML/);
  assert.doesNotMatch(account, /await api\([\s\S]{0,500}event\.currentTarget\.textContent/);
  assert.match(account, /otp-box-grid/);
  assert.match(account, /bindOtpBoxes/);
  assert.match(account, /location\.hash = returningTo/);
  assert.match(account, /new AbortController\(\)/);
  assert.match(account, /controller\.abort\(\)/);
  assert.match(account, /taking longer than expected/);
  assert.match(account, /accounts\.google\.com\/gsi\/client/);
  assert.match(account, /Free 50 GB account workspace/);
  assert.match(account, /Clients can review from a private link without creating an account/);
  assert.doesNotMatch(account, /Protected account access/);
  assert.match(account, /JSON\.stringify\(\{ paid:true, account:true \}\)/);
  assert.doesNotMatch(account, /email:user\.email/);
  assert.doesNotMatch(account, /name:user\.name/);
  assert.match(auth, /const tokenHash = await sha256\(token\)/);
  assert.match(auth, /await db\.batch\(\[/);
  assert.match(auth, /return \{ user, token \}/);
});

test("stores password hashes and server-side sessions instead of readable passwords", async () => {
  const [auth, orderRoute, verifyRoute, razorpay, schema] = await Promise.all([
    load("lib/auth.ts"),
    load("app/api/payments/razorpay/order/route.ts"),
    load("app/api/payments/razorpay/verify/route.ts"),
    load("lib/razorpay.ts"),
    load("db/schema.ts"),
  ]);
  assert.match(auth, /PBKDF2/);
  assert.match(auth, /PASSWORD_ITERATIONS = 100_000/);
  assert.match(auth, /account_password_resets/);
  assert.match(auth, /token_hash/);
  assert.match(auth, /sendTransactionalEmail/);
  assert.match(auth, /contentXEmailShell/);
  assert.match(auth, /HttpOnly; SameSite=Lax/);
  assert.match(auth, /requireSameOrigin/);
  assert.match(auth, /ensureAuthSchemaColumns/);
  assert.match(auth, /UPDATE account_users SET updated_at = created_at/);
  assert.match(auth, /token_hash/);
  assert.doesNotMatch(auth, /password TEXT/);
  assert.doesNotMatch(auth, /plaintext/i);
  assert.match(schema, /accountPasswordResets/);
  assert.match(orderRoute, /requireSameOrigin/);
  assert.match(orderRoute, /requireSessionUser/);
  assert.match(orderRoute, /currency: order\.currency/);
  assert.match(verifyRoute, /requireSessionUser/);
  assert.match(verifyRoute, /timingSafeEqual/);
  assert.match(razorpay, /currency: order\.currency/);
});

test("adds server-backed notification preferences and comment email digesting", async () => {
  const [notifications, route, account, uploads, features, ui, envExample, schema] = await Promise.all([
    load("lib/notifications.ts"),
    load("app/api/notifications/route.ts"),
    load("public/site/src/account.js"),
    load("app/api/uploads/route.ts"),
    load("public/site/src/features.js"),
    load("public/site/src/ui.js"),
    load(".env.example"),
    load("db/schema.ts"),
  ]);
  assert.match(notifications, /notification_preferences/);
  assert.match(notifications, /account_notifications/);
  assert.match(notifications, /email_notification_queue/);
  assert.match(notifications, /commentEmailMode: "digest"/);
  assert.match(notifications, /digestThreshold: 9/);
  assert.match(notifications, /sendDigestIfReady/);
  assert.match(notifications, /You have \$\{countLabel\} new Content X comments/);
  assert.match(route, /update_preferences/);
  assert.match(route, /test_notification/);
  assert.match(route, /record_event/);
  assert.match(route, /mark_read/);
  assert.match(route, /requireSessionUser/);
  assert.match(account, /NOTIFICATION_API/);
  assert.match(account, /notificationSettingsPanel/);
  assert.match(account, /Digest at 9\+/);
  assert.match(account, /data-account-notification="emailEnabled"/);
  assert.match(uploads, /notifyOwner/);
  assert.match(uploads, /publishNotification/);
  assert.match(features, /pushServerNotification/);
  assert.match(ui, /postNotificationEvent/);
  assert.match(envExample, /RESEND_API_KEY/);
  assert.match(envExample, /CONTENTX_EMAIL_FROM/);
  assert.match(envExample, /CONTENTX_OWNER_EMAIL/);
  assert.match(envExample, /GOOGLE_CLIENT_ID/);
  assert.match(envExample, /SUPABASE_URL/);
  assert.match(envExample, /SUPABASE_ANON_KEY/);
  assert.match(schema, /notificationPreferences/);
  assert.match(schema, /emailNotificationQueue/);
});

test("collects the detailed brief after verified payment and opens private uploads", async () => {
  const briefs = await load("app/api/briefs/route.ts");
  const account = await load("public/site/src/account.js");
  assert.match(briefs, /\["verified", "captured"\]/);
  assert.match(briefs, /project_briefs/);
  assert.match(briefs, /p\.currency/);
  assert.match(briefs, /user_upload_projects/);
  assert.match(account, /Video or episode title/);
  assert.match(account, /currency === "USD"/);
  assert.match(account, /Editing and creative instructions/);
  assert.match(account, /Source links & takes/);
  assert.match(account, /Take 1 - https:\/\/drive\.google\.com/);
  assert.match(account, /You can still upload files directly in the next step/);
});

test("keeps payment history private and adds owner refund controls", async () => {
  const [schema, razorpay, historyRoute, briefs, account, features] = await Promise.all([
    load("db/schema.ts"),
    load("lib/razorpay.ts"),
    load("app/api/payments/history/route.ts"),
    load("app/api/briefs/route.ts"),
    load("public/site/src/account.js"),
    load("public/site/src/features.js"),
  ]);
  assert.match(schema, /refundStatus/);
  assert.match(razorpay, /ensurePaymentSchemaColumns/);
  assert.match(historyRoute, /requireSessionUser/);
  assert.match(historyRoute, /requireOwner/);
  assert.match(historyRoute, /request_refund/);
  assert.match(historyRoute, /mark_refunded/);
  assert.match(historyRoute, /completedProjectStatuses/);
  assert.match(briefs, /p\.refund_status/);
  assert.match(briefs, /payment has been refunded/);
  assert.match(account, /Payment history & refund status/);
  assert.match(account, /canStartBrief/);
  assert.match(features, /Finance & refunds/);
  assert.match(features, /OWNER_TOKEN_KEY/);
  assert.match(features, /Refund buttons update Content X records only/);
});

test("lets paid clients attach external source links before uploading files", async () => {
  const [briefs, account, uploads] = await Promise.all([
    load("app/api/briefs/route.ts"),
    load("public/site/src/account.js"),
    load("public/site/src/uploads.js"),
  ]);
  assert.match(briefs, /cleanSourceLinks/);
  assert.match(briefs, /Each source line needs a valid https:\/\/ link/);
  assert.match(briefs, /slice\(0, 30\)/);
  assert.match(account, /Source links & takes/);
  assert.match(account, /Google Drive, Dropbox, WeTransfer/);
  assert.match(uploads, /Google Drive, Dropbox, WeTransfer/);
  assert.match(uploads, /Upload multiple takes, raw files or references/);
});

test("shows pre-payment tutorials and a safe rollback note", async () => {
  const [creatorTools, releaseHistory] = await Promise.all([
    load("public/site/src/creator-tools.js"),
    load("docs/release-history.md"),
  ]);
  assert.match(creatorTools, /prepay-tutorials/);
  assert.match(creatorTools, /Small details. A better workflow./);
  assert.match(creatorTools, /cx-tutorial-card/);
  assert.doesNotMatch(creatorTools, /Demo video placeholder/);
  assert.doesNotMatch(creatorTools, /Coming soon/);
  assert.match(creatorTools, /Explore demo dashboard/);
  assert.match(releaseHistory, /demo-share-usd-1/);
  assert.match(releaseHistory, /pricing-security-dashboard-1/);
  assert.doesNotMatch(releaseHistory, /password|token|secret/i);
});

test("shows owner permission controls and Frame-style review flow", async () => {
  const [features, account, data, ui, creatorTools, polish] = await Promise.all([
    load("public/site/src/features.js"),
    load("public/site/src/account.js"),
    load("public/site/src/data.js"),
    load("public/site/src/ui.js"),
    load("public/site/src/creator-tools.js"),
    load("public/site/src/polish.css"),
  ]);
  assert.match(data, /Managed content production · private review workspace/);
  assert.match(features, /teamPermissionsView/);
  assert.match(features, /Owner can view every client/);
  assert.match(features, /Create share links/);
  assert.match(features, /owner-review-flow/);
  assert.match(account, /account-review-panel/);
  assert.match(account, /Control downloads, uploads, expiry and client review access/);
  assert.match(ui, /timeline-hover-preview/);
  assert.match(ui, /comment-input-row/);
  assert.match(ui, /comment-action-row/);
  assert.match(ui, /player-play-toggle/);
  assert.match(ui, /cx_comment_permissions/);
  assert.match(ui, /data-complete-comment/);
  assert.match(ui, /data-edit-comment/);
  assert.match(ui, /data-delete-comment/);
  assert.match(ui, /edited" : ""/);
  assert.match(creatorTools, /if \(route !== "review"\)/);
  assert.doesNotMatch(creatorTools, /caption-workspace-button/);
  assert.doesNotMatch(creatorTools, /CC Hinglish captions/);
  assert.doesNotMatch(creatorTools, /Quick replies/);
  assert.match(polish, /smart-reply-row\{display:none!important\}/);
  assert.match(polish, /player-play-toggle/);
  assert.match(polish, /comment-complete-badge/);
});

test("keeps production upload completion compatible with long R2 upload ids", async () => {
  const uploadsRoute = await load("app/api/uploads/route.ts");
  assert.match(uploadsRoute, /cleanText\(input\.uploadId, 2048\)/);
});
