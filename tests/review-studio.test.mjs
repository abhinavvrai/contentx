import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { filterFiles, filterComments, commentsForVersion, hasTimestamp, timecode, reviewSummary, workspacePulse, enhanceStudioDashboard } from "../public/site/src/studio-workspace.js";
import { reviewCommentMarkup, exportReviewCsv, exportReviewEdl, exportReviewText, chooseVoiceMimeType } from "../public/site/src/review-room.js";
import { parseMediaRange } from "../lib/media-range.ts";
const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const files = [
  { id:"v2", asset_id:"asset1", original_name:"Launch Cut.mp4", content_type:"video/mp4", size_bytes:200, completed_at:20, version_count:2 },
  { id:"image1", original_name:"Brand.png", content_type:"image/png", size_bytes:50, completed_at:30, version_count:1 },
  { id:"audio1", original_name:"Music.wav", content_type:"audio/wav", size_bytes:300, completed_at:10, version_count:1 },
];
const comments = [
  { id:"1", asset_id:"asset1", file_id:"v1", body:"Earlier cut", author_name:"Editor", timestamp_seconds:3, status:"open", created_at:2 },
  { id:"2", asset_id:"asset1", file_id:"v2", body:"Fix title", author_name:"Client", timestamp_seconds:0, status:"open", created_at:5 },
  { id:"3", asset_id:"asset1", file_id:"v2", body:"Music fixed", author_name:"Editor", timestamp_seconds:8, status:"completed", created_at:4 },
  { id:"4", body:"General note", author_name:"Client", timestamp_seconds:null, status:"open", created_at:1 },
];
test("file search, type, open feedback and version filters compose without mutating records", () => {
  assert.deepEqual(filterFiles(files,{ query:"  launch ",type:"video" }).map(f=>f.id),["v2"]);
  assert.deepEqual(filterFiles(files,{ type:"versions" }).map(f=>f.id),["v2"]);
  assert.deepEqual(filterFiles(files,{ type:"feedback" },comments).map(f=>f.id),["v2"]);
  assert.deepEqual(filterFiles(files,{ sort:"size" }).map(f=>f.id),["audio1","v2","image1"]);
  assert.deepEqual(filterFiles(files,{ sort:"name" }).map(f=>f.id),["image1","v2","audio1"]);
  assert.equal(filterFiles(files,{query:"missing"}).length,0);
  assert.equal(files[0].id,"v2");
});
test("comments stay attached to the right version, not every cut or project", () => {
  assert.deepEqual(commentsForVersion(comments,files[0]).map(c=>c.id),["2","3"]);
  assert.deepEqual(commentsForVersion(comments,files[1]),[]);
});
test("comment filters and sorting support a real revision queue", () => {
  assert.deepEqual(filterComments(comments,{status:"complete"}).map(c=>c.id),["3"]);
  assert.deepEqual(filterComments(comments,{query:"title",status:"open"}).map(c=>c.id),["2"]);
  assert.deepEqual(filterComments(comments,{sort:"time"}).map(c=>c.id),["2","1","3","4"]);
  assert.deepEqual(filterComments(comments,{sort:"newest"}).map(c=>c.id),["2","3","1","4"]);
  assert.deepEqual(reviewSummary(comments),{total:4,complete:1,open:3,percent:25});
  assert.deepEqual(reviewSummary([]),{total:0,complete:0,open:0,percent:0});
});
test("general comments never accidentally appear at 00:00; zero is a valid timestamp", () => {
  for (const value of [null,undefined,"",-1,NaN,Infinity]) assert.equal(hasTimestamp(value),false);
  assert.equal(hasTimestamp(0),true); assert.equal(timecode(125.9),"02:05");
  assert.doesNotMatch(reviewCommentMarkup(comments[3],false),/data-seek/);
  assert.match(reviewCommentMarkup(comments[1],false),/data-seek="0"/);
});
test("review notes escape content and expose completion only to project managers", () => {
  const hostile = {...comments[1],author_name:'<img src=x>',body:'<script>alert(1)</script>',id:'" onclick="bad'};
  const markup = reviewCommentMarkup(hostile,true);
  assert.doesNotMatch(markup,/<script>|<img src=x>|id="" onclick=/);
  assert.match(markup,/&lt;script&gt;/);
  assert.doesNotMatch(reviewCommentMarkup(hostile,false),/data-review-resolve/);
  assert.match(reviewCommentMarkup(comments[2],true),/Reopen/);
  assert.match(exportReviewText("Cut",2,comments),/\[OPEN\] 00:00/);
  assert.match(exportReviewText("Cut",2,comments),/\[DONE\] 00:08/);
  assert.match(exportReviewCsv("Cut",2,comments),/"Project file","Version","Timecode"/);
  assert.match(exportReviewCsv("Cut",2,[{...comments[1],body:"=HYPERLINK(\"bad\")"}]),/"'=HYPERLINK\(""bad""\)"/);
  assert.match(exportReviewEdl("Cut",2,comments),/TITLE: Content X - Cut - V2/);
  assert.match(exportReviewEdl("Cut",2,comments),/001  AX       V     C/);
  assert.match(exportReviewEdl("Cut",2,comments),/\* COMMENT: \[OPEN\] Client: Fix title/);
});
test("voice recorder chooses the safest supported format and exposes recovery controls", async () => {
  assert.equal(chooseVoiceMimeType({ isTypeSupported:type => type === "audio/mp4" }),"audio/mp4");
  assert.equal(chooseVoiceMimeType({ isTypeSupported:() => false }),"");
  assert.equal(chooseVoiceMimeType(null),"");
  const review = await read("public/site/src/review-room.js");
  for (const pattern of [/data-test-mic/,/data-pause-voice/,/data-cancel-voice/,/data-mic-device/,/startVoiceMeter/,/microphoneError/,/uploadedVoiceNoteId/]) assert.match(review,pattern);
  assert.doesNotMatch(review,/stopRecording\(\)/);
  assert.doesNotMatch(review,/event\.currentTarget\.classList\.remove\("is-recording"\)/);
});
test("version decisions preserve approval history and block premature approval", async () => {
  const [route, storage, schema, migration, review, styles] = await Promise.all([
    read("app/api/uploads/route.ts"),
    read("lib/uploads.ts"),
    read("db/schema.ts"),
    read("drizzle/0008_version_decisions.sql"),
    read("public/site/src/review-room.js"),
    read("public/site/src/studio-workspace.css"),
  ]);
  for (const source of [storage,schema,migration]) assert.match(source,/project_version_decisions/);
  assert.match(route,/action === "version-decision"/);
  assert.match(route,/function createVersionDecision/);
  assert.match(route,/status NOT IN \('completed','resolved'\)/);
  assert.match(route,/Complete the open feedback on this version before final approval/);
  assert.match(route,/ORDER BY created_at DESC LIMIT 100/);
  assert.match(review,/data-version-decision="approved"/);
  assert.match(review,/data-version-decision="changes_requested"/);
  assert.match(review,/newer feedback added/);
  assert.match(review,/Decision history/);
  assert.match(styles,/sx-version-decision/);
});
test("reviewers can capture frames and managers can update visible feedback in bulk", async () => {
  const [route, review, styles] = await Promise.all([read("app/api/uploads/route.ts"),read("public/site/src/review-room.js"),read("public/site/src/studio-workspace.css")]);
  assert.match(route,/bulk-comment-status/);
  assert.match(route,/commentIds\.map/);
  assert.match(route,/id IN \(\$\{placeholders\}\)/);
  assert.match(review,/data-bulk-comments/);
  assert.match(review,/visibleBulkIds/);
  assert.match(review,/data-capture-frame/);
  assert.match(review,/canvas\.toBlob/);
  assert.match(review,/video\.videoWidth/);
  assert.match(styles,/sx-bulk-comments/);
});
test("dashboard is optional on unrelated routes and metrics use project records", () => {
  assert.doesNotThrow(()=>enhanceStudioDashboard({querySelector:()=>null}));
  assert.match(workspacePulse(files,comments),/Open feedback/);
  assert.doesNotMatch(workspacePulse([],[]),/99|100%|Approved/);
});
test("private media supports bounded, open-ended and suffix byte requests", () => {
  assert.equal(parseMediaRange(null,100),null);
  assert.deepEqual(parseMediaRange("bytes=0-0",100),{offset:0,length:1});
  assert.deepEqual(parseMediaRange("bytes=25-",100),{offset:25,length:75});
  assert.deepEqual(parseMediaRange("bytes=20-999",100),{offset:20,length:80});
  assert.deepEqual(parseMediaRange("bytes=-10",100),{offset:90,length:10});
  assert.deepEqual(parseMediaRange("bytes=-200",100),{offset:0,length:100});
  for(const header of ["bytes=100-","bytes=3-2","bytes=-0","bytes=-","bytes=a-b","bytes=0-1,3-4","items=0-1","bytes=9007199254740993-"]) assert.equal(parseMediaRange(header,100),false,header);
  assert.equal(parseMediaRange("bytes=0-",0),false);
});
test("new review uses authorized APIs, scopes comments and keeps tokens out of browser storage", async () => {
  const [review,route,workspace,main] = await Promise.all([read("public/site/src/review-room.js"),read("app/api/uploads/route.ts"),read("public/site/src/workspace.js"),read("public/site/src/main.js")]);
  assert.match(review,/headers:headers\(true\)/);
  assert.match(review,/fileId:version.id/);
  assert.match(review,/ticket !== request/);
  assert.match(review,/dialog.showModal\(\)/);
  assert.match(review,/addEventListener\("close", close\)/);
  assert.match(review,/data-export-format/);
  assert.match(review,/exportReviewCsv/);
  assert.match(review,/exportReviewEdl/);
  assert.doesNotMatch(review,/localStorage|access_token|refresh_token|frame\.io/);
  assert.match(review,/sessionStorage\.setItem\(draftKey/);
  assert.match(route,/WHERE id = \? AND project_id = \? AND status = 'ready'/);
  assert.match(route,/requireProjectManager\(request, projectId\)/);
  assert.match(route,/import \{[^}]*requireSessionUser[^}]*\} from "\.\.\/\.\.\/\.\.\/lib\/auth"/);
  assert.match(route,/status:range \? 206 : 200/);
  assert.ok(route.indexOf('verifyDownloadSignature(fileId, expires, signature)') < route.indexOf('parseMediaRange(request.headers'));
  assert.match(workspace,/enhanceFileLibrary\(root, data.files/);
  assert.match(main,/delete root.dataset\[key\]/);
});
test("dashboard styles parse and include mobile, contrast and reduced-motion controls", async () => {
  const require = createRequire(import.meta.resolve("vite"));
  const css = await read("public/site/src/studio-workspace.css"), frameCss = await read("public/site/src/frame-workspace.css");
  assert.doesNotThrow(()=>require("postcss").parse(css));
  assert.doesNotThrow(()=>require("postcss").parse(frameCss));
  for(const pattern of [/prefers-reduced-motion/,/max-width:560px/,/:focus-visible/,/\.sx-media-grid\.is-comparing/,/\.sx-list/,/\.sx-review-room::backdrop/]) assert.match(css,pattern);
  for(const pattern of [/\.sx-voice-composer/,/\.sx-voice-wave/,/data-state="recording"/,/data-state="error"/]) assert.match(frameCss,pattern);
  assert.match(await read("public/site/index.html"),/studio-workspace\.css\?v=frame-native-16/);
});
