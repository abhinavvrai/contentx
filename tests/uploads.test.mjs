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
  assert.match(storage, /ALLOWED_UPLOAD_EXTENSIONS/);
  assert.match(storage, /BLOCKED_UPLOAD_EXTENSIONS/);
  assert.match(storage, /validateUploadFileMetadata/);
  assert.match(storage, /validateUploadPartSignature/);
  assert.match(route, /validateUploadPartSignature\(file, bytes, partNumber\)/);
  assert.match(storage, /idx_upload_files_project_status/);
  assert.match(schema, /uploadProjects/);
  assert.match(schema, /uploadFiles/);
  assert.match(main, /route\.startsWith\("upload\?"\)/);
  assert.match(uploads, /Drop files here/);
  assert.match(uploads, /Promise\.all/);
  assert.match(uploads, /Blocked file type for safety/);
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

test("groups replacement uploads into versions and supports controlled short share links", async () => {
  const [route, storage, schema, workspace, shortSharePage] = await Promise.all([
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/uploads.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/workspace.js", import.meta.url), "utf8"),
    readFile(new URL("../app/s/[token]/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(route, /replaceFileId/);
  assert.match(route, /create-share-link/);
  assert.match(route, /\/s\/\$\{encodeURIComponent\(token\)\}/);
  assert.match(route, /expires_at = \?/);
  assert.match(route, /version_count/);
  assert.match(storage, /project_share_links/);
  assert.match(storage, /authorizeProject/);
  assert.match(storage, /s\.token_hash = \?/);
  assert.match(schema, /versionNumber/);
  assert.match(schema, /projectShareLinks/);
  assert.match(workspace, /Drop replacement here/);
  assert.match(workspace, /Allow uploads/);
  assert.match(workspace, /Executables, archives, scripts, HTML and SVG are blocked/);
  assert.match(workspace, /Create & copy share link/);
  assert.match(workspace, /shareIntent\("whatsapp"/);
  assert.match(workspace, /data-share-status/);
  assert.match(workspace, /workspace-browser/);
  assert.match(workspace, /workspace-folder-grid/);
  assert.match(workspace, /resolvedProjectId/);
  assert.match(shortSharePage, /#share\?token=/);
});

test("persists nested project folders and moves assets safely", async () => {
  const [route, uploads, workspace, migration] = await Promise.all([
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/uploads.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/workspace.js", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0005_project_folders.sql", import.meta.url), "utf8"),
  ]);
  assert.match(route, /action === "create-folder"/);
  assert.match(route, /action === "move-assets"/);
  assert.match(route, /action === "move-folder"/);
  assert.match(route, /WITH RECURSIVE descendants/);
  assert.match(uploads, /CREATE TABLE IF NOT EXISTS project_folders/);
  assert.match(migration, /ALTER TABLE `upload_files` ADD `folder_id` text/);
  assert.match(workspace, /application\/x-contentx-asset/);
  assert.match(workspace, /data-folder-drag/);
});

test("adds compact project settings and safe folder maintenance", async () => {
  const [route, storage, workspace] = await Promise.all([
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/uploads.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/workspace.js", import.meta.url), "utf8"),
  ]);
  assert.match(route, /action === "project-settings"/);
  assert.match(route, /action === "rename-folder"/);
  assert.match(route, /action === "project-folder"/);
  assert.match(route, /UPDATE upload_files SET folder_id = \?/);
  assert.match(route, /UPDATE project_folders SET parent_id = \?, updated_at = \?/);
  assert.match(storage, /project\.status !== "active" && accessType !== "account"/);
  assert.match(workspace, /data-project-settings/);
  assert.match(workspace, /Archived — preserved, but uploads stop/);
  assert.match(workspace, /Safe folder removal/);
  assert.match(workspace, /No media is deleted/);
});

test("keeps the signed-in project dashboard consistent with the preview workspace", async () => {
  const [workspace, studio, styles] = await Promise.all([
    readFile(new URL("../public/site/src/workspace.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/studio-workspace.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/frame-workspace.css", import.meta.url), "utf8"),
  ]);
  assert.match(workspace, /function workspaceOverview/);
  assert.match(workspace, /const selected = requested \?/);
  assert.match(workspace, /data-overview-filter="active"/);
  assert.match(workspace, /workspace-share-nav/);
  assert.match(workspace, /data-folder-menu/);
  assert.match(studio, /data-appearance-button/);
  assert.match(studio, /data-fields-button/);
  assert.match(studio, /cx_workspace_appearance/);
  assert.match(styles, /workspace-overview-grid/);
  assert.match(styles, /sx-control-popover/);
  assert.match(workspace, /workspace-shell \$\{project && !accountPanel \? "project-open"/);
  assert.match(workspace, /files\.length \? fileToolbar\(\) : ""/);
  assert.match(workspace, /Add your first file/);
  assert.match(styles, /html\[data-theme="dark"\] #app\.workspace-app \.workspace-shell/);
  assert.match(styles, /grid-template-columns:56px 248px minmax\(0,1fr\)!important/);
});

test("lets account owners permanently delete a project with explicit confirmation", async () => {
  const [route, workspace, styles] = await Promise.all([
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/workspace.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/frame-workspace.css", import.meta.url), "utf8"),
  ]);
  assert.match(route, /action === "account-project"/);
  assert.match(route, /JOIN user_upload_projects u ON u\.project_id = p\.id/);
  assert.match(route, /u\.user_id = \?/);
  assert.match(route, /bucket\.delete\(objectKeys\.slice/);
  assert.match(route, /DELETE FROM project_review_comments WHERE project_id = \?/);
  assert.match(route, /DELETE FROM upload_projects WHERE id = \?/);
  assert.match(workspace, /data-delete-project/);
  assert.match(workspace, /Type <strong>\$\{escapeHTML\(project\.name\)\}<\/strong> to confirm/);
  assert.match(workspace, /Delete project permanently/);
  assert.match(styles, /workspace-delete-modal/);
});

test("adds free account workspaces with 50 GB quota and review comments", async () => {
  const [route, storage, schema, workspace, account] = await Promise.all([
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/uploads.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/workspace.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/account.js", import.meta.url), "utf8"),
  ]);

  assert.match(storage, /FREE_ACCOUNT_STORAGE_BYTES = 50 \* 1024 \* 1024 \* 1024/);
  assert.match(storage, /project_review_comments/);
  assert.match(schema, /projectReviewComments/);
  assert.match(route, /account-projects/);
  assert.match(route, /create-account-project/);
  assert.match(route, /ensureDefaultAccountProject/);
  assert.match(route, /enforceAccountStorageQuota/);
  assert.match(route, /comment-status/);
  assert.match(route, /createProjectComment/);
  assert.match(route, /requireProject\(request, projectId, "view"\)/);
  assert.match(route, /publishNotification/);
  assert.match(workspace, /Your free review workspace is ready/);
  assert.match(workspace, /50 GB/);
  assert.match(workspace, /Create project/);
  assert.match(workspace, /workspace-comments/);
  assert.match(workspace, /create-comment/);
  assert.match(workspace, /data-comment-complete/);
  assert.match(account, /Open free workspace/);
});
