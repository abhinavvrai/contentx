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
  assert.match(workspace, /Uploads/);
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
  assert.match(workspace, /files\.length \? `\$\{fileToolbar\(\)\}\$\{canManageFolders \? assetBulkBar\(folders\)/);
  assert.match(workspace, /Add your first file/);
  assert.match(styles, /html\[data-theme="dark"\] #app\.workspace-app \.workspace-shell/);
  assert.match(styles, /grid-template-columns:56px 248px minmax\(0,1fr\)!important/);
  assert.match(workspace, /RECENT_PROJECTS_KEY/);
  assert.match(workspace, /function openWorkspaceCommandMenu/);
  assert.match(workspace, /Search projects, folders, files or feedback/);
  assert.match(workspace, /Open folder ·/);
  assert.match(workspace, /Open file ·/);
  assert.match(workspace, /Feedback ·/);
  assert.match(workspace, /Quick commands and search/);
  assert.match(workspace, /data-review-attention/);
  assert.match(workspace, /data-comment-filter="open"/);
  assert.match(styles, /workspace-command-menu/);
  assert.match(styles, /workspace-review-attention/);
  assert.match(workspace, /const workspaceIcon/);
  assert.match(workspace, /workspaceIcon\("bell"\)/);
  assert.match(styles, /\.workspace-icon/);
});

test("loads private video-card previews only on hover or keyboard focus", async () => {
  const [workspace, styles] = await Promise.all([
    readFile(new URL("../public/site/src/workspace.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/frame-workspace.css", import.meta.url), "utf8"),
  ]);
  assert.match(workspace, /data-video-preview/);
  assert.match(workspace, /function bindVideoHoverPreviews/);
  assert.match(workspace, /action:\"project-download-link\"/);
  assert.match(workspace, /video\.muted = true/);
  assert.match(workspace, /video\.playsInline = true/);
  assert.match(workspace, /pointerenter/);
  assert.match(workspace, /pointerleave/);
  assert.match(workspace, /trigger\.addEventListener\(\"focus\"/);
  assert.match(workspace, /event\.pointerType === \"touch\"/);
  assert.match(styles, /workspace-video-preview video/);
  assert.match(styles, /is-preview-loading/);
  assert.match(styles, /@media\(hover:none\)/);
});

test("supports secure voice notes and multi-format review", async () => {
  const [route, storage, schema, review, ui, styles] = await Promise.all([
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/uploads.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/review-room.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/ui.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/frame-workspace.css", import.meta.url), "utf8"),
  ]);
  assert.match(storage, /project_comment_voice_notes/);
  assert.match(schema, /projectCommentVoiceNotes/);
  assert.match(route, /create-comment-voice/);
  assert.match(route, /comment-voice-link/);
  assert.match(route, /bytes\.byteLength/);
  assert.match(route, /DELETE FROM project_comment_voice_notes/);
  assert.match(review, /MediaRecorder/);
  assert.match(review, /sx-document-frame/);
  assert.match(review, /Quote selected text/);
  assert.match(review, /Page \$\{page\}/);
  assert.match(ui, /togglePlayback/);
  assert.match(ui, /bindProductNavigation/);
  assert.match(ui, /rootMargin:"320px 0px"/);
  assert.match(styles, /playback-flash/);
  assert.match(styles, /sx-script-preview::selection/);
});

test("adds focused pro review controls without duplicating workspace navigation", async () => {
  const [advanced, advancedStyles, room] = await Promise.all([
    readFile(new URL("../public/site/src/advanced.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/advanced.css", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/review-room.js", import.meta.url), "utf8"),
  ]);
  assert.match(advanced, /review-loop-strip/);
  assert.match(advanced, /data-loop-in/);
  assert.match(advanced, /data-loop-out/);
  assert.match(advanced, /review-timeline-pins/);
  assert.match(advanced, /data-compare-mode="wipe"/);
  assert.match(advancedStyles, /\.comparison-grid\.wipe-mode/);
  assert.match(advancedStyles, /\.review-timeline-pins/);
  assert.match(room, /data-export-format/);
  assert.match(room, /review-v\$\{selected\.version_number\}\.\$\{extensions\[format\]\}/);
  assert.match(room, /data-open-note-next/);
  assert.match(room, /data-playback-rate/);
  assert.match(room, /requestPictureInPicture/);
  assert.match(room, /1\/30/);
});

test("keeps multipart uploads recoverable with pause, resume and cancellation", async () => {
  const [workspace, styles] = await Promise.all([
    readFile(new URL("../public/site/src/workspace.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/frame-workspace.css", import.meta.url), "utf8"),
  ]);
  assert.match(workspace, /data-upload-pause/);
  assert.match(workspace, /data-upload-cancel/);
  assert.match(workspace, /Upload paused safely/);
  assert.match(workspace, /abort-upload/);
  assert.match(styles, /workspace-upload-actions/);
  assert.match(styles, /workspace-queue article\.paused/);
});

test("persists review ranges, workflow metadata, internal notes and threaded replies", async () => {
  const [route, storage, schema, migration, room] = await Promise.all([
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/uploads.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0007_review_workflow.sql", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/review-room.js", import.meta.url), "utf8"),
  ]);
  for (const pattern of [/range_end_seconds/,/priority/,/assignee/,/due_at/,/visibility/,/parent_comment_id/]) {
    assert.match(route,pattern); assert.match(storage,pattern); assert.match(migration,pattern);
  }
  assert.match(schema,/rangeEndSeconds/);
  assert.match(route,/comment-workflow/);
  assert.match(route,/access\.accessType === "account"/);
  assert.match(route,/visibility = 'project'/);
  assert.match(room,/data-range-end/);
  assert.match(room,/data-reply-note/);
  assert.match(room,/data-save-workflow/);
  assert.match(room,/Internal team only/);
});

test("keeps removed project assets recoverable for managers", async () => {
  const [route, workspace, styles] = await Promise.all([
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/workspace.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/frame-workspace.css", import.meta.url), "utf8"),
  ]);
  assert.match(route, /action === "deleted-files"/);
  assert.match(route, /action === "project-file"/);
  assert.match(route, /action === "project-file-restore"/);
  assert.match(route, /function getDeletedProjectFiles/);
  assert.match(route, /function deleteProjectFile/);
  assert.match(route, /function restoreProjectFile/);
  assert.match(route, /requireProjectManager\(request, projectId\)/);
  assert.match(route, /SET status = 'deleted', deleted_at = \?/);
  assert.match(route, /SET status = 'ready', deleted_at = NULL/);
  assert.match(workspace, /data-recycle-bin/);
  assert.match(workspace, /data-delete-asset/);
  assert.match(workspace, /function openRecycleBinModal/);
  assert.match(workspace, /Move .* and all its versions to Recently deleted/);
  assert.match(styles, /workspace-recycle-list/);
  assert.match(styles, /workspace-file-actions/);
});

test("supports manager-only multi-select move and recoverable bulk removal", async () => {
  const [route, workspace, styles] = await Promise.all([
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/workspace.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/frame-workspace.css", import.meta.url), "utf8"),
  ]);
  assert.match(route,/action === "project-files-delete"/);
  assert.match(route,/function deleteProjectFiles/);
  assert.match(route,/COALESCE\(asset_id,id\) IN/);
  assert.match(workspace,/data-select-asset/);
  assert.match(workspace,/data-asset-bulk/);
  assert.match(workspace,/function bindAssetSelection/);
  assert.match(workspace,/action:"move-assets"/);
  assert.match(workspace,/action:"project-files-delete"/);
  assert.match(styles,/workspace-bulk-bar/);
  assert.match(styles,/workspace-file-card\.is-selected/);
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
  assert.match(route, /authorizeProject\(request, projectId, "view"\)/);
  assert.match(route, /publishNotification/);
  assert.match(workspace, /Your free review workspace is ready/);
  assert.match(workspace, /50 GB/);
  assert.match(workspace, /Create project/);
  assert.match(workspace, /workspace-comments/);
  assert.match(workspace, /create-comment/);
  assert.match(workspace, /data-comment-complete/);
  assert.match(account, /Open free workspace/);
});

test("keeps the workspace usable through transient refresh and upload failures", async () => {
  const [workspace, styles] = await Promise.all([
    readFile(new URL("../public/site/src/workspace.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/frame-workspace.css", import.meta.url), "utf8"),
  ]);

  assert.match(workspace, /error\.status = response\.status/);
  assert.match(workspace, /function uploadPartCanRetry/);
  assert.match(workspace, /status === 408/);
  assert.match(workspace, /status === 429/);
  assert.match(workspace, /maximumAttempts = 3/);
  assert.match(workspace, /uploadPartWithRetry/);
  assert.match(workspace, /retrying part/);
  assert.match(workspace, /data-workspace-refresh-error/);
  assert.match(workspace, /Your open workspace is still safe/);
  assert.match(workspace, /workspace-mobile-nav/);
  assert.match(styles, /workspace-refresh-error/);
  assert.match(styles, /workspace-mobile-nav/);
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
});

test("ships password-protected, file-scoped share permissions with audit metrics", async () => {
  const [route, storage, schema, migration, workspace, review, styles] = await Promise.all([
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/uploads.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0009_share_permissions.sql", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/workspace.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/review-room.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site/src/frame-workspace.css", import.meta.url), "utf8"),
  ]);
  for (const pattern of [/allow_downloads/,/allow_comments/,/allow_approval/,/allow_previous_versions/,/asset_scope_json/,/password_hash/,/view_count/,/download_count/]) {
    assert.match(schema, pattern); assert.match(migration, pattern); assert.match(route, pattern);
  }
  assert.match(storage, /PBKDF2/);
  assert.match(storage, /iterations:210_000/);
  assert.match(storage, /x-contentx-share-password/);
  assert.match(storage, /inlineOnly \? "inline" : "download"/);
  assert.match(route, /shareAssetAllowed/);
  assert.match(route, /Comments are disabled for this share link/);
  assert.match(route, /Approval is disabled for this share link/);
  assert.match(route, /Downloads are disabled for this share link/);
  assert.match(route, /function getProjectActivity/);
  assert.match(workspace, /sharedPasswordGate/);
  assert.match(workspace, /Files included/);
  assert.match(workspace, /data-project-activity/);
  assert.match(workspace, /activeWorkspaceUploads/);
  assert.match(review, /New feedback is disabled/);
  assert.match(review, /Approval controls are disabled/);
  assert.match(review, /Refreshing private preview/);
  assert.match(styles, /workspace-share-permissions/);
  assert.match(styles, /workspace-activity-list/);
});
