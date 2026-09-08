import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Android layout layer is loaded last and cache-busted", async () => {
  const html = await read("public/site/index.html");
  assert.match(html, /contentx-release" content="frame-native-19/);
  assert.match(html, /mobile\.css\?v=frame-native-19/);
  assert.ok(html.indexOf("mobile.css") > html.indexOf("workspace-organizer.css"));
});

test("mobile layout removes fixed dashboard width and protects touch layouts", async () => {
  const base = await read("public/site/src/styles.css");
  const mobile = await read("public/site/src/mobile.css");
  assert.match(base, /dashboard-shell\{min-width:360px\}/);
  assert.match(mobile, /dashboard-shell[\s\S]{0,160}min-width:0!important/);
  assert.match(mobile, /max-width:\s*760px/);
  assert.match(mobile, /max-width:\s*420px/);
  assert.match(mobile, /overflow-x:clip/);
  assert.match(mobile, /min-height:44px/);
  assert.match(mobile, /env\(safe-area-inset-bottom\)/);
  assert.match(mobile, /font-size:16px/);
});

test("mobile product pages collapse to a readable single column", async () => {
  const mobile = await read("public/site/src/mobile.css");
  for (const selector of [
    ".project-grid",
    ".workspace-overview-grid",
    ".workspace-file-grid",
    ".workspace-folder-grid",
    ".provider-order-list article",
  ]) assert.ok(mobile.includes(selector), `${selector} must have an explicit mobile layout`);
  assert.match(mobile, /#app\.review-app[\s\S]*height:100dvh/);
  assert.match(mobile, /#app\.account-app \.account-story \{ display:none; \}/);
});
