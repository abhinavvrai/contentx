import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
test("the accepted checklist tracks all 186 in-scope items exactly once",()=>{
  const content=read("docs/APP_IMPROVEMENT_CHECKLIST.md");
  const ids=[...content.matchAll(/^\| ([A-Z]\d+) \|/gm)].map(match=>match[1]);
  const counts={V:20,R:24,A:15,W:20,F:11,S:17,P:18,N:12,B:14,U:20,Q:15};
  assert.equal(ids.length,186);assert.equal(new Set(ids).size,186);
  for(const [prefix,count] of Object.entries(counts))for(let n=1;n<=count;n++)assert.ok(ids.includes(`${prefix}${n}`));
  assert.ok(!ids.some(id=>id.startsWith("M")));
});
test("build cleanup preserves local databases and object storage",()=>{
  const content=read("scripts/clean-build.mjs");
  assert.doesNotMatch(content,/\[.*["']\.wrangler["']/);
  assert.match(content,/\.wrangler\/deploy/);
});
test("voice notes are allowed only for this origin and through the same-origin app frame",()=>{
  assert.match(read("worker/index.ts"),/microphone=\(self\)/);
  assert.doesNotMatch(read("worker/index.ts"),/microphone=\(\*\)/);
  assert.match(read("app/page.tsx"),/allow="microphone 'self'/);
});
