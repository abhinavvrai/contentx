import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Content X application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Content X \| Managed Content Production<\/title>/i);
  assert.match(html, /class="site-frame"/i);
  assert.match(html, /src="\/site\/index\.html"/i);
  assert.match(html, /title="Content X — Managed Content Production"/i);
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
  assert.match(index, /polish\.css\?v=managed-service-1/);
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

  assert.match(index, /advanced\.css\?v=managed-service-1/);
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
