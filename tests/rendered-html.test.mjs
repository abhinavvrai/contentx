import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const html = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
}

test("server-renders the Content X application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /className="site-frame"/i);
  assert.match(html, /src="\/site\/index\.html\?v=landscape-contrast-3"/i);
  assert.match(html, /title="Content X"/i);
  assert.doesNotMatch(html, /site is taking shape|Building your site/i);
});

test("ships the managed-service intake, private provider workspace and protected checkout", async () => {
  const [index, main, marketplace, features, polishStyles] = await Promise.all([
    readFile(new URL("../public/site/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/main.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/marketplace.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/features.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/polish.css", import.meta.url), "utf8"),
  ]);

  assert.match(index, /src\/main\.js/);
  assert.match(main, /route === "marketplace"/);
  assert.match(main, /route === "provider-workspace"/);
  assert.match(main, /enhanceMarketplaceAdmin/);
  assert.match(index, /polish\.css\?v=free-workspace-foundation-1/);
  assert.match(marketplace, /Managed creative network/);
  assert.match(marketplace, /We assemble the team/);
  assert.match(marketplace, /One scope and one invoice/);
  assert.match(marketplace, /cx_brief_draft/);
  assert.match(marketplace, /renderProviderWorkspace/);
  assert.match(marketplace, /Direct contact details and social handles are not allowed/);
  assert.match(features, /cx_market_orders/);
  assert.match(features, /commissionAmount/);
  assert.match(polishStyles, /Managed-service model/);
  assert.match(polishStyles, /managed-role-grid/);
});

