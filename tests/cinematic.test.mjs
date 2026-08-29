import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { enhanceCinematic, storyProgress } from "../public/site/src/cinematic.js";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("story progress clamps before and after the sticky scene", () => {
  assert.equal(storyProgress(1000, 1560, 800), 0);
  assert.equal(storyProgress(76, 1560, 800), 0);
  assert.equal(storyProgress(76 - 418, 1560, 800), .5);
  assert.equal(storyProgress(76 - 836, 1560, 800), 1);
  assert.equal(storyProgress(-4000, 1560, 800), 1);
  assert.ok(Number.isFinite(storyProgress(-100, 500, 800)));
});

test("non-marketing routes do not initialize decorative motion", () => {
  const root = {
    classList: { contains: () => false },
    querySelector: () => { throw new Error("Should not inspect workspace UI"); },
  };
  assert.doesNotThrow(() => enhanceCinematic(root));
});

test("missing homepage elements are a safe no-op", () => {
  assert.doesNotThrow(() => enhanceCinematic({
    classList: { contains: () => true },
    querySelector: () => null,
  }));
});

test("motion is an optional, cache-versioned enhancement and keeps the loader fail-safe", async () => {
  const [main, index] = await Promise.all([read("public/site/src/main.js"), read("public/site/index.html")]);
  assert.match(main, /import\("\.\/cinematic\.js\?v=ring-moved-1"\)/);
  assert.match(main, /motionRender !== cinematicRender/);
  assert.match(main, /finally\s*\{\s*loader\?\.classList\.add\("is-done"\)/);
  assert.match(index, /cinematic\.css\?v=ring-moved-1/);
  assert.match(index, /main\.js\?v=ring-moved-1/);
});

test("motion respects reduced motion, mobile, visibility and route cleanup", async () => {
  const [script, css] = await Promise.all([read("public/site/src/cinematic.js"), read("public/site/src/cinematic.css")]);
  assert.match(script, /prefers-reduced-motion: reduce/);
  assert.match(script, /controller\.abort\(\)/);
  assert.match(script, /videoObserver\?\.disconnect\(\)/);
  assert.match(script, /revealObserver\?\.disconnect\(\)/);
  assert.match(script, /cancelAnimationFrame\(frame\)/);
  assert.match(script, /document\.hidden/);
  assert.match(script, /video\.pause\(\)/);
  assert.doesNotMatch(script, /preventDefault|setInterval|fetch\(|localStorage|https:\/\//);
  assert.match(css, /@media \(max-width: 800px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(script, /ILLUSTRATIVE PREVIEW/);
  assert.match(script, /cx-atmosphere[^`]+cx-orbit"><i><\/i><i><\/i><i><\/i><i><\/i><\/div><span class="cx-satellite"/);
  assert.doesNotMatch(script, /cx-hero-ribbons/);
  assert.match(script, /cx-story-rings"><i><\/i><i><\/i><i><\/i><i><\/i><i><\/i><span><\/span>/);
});
