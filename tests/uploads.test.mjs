import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ships durable, private project uploads instead of browser-only metadata", async () => {
  const [route, storage, schema, main, uploads, hosting, wrangler] = await Promise.all([
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/uploads.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/main.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/uploads.js", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
  ]);

  assert.match(route, /createMultipartUpload/);
  assert.match(route, /resumeMultipartUpload/);
  assert.match(route, /completeUpload/);
  assert.match(route, /downloadAdminFile/);
  assert.match(storage, /CONTENTX_OWNER_TOKEN/);
  assert.match(storage, /SHA-256/);
  assert.match(storage, /idx_upload_files_project_status/);
  assert.match(schema, /uploadProjects/);
  assert.match(schema, /uploadFiles/);
  assert.match(main, /route\.startsWith\("upload\?"\)/);
  assert.match(uploads, /Drop files here/);
  assert.match(uploads, /Promise\.all/);
  assert.equal(JSON.parse(hosting).r2, "UPLOADS");
  assert.match(wrangler, /"binding": "UPLOADS"/);
  assert.match(wrangler, /"bucket_name": "contentx"/);
});

test("keeps owner downloads streamed behind short-lived signatures", async () => {
  const [route, storage] = await Promise.all([
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/uploads.ts", import.meta.url), "utf8"),
  ]);

  assert.match(route, /admin-download-link/);
  assert.match(route, /new Response\(object\.body/);
  assert.match(route, /Content-Disposition/);
  assert.match(storage, /HMAC/);
  assert.match(storage, /expires < Date\.now\(\)/);
});

test("groups replacement uploads into versions and supports controlled share links", async () => {
  const [route, storage, schema, workspace] = await Promise.all([
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/uploads.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/workspace.js", import.meta.url), "utf8"),
  ]);
  assert.match(route, /replaceFileId/);
  assert.match(route, /create-share-link/);
  assert.match(route, /expires_at = \?/);
  assert.match(route, /version_count/);
  assert.match(storage, /project_share_links/);
  assert.match(storage, /authorizeProject/);
  assert.match(schema, /versionNumber/);
  assert.match(schema, /projectShareLinks/);
  assert.match(workspace, /Drop replacement here/);
  assert.match(workspace, /Allow uploads/);
  assert.match(workspace, /Create & copy share link/);
  assert.match(workspace, /shareIntent\("whatsapp"/);
  assert.match(workspace, /data-share-status/);
  assert.match(workspace, /workspace-revision-flow/);
});
