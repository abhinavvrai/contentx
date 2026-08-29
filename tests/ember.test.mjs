import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { sceneMarkup, sceneTargets, enhanceAmbientScenes } from "../public/site/src/ambient-scenes.js";
const read = path => readFile(new URL(`../${path}`,import.meta.url),"utf8");
const luminance = hex => hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
test("three distinct scenes are decorative, local and free of fake UI actions",()=>{
  const scenes = ["signal","frames","ribbons"].map(sceneMarkup);
  assert.equal(new Set(scenes).size,3);
  scenes.forEach(markup=>{assert.match(markup,/aria-hidden="true"/);assert.doesNotMatch(markup,/<button|<input|<a\s|<video|<img|<svg|https?:/);});
  assert.equal((scenes[0].match(/--height:/g)||[]).length,25);
  assert.match(scenes[1],/em-frame-deck/);assert.match(scenes[2],/em-ribbons/);
  assert.doesNotMatch(scenes[2],/class="em-scene em-ribbons"/);
});
test("sparse secondary pages get scenes but review, pricing controls and forms are not targets",()=>{
  const selectors = sceneTargets.map(([selector])=>selector).join(" ");
  for(const expected of ["creator-suite-copy","faq-section","contact-grid","managed-market-hero","provider-intro","account-story"]) assert.ok(selectors.includes(expected));
  assert.doesNotMatch(selectors,/form|review-stage|checkout|player/);
  assert.doesNotThrow(()=>enhanceAmbientScenes({querySelector:()=>{throw Error("Review must not be touched");},classList:{contains:()=>true}}));
  assert.doesNotThrow(()=>enhanceAmbientScenes({querySelector:()=>null,querySelectorAll:()=>[],classList:{contains:()=>false}}));
});
test("animation pauses offscreen, in background tabs and with reduced motion; teardown removes observers",async()=>{
  const js = await read("public/site/src/ambient-scenes.js");
  for(const pattern of [/IntersectionObserver/,/visible.has\(target\)/,/document.hidden/,/prefers-reduced-motion/,/controller.abort\(\)/,/observer\?\.disconnect\(\)/,/scenes.forEach\(scene => scene.remove\(\)\)/,/removeEventListener\("change", sync\)/]) assert.match(js,pattern);
  assert.doesNotMatch(js,/setInterval|requestAnimationFrame|fetch\(|localStorage|innerHTML\s*=/);
  const cinematic = await read("public/site/src/cinematic.js");
  assert.match(cinematic,/dataset.cxMotionPaused/);assert.match(cinematic,/dispatchEvent\(new Event\("cx:motion"\)\)/);
});
test("vivid gradient keeps brand ink readable and orange actions use white labels",async()=>{
  const require = createRequire(import.meta.resolve("vite"));
  const css = require("postcss").parse(await read("public/site/src/ember.css"));
  const variables = new Map();css.walkDecls(decl=>{if(decl.prop.startsWith("--em-"))variables.set(decl.prop,decl.value);});
  assert.equal(variables.get("--em-start"),"#ff5c20");assert.equal(variables.get("--em-end"),"#ff9b35");
  const dark = luminance(variables.get("--em-ink"));
  const stops = [variables.get("--em-start"),"#ff7828",variables.get("--em-end"),"#ff702c","#ffae4c"];
  for(const color of stops) assert.ok((luminance(color)+.05)/(dark+.05)>=4.5,`Contrast: ${color}`);
  const text = css.toString();
  assert.match(text,/body :is\(\.pill-hot,\.pay-button,\.support-fab\)/);
  assert.match(text,/color:#fff!important/);
  assert.match(text,/text-shadow:0 1px 2px #6b2100!important/);
  assert.match(text,/pointer-events:none/);assert.match(text,/animation-play-state:paused/);assert.match(text,/prefers-reduced-motion:reduce/);assert.match(text,/forced-colors:active/);
  const html = await read("public/site/index.html");assert.ok(html.indexOf("ember.css")>html.indexOf("studio-workspace.css"));
});
test("atmosphere remains optional and shares the route-race guard",async()=>{
  const main = await read("public/site/src/main.js");
  assert.match(main,/import\("\.\/ambient-scenes.js\?v=hero-restored-2"\)/);
  assert.match(main,/Promise.all\(\[cinematicReady, ambientReady\]\)/);
  assert.match(main,/motionRender !== cinematicRender/);
  assert.match(main,/ambient\?\.enhanceAmbientScenes\(root\)/);
});
