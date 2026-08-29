import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { tutorialVisual } from "../public/site/src/creator-tools.js";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const require = createRequire(import.meta.resolve("vite"));
const postcss = require("postcss");
const luminance = hex => {
  const channels = hex.replace("#", "").match(/../g).map(part => parseInt(part, 16) / 255);
  return channels.map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4)
    .reduce((sum, channel, i) => sum + channel * [.2126, .7152, .0722][i], 0);
};
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + .05) / (dark + .05);
};

test("dark styling is set before script execution and cannot be toggled to light", async () => {
  const [index, features, marketplace, polish] = await Promise.all([
    read("public/site/index.html"), read("public/site/src/features.js"),
    read("public/site/src/marketplace.js"), read("public/site/src/polish.js"),
  ]);
  assert.match(index, /<html lang="en" data-theme="dark">/);
  assert.match(features, /document\.documentElement\.dataset\.theme = "dark"/);
  for (const source of [features, marketplace, polish]) {
    assert.doesNotMatch(source, /data-theme-toggle|data-market-theme|toggleTheme|cx_theme/);
  }
  assert.ok(index.indexOf("noir.css") > index.indexOf("cinematic.css"));
});

test("the new stylesheet parses and key text/button palettes exceed 4.5:1", async () => {
  const css = postcss.parse(await read("public/site/src/noir.css"));
  const variables = new Map();
  css.nodes[1].walkDecls?.(declaration => variables.set(declaration.prop, declaration.value));
  assert.ok(contrast(variables.get("--ink"), variables.get("--paper")) >= 4.5);
  assert.ok(contrast(variables.get("--muted"), variables.get("--cx-surface")) >= 4.5);
  assert.ok(contrast(variables.get("--cx-accent-ink"), variables.get("--orange")) >= 4.5);
  let feedback;
  css.walkRules(rule => {
    if (rule.selector.endsWith('#app [data-feedback-demo]')) {
      feedback = Object.fromEntries(rule.nodes.filter(node => node.type === "decl").map(node => [node.prop, node.value]));
    }
  });
  assert.ok(feedback, "Explicit feedback CTA contrast fix exists");
  assert.ok(contrast(feedback.color, feedback.background) >= 4.5);
});

test("each workflow illustration is distinct, decorative and keeps its original meaning", () => {
  const review = tutorialVisual("01"), version = tutorialVisual("02"), sharing = tutorialVisual("03");
  assert.match(review, /cx-focus-pin/);
  assert.match(review, /Client feedback/);
  assert.match(version, /V1/);
  assert.match(version, /V2/);
  assert.match(version, /V3/);
  assert.match(sharing, /cx-link-core/);
  assert.match(sharing, /CLIENT/);
  for (const illustration of [review, version, sharing]) {
    assert.match(illustration, /aria-hidden="true"/);
    assert.doesNotMatch(illustration, /https:\/\/frame\.io|<button|<a\s/);
  }
});

test("illustrations reuse local footage and have motion, touch and keyboard fallbacks", async () => {
  const css = await read("public/site/src/noir.css");
  assert.match(tutorialVisual("01"), /src="videos\/landscape3.mp4" muted loop playsinline preload="metadata" data-preview-autoplay/);
  assert.match(css, /focus-within/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /data-cx-motion="off"/);
  assert.match(css, /@media \(max-width: 800px\)/);
});

test("the dark palette covers marketing, forms, client workspace, owner and review surfaces", async () => {
  const css = await read("public/site/src/noir.css");
  for (const selector of [".account-app", ".checkout-app", ".upload-app", ".workspace-app", ".admin-app", ".marketplace-app", ".comment-panel", ".creator-tool-modal", ".unified-package-browser", ".provider-form-wrap"]) {
    assert.ok(css.includes(selector), `Missing surface: ${selector}`);
  }
  assert.match(css, /color-scheme: dark/);
  assert.match(css, /::placeholder/);
  assert.match(css, /:focus-visible/);
});