test("ships frame-anchored review tools, managed review and notification controls", async () => {
  const [features, marketplace, styles] = await Promise.all([
    readFile(new URL("../public/site/src/features.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/marketplace.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(features, /Content X Managed Review/);
  assert.match(features, /data-draw-tool="arrow"/);
  assert.match(features, /data-draw-tool="pencil"/);
  assert.match(features, /cx_review_annotations/);
  assert.match(features, /data-notification-setting="emailEnabled"/);
  assert.match(features, /Every 15 minutes/);
  assert.match(features, /cx_email_outbox/);
  assert.match(marketplace, /recordNotification\("delivery"/);
  assert.match(styles, /Frame-style review suite/);
  assert.match(styles, /frame-annotation-toolbar\.show/);
  assert.match(styles, /managed-review-modal/);
});

test("ships the advanced review command center and shared task workflow", async () => {
  const [index, main, advanced, advancedStyles] = await Promise.all([
    readFile(new URL("../public/site/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/main.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/advanced.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/advanced.css", import.meta.url), "utf8"),
  ]);

  assert.match(index, /advanced\.css\?v=core-features-2/);
  assert.match(main, /enhanceReviewSuite/);
  assert.match(main, /enhanceDashboardSuite/);
  assert.match(main, /enhanceAdminSuite/);
  assert.match(advanced, /Version comparison/);
  assert.match(advanced, /Interactive transcript/);
  assert.match(advanced, /Final review checklist/);
  assert.match(advanced, /Keyboard shortcuts/);
  assert.match(advanced, /Workflow & tasks/);
  assert.match(advanced, /cx_tasks/);
  assert.match(advancedStyles, /Content X advanced command center/);
  assert.match(advancedStyles, /comparison-grid/);
  assert.match(advancedStyles, /task-board/);
});

test("keeps provider listings private and owner-assigned", async () => {
  const [marketplace, styles] = await Promise.all([
    readFile(new URL("../public/site/src/marketplace.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(marketplace, /Owner and admins only/);
  assert.match(marketplace, /portfolioFiles/);
  assert.match(marketplace, /cx_active_provider_id/);
  assert.match(marketplace, /if \(!activeId\) return null/);
  assert.match(marketplace, /Sign out/);
  assert.match(marketplace, /Listing reference/);
  assert.match(marketplace, /cx_provider_assignments/);
  assert.match(marketplace, /No marketplace feed and no other provider posts/);
  assert.match(marketplace, /Approved for matching/);
  assert.doesNotMatch(marketplace, /return \[\.\.\.approved, \.\.\.seedTalent\]/);
  assert.match(styles, /Private provider listings and owner-controlled matching/);
  assert.match(styles, /private-portfolio-upload/);
  assert.match(styles, /assignment-provider-options/);
});

test("models owner gating, accessible route polish and social previews", async () => {
  const [features, polish, layout, image] = await Promise.all([
    readFile(new URL("../public/site/src/features.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/polish.js", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/og.png", import.meta.url)),
  ]);

  assert.match(features, /renderOwnerGate/);
  assert.match(features, /cx_owner_access/);
  assert.match(features, /Lock owner session/);
  assert.match(polish, /aria-modal/);
  assert.match(polish, /event\.key === "Escape"/);
  assert.match(polish, /routeTitles/);
  assert.match(layout, /x-forwarded-host/);
  assert.match(layout, /summary_large_image/);
  assert.ok(image.byteLength > 100_000);
});

test("ships native reel ratios and isolated client workspaces", async () => {
  const [main, features, advanced, advancedStyles] = await Promise.all([
    readFile(new URL("../public/site/src/main.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/features.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/advanced.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/advanced.css", import.meta.url), "utf8"),
  ]);

  assert.match(main, /prepareClientRoute/);
  assert.match(advanced, /media-portrait/);
  assert.match(advanced, /9:16 REEL/);
  assert.match(advanced, /Separated client operations/);
  assert.match(advanced, /Data isolation active/);
  assert.match(advanced, /cx_clients_v2/);
  assert.match(advanced, /cx_active_client/);
  assert.match(advanced, /cx_shares_\$\{client\.id\}_\$\{project\.id\}/);
  assert.match(features, /clientStoreKey\("cx_messages"/);
  assert.match(features, /Only events from this client workspace appear here/);
  assert.match(advancedStyles, /Native media ratios/);
  assert.match(advancedStyles, /Isolated client workspaces/);
  assert.match(advancedStyles, /aspect-ratio:9\/16/);
});

test("keeps permanent dark styling, video feedback and pricing selection first-class", async () => {
  const [features, polishStyles] = await Promise.all([
    readFile(new URL("../public/site/src/features.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/polish.css", import.meta.url), "utf8"),
  ]);

  assert.match(features, /document\.documentElement\.dataset\.theme = "dark"/);
  assert.doesNotMatch(features, /data-theme-toggle|review-theme-button|toggleTheme|cx_theme/);
  assert.match(features, /Try video feedback/);
  assert.match(features, /Frame annotations/);
  assert.match(features, /deliveryFormat/);
  assert.match(features, /data-volume-preset/);
  assert.match(features, /Select number of videos/);
  assert.match(polishStyles, /Restored core controls/);
  assert.match(polishStyles, /delivery-format-options/);
  assert.match(polishStyles, /volume-presets/);
});

test("ships the low-credit one-prompt Hinglish caption workflow", async () => {
  const [index, tools, styles, endpoint, captionApi] = await Promise.all([
    readFile(new URL("../public/site/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/creator-tools.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/creator-tools.css", import.meta.url), "utf8"),
    readFile(new URL("../app/api/captions/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/caption-api.js", import.meta.url), "utf8"),
  ]);

  assert.match(index, /creator-tools\.css\?v=no-video-placeholders-1/);
  assert.match(tools, /Hinglish caption studio/);
  assert.match(tools, /Generate Hinglish captions/);
  assert.match(tools, /Download \.SRT/);
  assert.match(tools, /editing the result uses no extra credit/);
  assert.match(styles, /One-prompt Hinglish caption studio/);
  assert.match(styles, /max-height:calc\(100dvh - 32px\)/);
  assert.match(endpoint, /generateCaptions/);
  assert.match(endpoint, /process\.env\.OPENAI_API_KEY/);
  assert.match(captionApi, /gpt-4o-mini-transcribe/);
  assert.match(captionApi, /timestamp_granularities/);
  assert.match(captionApi, /MAX_UPLOAD_BYTES/);
});

test("uses billing-aware reel minimums and includes advanced SaaS animation", async () => {
  const [tools, styles] = await Promise.all([
    readFile(new URL("../public/site/src/creator-tools.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/creator-tools.css", import.meta.url), "utf8"),
  ]);

  assert.match(tools, /Monthly production starts at 10 reels/);
  assert.match(tools, /monthly \? 10 : 1/);
  assert.match(tools, /Monthly plans start at 10 reels/);
  assert.match(tools, /One-off projects start at 1 reel/);
  assert.match(tools, /updateTierRates/);
  assert.match(tools, /factor = billing === "monthly" \? 1 : 1\.2/);
  assert.doesNotMatch(tools, /tier-rate-note/);
  assert.match(tools, /SaaS Animation/);
  assert.match(tools, /"SaaS Animation":9000/);
  assert.match(tools, /UP TO 30 SEC · ADVANCED SAAS/);
  assert.match(tools, /Up to 30 seconds of animated product UI/);
  assert.match(tools, /const oldCheckout = pricing\.querySelector/);
  assert.match(styles, /Advanced SaaS animation pricing tier/);
  assert.match(styles, /saas-animation-tier/);
  assert.doesNotMatch(styles, /Billing-aware package rates/);
});

test("uses one clear audience switch for clients and providers", async () => {
  const [marketplace, styles] = await Promise.all([
    readFile(new URL("../public/site/src/marketplace.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(marketplace, /data-hire-talent/);
  assert.match(marketplace, /Submit a project brief/);
  assert.match(marketplace, /Create private listing/);
  assert.match(marketplace, /querySelector\("\.work-with-us"\)\?\.remove/);
  assert.match(styles, /Client \/ provider audience switch/);
  assert.match(styles, /\.site-nav \.audience-switch,.site-nav \[data-start-project\]\{display:none!important\}/);
  assert.match(styles, /Client \/ provider audience switch/);
});
