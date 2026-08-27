import {
  authorizeProject,
  ClientError,
  DEFAULT_MAX_FILE_BYTES,
  DEFAULT_MAX_PROJECT_BYTES,
  UPLOAD_PART_BYTES,
  cleanEmail,
  cleanText,
  contentDisposition,
  createDownloadSignature,
  ensureUploadSchema,
  getUploadBindings,
  hashToken,
  json,
  objectKey,
  randomId,
  randomToken,
  readJson,
  requireOwner,
  requireProject,
  validateFileSize,
  verifyDownloadSignature,
  type UploadFile,
  type UploadProject,
} from "../../../lib/uploads";
import { AccountError, getSessionUser, requireSameOrigin } from "../../../lib/auth";

type JsonInput = Record<string, unknown>;
const RECYCLE_BIN_DAYS = 30;
const RECYCLE_BIN_MS = RECYCLE_BIN_DAYS * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  return handle(async () => {
    await ensureUploadSchema();
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "project";
    if (action === "project") return getClientProject(request, url.searchParams.get("projectId") || "");
    if (action === "admin-projects") return getAdminProjects(request);
    if (action === "admin-files") return getAdminFiles(request, url.searchParams);
    if (action === "versions") return getAssetVersions(request, url.searchParams);
    if (action === "shares") return getProjectShares(request, url.searchParams.get("projectId") || "");
    if (action === "download") return downloadAdminFile(request, url.searchParams);
    throw new ClientError("Unknown file action.", 404);
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    await ensureUploadSchema();
    const input = await readJson<JsonInput>(request);
    const action = cleanText(input.action, 40);
    if (action === "admin-create-project") return createAdminProject(request, input);
    if (action === "admin-rotate-link") return rotateAdminProjectLink(request, input);
    if (action === "admin-download-link") return createAdminDownloadLink(request, input);
    if (action === "project-download-link") return createProjectDownloadLink(request, input);
    if (action === "create-share-link") return createProjectShareLink(request, input);
    if (action === "start-upload") return startUpload(request, input);
    if (action === "complete-upload") return completeUpload(request, input);
    if (action === "abort-upload") return abortUpload(request, input);
    throw new ClientError("Unknown file action.", 404);
  });
}

export async function PUT(request: Request) {
  return handle(async () => {
    await ensureUploadSchema();
    const url = new URL(request.url);
    if (url.searchParams.get("action") !== "upload-part") throw new ClientError("Unknown file action.", 404);
    return uploadPart(request, url.searchParams);
  });
}

export async function PATCH(request: Request) {
  return handle(async () => {
    await ensureUploadSchema();
    const input = await readJson<JsonInput>(request);
    const action = cleanText(input.action, 40);
    if (action === "share-link") return updateProjectShareLink(request, input);
    if (action === "admin-file-restore") return restoreAdminFile(request, input);
    if (action !== "admin-project-status") throw new ClientError("Unknown file action.", 404);
    await requireOwner(request);
    const projectId = cleanText(input.projectId, 80);
    const status = cleanText(input.status, 20);
    if (!projectId || !["active", "archived"].includes(status)) throw new ClientError("Choose a valid project status.");
    const { db } = getUploadBindings();
    const result = await db.prepare("UPDATE upload_projects SET status = ?, updated_at = ? WHERE id = ?")
      .bind(status, Date.now(), projectId).run();
    if (!result.meta.changes) throw new ClientError("Project not found.", 404);
    return json({ ok: true, status });
  });
}

export async function DELETE(request: Request) {
  return handle(async () => {
    await ensureUploadSchema();
    await requireOwner(request);
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    if (action !== "admin-file" && action !== "admin-file-purge") throw new ClientError("Unknown file action.", 404);
    const fileId = url.searchParams.get("fileId") || "";
    const { db, bucket } = getUploadBindings();
    const file = await db.prepare("SELECT * FROM upload_files WHERE id = ? LIMIT 1")
      .bind(fileId).first<UploadFile>();
    if (!file) throw new ClientError("File not found.", 404);
    if (action === "admin-file") {
      if (file.status === "deleted") return json({ ok: true, recycleBinDays: RECYCLE_BIN_DAYS });
      if (file.status === "uploading" && file.multipart_upload_id) {
        await bucket.resumeMultipartUpload(file.object_key, file.multipart_upload_id).abort().catch(() => undefined);
      }
      await db.prepare("UPDATE upload_files SET status = 'deleted', deleted_at = ? WHERE id = ?")
        .bind(Date.now(), file.id).run();
      return json({ ok: true, recycleBinDays: RECYCLE_BIN_DAYS });
    }
    if (file.status !== "deleted") throw new ClientError("Move this file to the recycle bin before permanent removal.");
    if (file.status === "uploading" && file.multipart_upload_id) {
      await bucket.resumeMultipartUpload(file.object_key, file.multipart_upload_id).abort().catch(() => undefined);
    } else {
      await bucket.delete(file.object_key);
    }
    await db.prepare("DELETE FROM upload_files WHERE id = ?").bind(file.id).run();
    return json({ ok: true });
  });
}

async function getClientProject(request: Request, projectId: string): Promise<Response> {
  const access = await authorizeProject(request, projectId);
  const project = access.project;
  const { db } = getUploadBindings();
  const files = await db.prepare(
    `SELECT f.id, f.original_name, f.content_type, f.size_bytes, f.status, f.uploader_name,
      f.created_at, f.completed_at, COALESCE(f.asset_id, f.id) AS asset_id,
      COALESCE(f.version_number, 1) AS version_number,
      (SELECT COUNT(*) FROM upload_files v
        WHERE v.project_id = f.project_id AND v.status = 'ready'
          AND COALESCE(v.asset_id, v.id) = COALESCE(f.asset_id, f.id)) AS version_count
     FROM upload_files f
     WHERE f.project_id = ? AND f.status = 'ready'
       AND NOT EXISTS (SELECT 1 FROM upload_files newer
         WHERE newer.project_id = f.project_id AND newer.status = 'ready'
           AND COALESCE(newer.asset_id, newer.id) = COALESCE(f.asset_id, f.id)
           AND COALESCE(newer.version_number, 1) > COALESCE(f.version_number, 1))
     ORDER BY f.completed_at DESC LIMIT 200`
  ).bind(project.id).all();
  return json({ project: publicProject(project), files: files.results, permissions: { canUpload: access.canUpload, accessType: access.accessType } });
}

async function getAdminProjects(request: Request): Promise<Response> {
  await requireOwner(request);
  const { db } = getUploadBindings();
  const projects = await db.prepare(
    `SELECT p.id, p.name, p.client_name, p.client_email, p.status, p.max_file_size, p.created_at, p.updated_at,
      COUNT(CASE WHEN f.status = 'ready' THEN 1 END) AS file_count,
      COALESCE(SUM(CASE WHEN f.status = 'ready' THEN f.size_bytes ELSE 0 END), 0) AS total_bytes
     FROM upload_projects p LEFT JOIN upload_files f ON f.project_id = p.id
     GROUP BY p.id ORDER BY p.updated_at DESC LIMIT 200`
  ).all();
  return json({ projects: projects.results });
}

async function getAdminFiles(request: Request, params: URLSearchParams): Promise<Response> {
  await requireOwner(request);
  const projectId = params.get("projectId") || "";
  const includeDeleted = params.get("deleted") === "1";
  const { db } = getUploadBindings();
  const project = await db.prepare(
    "SELECT id, name, client_name, client_email, status, max_file_size, created_at, updated_at FROM upload_projects WHERE id = ? LIMIT 1"
  ).bind(projectId).first<UploadProject>();
  if (!project) throw new ClientError("Project not found.", 404);
  const files = await db.prepare(
    `SELECT id, project_id, original_name, content_type, size_bytes, status, uploader_name, uploader_email,
      created_at, completed_at, deleted_at, COALESCE(asset_id, id) AS asset_id, COALESCE(version_number, 1) AS version_number
     FROM upload_files WHERE project_id = ? AND ${includeDeleted ? "status = 'deleted'" : "status != 'deleted'"} ORDER BY ${includeDeleted ? "deleted_at" : "created_at"} DESC LIMIT 500`
  ).bind(projectId).all();
  await purgeExpiredDeletedFiles(db, null);
  return json({ project: publicProject(project), files: files.results, recycleBinDays: RECYCLE_BIN_DAYS, deleted: includeDeleted });
}

async function restoreAdminFile(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  await requireOwner(request);
  const fileId = cleanText(input.fileId, 80);
  const { db } = getUploadBindings();
  const file = await db.prepare("SELECT id FROM upload_files WHERE id = ? AND status = 'deleted' LIMIT 1")
    .bind(fileId).first<{ id: string }>();
  if (!file) throw new ClientError("Deleted file not found.", 404);
  await db.prepare("UPDATE upload_files SET status = 'ready', deleted_at = NULL WHERE id = ?").bind(file.id).run();
  return json({ ok: true });
}

async function purgeExpiredDeletedFiles(db: D1Database, bucketOverride: R2Bucket | null): Promise<void> {
  const cutoff = Date.now() - RECYCLE_BIN_MS;
  const expired = await db.prepare("SELECT * FROM upload_files WHERE status = 'deleted' AND deleted_at IS NOT NULL AND deleted_at < ? LIMIT 25")
    .bind(cutoff).all<UploadFile>();
  if (!expired.results.length) return;
  const { bucket } = bucketOverride ? { bucket: bucketOverride } : getUploadBindings();
  for (const file of expired.results) {
    await bucket.delete(file.object_key).catch(() => undefined);
    await db.prepare("DELETE FROM upload_files WHERE id = ?").bind(file.id).run();
  }
}

async function getAssetVersions(request: Request, params: URLSearchParams): Promise<Response> {
  const projectId = cleanText(params.get("projectId"), 80);
  const assetId = cleanText(params.get("assetId"), 80);
  if (!projectId || !assetId) throw new ClientError("Choose a project file.");
  await requireProject(request, projectId);
  const { db } = getUploadBindings();
  const versions = await db.prepare(`SELECT id, original_name, content_type, size_bytes, status,
    uploader_name, uploader_email, created_at, completed_at, COALESCE(asset_id, id) AS asset_id,
    COALESCE(version_number, 1) AS version_number
    FROM upload_files WHERE project_id = ? AND COALESCE(asset_id, id) = ? AND status = 'ready'
    ORDER BY COALESCE(version_number, 1) DESC LIMIT 100`)
    .bind(projectId, assetId).all();
  if (!versions.results.length) throw new ClientError("File versions were not found.", 404);
  return json({ versions: versions.results });
}

async function getProjectShares(request: Request, projectId: string): Promise<Response> {
  if (!projectId) throw new ClientError("Choose a project.");
  await requireProjectManager(request, projectId);
  const { db } = getUploadBindings();
  const shares = await db.prepare(`SELECT id, name, allow_uploads, status, expires_at,
    created_at, updated_at, last_used_at FROM project_share_links
    WHERE project_id = ? ORDER BY updated_at DESC LIMIT 100`).bind(projectId).all();
  return json({ shares: shares.results });
}

async function createProjectShareLink(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  if (!projectId) throw new ClientError("Choose a project.");
  const manager = await requireProjectManager(request, projectId);
  const name = cleanText(input.name, 100) || "Client review link";
  const allowUploads = input.allowUploads === true;
  const expiryDays = input.expiryDays == null || input.expiryDays === "" ? 0 : Number(input.expiryDays);
  if (!Number.isInteger(expiryDays) || expiryDays < 0 || expiryDays > 90) throw new ClientError("Choose an expiry between 1 and 90 days.");
  const id = randomId("shr");
  const token = randomToken();
  const now = Date.now();
  const expiresAt = expiryDays ? now + expiryDays * 24 * 60 * 60 * 1000 : null;
  const { db } = getUploadBindings();
  await db.prepare(`INSERT INTO project_share_links
    (id, project_id, token_hash, created_by_user_id, name, allow_uploads, status, expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`)
    .bind(id, projectId, await hashToken(token), manager?.id || null, name, allowUploads ? 1 : 0, expiresAt, now, now).run();
  const origin = new URL(request.url).origin;
  return json({
    share: { id, name, allowUploads, status: "active", expiresAt, createdAt: now },
    shareUrl: `${origin}/site/index.html#share?project=${encodeURIComponent(projectId)}&token=${encodeURIComponent(token)}`,
  }, 201);
}

async function updateProjectShareLink(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  const shareId = cleanText(input.shareId, 80);
  const status = cleanText(input.status, 20) || "active";
  if (!projectId || !shareId || !["active", "revoked"].includes(status)) throw new ClientError("Choose a valid share link.");
  await requireProjectManager(request, projectId);
  const allowUploads = input.allowUploads === true;
  const name = cleanText(input.name, 100) || "Client review link";
  const expiryDays = input.expiryDays == null || input.expiryDays === "" ? 0 : Number(input.expiryDays);
  if (!Number.isInteger(expiryDays) || expiryDays < 0 || expiryDays > 90) throw new ClientError("Choose an expiry between 1 and 90 days.");
  const expiresAt = expiryDays ? Date.now() + expiryDays * 24 * 60 * 60 * 1000 : null;
  const { db } = getUploadBindings();
  const result = await db.prepare(`UPDATE project_share_links SET name = ?, allow_uploads = ?, status = ?, expires_at = ?, updated_at = ?
    WHERE id = ? AND project_id = ?`).bind(name, allowUploads ? 1 : 0, status, expiresAt, Date.now(), shareId, projectId).run();
  if (!result.meta.changes) throw new ClientError("Share link not found.", 404);
  return json({ ok: true, share: { id: shareId, name, allowUploads, status, expiresAt } });
}

async function createProjectDownloadLink(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  const fileId = cleanText(input.fileId, 80);
  if (!projectId || !fileId) throw new ClientError("Choose a project file.");
  await requireProject(request, projectId);
  const { db } = getUploadBindings();
  const file = await db.prepare("SELECT id FROM upload_files WHERE id = ? AND project_id = ? AND status = 'ready' LIMIT 1")
    .bind(fileId, projectId).first<{ id: string }>();
  if (!file) throw new ClientError("File not found.", 404);
  const expires = Date.now() + 5 * 60 * 1000;
  const signature = await createDownloadSignature(file.id, expires);
  const url = new URL(request.url);
  return json({ downloadUrl: `${url.origin}${url.pathname}?action=download&fileId=${encodeURIComponent(file.id)}&expires=${expires}&signature=${signature}`, expires });
}

async function requireProjectManager(request: Request, projectId: string) {
  const user = await getSessionUser(request);
  const { db } = getUploadBindings();
  if (user) {
    const owned = await db.prepare("SELECT project_id FROM user_upload_projects WHERE project_id = ? AND user_id = ? LIMIT 1")
      .bind(projectId, user.id).first();
    if (owned) return user;
  }
  await requireOwner(request);
  const project = await db.prepare("SELECT id FROM upload_projects WHERE id = ? LIMIT 1").bind(projectId).first();
  if (!project) throw new ClientError("Project not found.", 404);
  return null;
}

async function createAdminProject(request: Request, input: JsonInput): Promise<Response> {
  await requireOwner(request);
  const name = cleanText(input.name, 120);
  if (!name) throw new ClientError("Enter a project name.");
  const clientName = cleanText(input.clientName, 120);
  const clientEmail = input.clientEmail ? cleanEmail(input.clientEmail) : "";
  if (input.clientEmail && !clientEmail) throw new ClientError("Enter a valid client email.");
  const requestedLimit = input.maxFileSize ? Number(input.maxFileSize) : DEFAULT_MAX_FILE_BYTES;
  const maxFileSize = Math.min(DEFAULT_MAX_FILE_BYTES, validateFileSize(requestedLimit, DEFAULT_MAX_FILE_BYTES));
  const projectId = randomId("prj");
  const token = randomToken();
  const tokenHash = await hashToken(token);
  const now = Date.now();
  const { db } = getUploadBindings();
  await db.prepare(
    `INSERT INTO upload_projects (id, name, client_name, client_email, upload_token_hash, status, max_file_size, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`
  ).bind(projectId, name, clientName || null, clientEmail || null, tokenHash, maxFileSize, now, now).run();
  const origin = new URL(request.url).origin;
  const uploadUrl = `${origin}/site/index.html#upload?project=${encodeURIComponent(projectId)}&token=${encodeURIComponent(token)}`;
  return json({ project: { id: projectId, name, clientName, clientEmail, status: "active", maxFileSize, createdAt: now }, uploadUrl }, 201);
}

async function rotateAdminProjectLink(request: Request, input: JsonInput): Promise<Response> {
  await requireOwner(request);
  const projectId = cleanText(input.projectId, 80);
  const token = randomToken();
  const tokenHash = await hashToken(token);
  const now = Date.now();
  const { db } = getUploadBindings();
  const result = await db.prepare("UPDATE upload_projects SET upload_token_hash = ?, status = 'active', updated_at = ? WHERE id = ?")
    .bind(tokenHash, now, projectId).run();
  if (!result.meta.changes) throw new ClientError("Project not found.", 404);
  const project = await db.prepare(
    "SELECT id, name, client_name, client_email, status, max_file_size, created_at, updated_at FROM upload_projects WHERE id = ? LIMIT 1"
  ).bind(projectId).first<UploadProject>();
  if (!project) throw new ClientError("Project not found.", 404);
  const origin = new URL(request.url).origin;
  const uploadUrl = `${origin}/site/index.html#upload?project=${encodeURIComponent(projectId)}&token=${encodeURIComponent(token)}`;
  return json({ project: publicProject(project), uploadUrl });
}

async function createAdminDownloadLink(request: Request, input: JsonInput): Promise<Response> {
  await requireOwner(request);
  const fileId = cleanText(input.fileId, 80);
  const { db } = getUploadBindings();
  const file = await db.prepare("SELECT id FROM upload_files WHERE id = ? AND status = 'ready' LIMIT 1")
    .bind(fileId).first<{ id: string }>();
  if (!file) throw new ClientError("File not found.", 404);
  const expires = Date.now() + 5 * 60 * 1000;
  const signature = await createDownloadSignature(file.id, expires);
  const url = new URL(request.url);
  const downloadUrl = `${url.origin}${url.pathname}?action=download&fileId=${encodeURIComponent(file.id)}&expires=${expires}&signature=${signature}`;
  return json({ downloadUrl, expires });
}

async function startUpload(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  const project = await requireProject(request, projectId, "upload");
  const originalName = cleanText(input.fileName, 240);
  if (!originalName) throw new ClientError("The file name is missing.");
  const sizeBytes = validateFileSize(input.fileSize, project.max_file_size);
  const contentType = cleanText(input.contentType, 160) || "application/octet-stream";
  const uploaderName = cleanText(input.uploaderName, 120);
  const uploaderEmail = input.uploaderEmail ? cleanEmail(input.uploaderEmail) : "";
  if (input.uploaderEmail && !uploaderEmail) throw new ClientError("Enter a valid uploader email.");
  const fileId = randomId("fil");
  const replaceFileId = cleanText(input.replaceFileId, 80);
  const key = objectKey(project.id, fileId, originalName);
  const { db, bucket } = getUploadBindings();
  let assetId = fileId;
  let versionNumber = 1;
  let parentFileId: string | null = null;
  if (replaceFileId) {
    const previous = await db.prepare(`SELECT id, COALESCE(asset_id, id) AS asset_id, COALESCE(version_number, 1) AS version_number
      FROM upload_files WHERE id = ? AND project_id = ? AND status = 'ready' LIMIT 1`)
      .bind(replaceFileId, project.id).first<{ id: string; asset_id: string; version_number: number }>();
    if (!previous) throw new ClientError("Choose an existing project file for the new version.", 404);
    assetId = previous.asset_id;
    parentFileId = previous.id;
    const latest = await db.prepare(`SELECT MAX(COALESCE(version_number, 1)) AS latest
      FROM upload_files WHERE project_id = ? AND COALESCE(asset_id, id) = ?`)
      .bind(project.id, assetId).first<{ latest: number }>();
    versionNumber = Number(latest?.latest || previous.version_number) + 1;
  }
  const usage = await db.prepare(
    "SELECT COALESCE(SUM(size_bytes), 0) AS total_bytes FROM upload_files WHERE project_id = ? AND status IN ('uploading', 'ready')"
  ).bind(project.id).first<{ total_bytes: number }>();
  if (Number(usage?.total_bytes || 0) + sizeBytes > DEFAULT_MAX_PROJECT_BYTES) {
    throw new ClientError("This project has reached its 250 GB upload allowance. Ask Content X to clear space or create a new project.", 413);
  }
  const multipart = await bucket.createMultipartUpload(key, {
    httpMetadata: { contentType },
    customMetadata: { projectId: project.id, fileId, originalName },
  });
  const now = Date.now();
  try {
    await db.prepare(
      `INSERT INTO upload_files (id, project_id, object_key, original_name, content_type, size_bytes, status,
        multipart_upload_id, uploader_name, uploader_email, created_at, asset_id, version_number, parent_file_id)
       VALUES (?, ?, ?, ?, ?, ?, 'uploading', ?, ?, ?, ?, ?, ?, ?)`
    ).bind(fileId, project.id, key, originalName, contentType, sizeBytes, multipart.uploadId,
      uploaderName || null, uploaderEmail || null, now, assetId, versionNumber, parentFileId).run();
  } catch (error) {
    await multipart.abort().catch(() => undefined);
    throw error;
  }
  return json({ fileId, uploadId: multipart.uploadId, partSize: UPLOAD_PART_BYTES, assetId, versionNumber });
}

async function uploadPart(request: Request, params: URLSearchParams): Promise<Response> {
  requireSameOrigin(request);
  const projectId = params.get("projectId") || "";
  const project = await requireProject(request, projectId, "upload");
  const fileId = params.get("fileId") || "";
  const uploadId = params.get("uploadId") || "";
  const partNumber = Number(params.get("partNumber"));
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000) throw new ClientError("Invalid upload part.");
  const { db, bucket } = getUploadBindings();
  const file = await db.prepare(
    "SELECT * FROM upload_files WHERE id = ? AND project_id = ? AND multipart_upload_id = ? AND status = 'uploading' LIMIT 1"
  ).bind(fileId, project.id, uploadId).first<UploadFile>();
  if (!file) throw new ClientError("This upload session is no longer available.", 404);
  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > UPLOAD_PART_BYTES) throw new ClientError("Invalid upload chunk.", 413);
  const part = await bucket.resumeMultipartUpload(file.object_key, uploadId).uploadPart(partNumber, bytes);
  return json({ partNumber: part.partNumber, etag: part.etag });
}

async function completeUpload(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  const project = await requireProject(request, projectId, "upload");
  const fileId = cleanText(input.fileId, 80);
  const uploadId = cleanText(input.uploadId, 240);
  const parts = Array.isArray(input.parts) ? input.parts.map(item => {
    const value = item as Record<string, unknown>;
    return { partNumber: Number(value.partNumber), etag: cleanText(value.etag, 240) };
  }) : [];
  if (!parts.length || parts.some(part => !Number.isInteger(part.partNumber) || part.partNumber < 1 || !part.etag)) {
    throw new ClientError("The upload parts are incomplete.");
  }
  const { db, bucket } = getUploadBindings();
  const file = await db.prepare(
    "SELECT * FROM upload_files WHERE id = ? AND project_id = ? AND multipart_upload_id = ? AND status = 'uploading' LIMIT 1"
  ).bind(fileId, project.id, uploadId).first<UploadFile>();
  if (!file) throw new ClientError("This upload session is no longer available.", 404);
  const upload = bucket.resumeMultipartUpload(file.object_key, uploadId);
  const completed = await upload.complete(parts);
  if (completed.size !== file.size_bytes) {
    await bucket.delete(file.object_key);
    await db.prepare("UPDATE upload_files SET status = 'failed', completed_at = ? WHERE id = ?").bind(Date.now(), file.id).run();
    throw new ClientError("The uploaded file size did not match the original. Please try again.", 409);
  }
  const now = Date.now();
  await db.batch([
    db.prepare("UPDATE upload_files SET status = 'ready', multipart_upload_id = NULL, completed_at = ? WHERE id = ?").bind(now, file.id),
    db.prepare("UPDATE upload_projects SET updated_at = ? WHERE id = ?").bind(now, project.id),
  ]);
  return json({ file: { id: file.id, name: file.original_name, contentType: file.content_type,
    sizeBytes: completed.size, status: "ready", completedAt: now,
    assetId: file.asset_id || file.id, versionNumber: file.version_number || 1 } });
}

async function abortUpload(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  const project = await requireProject(request, projectId, "upload");
  const fileId = cleanText(input.fileId, 80);
  const uploadId = cleanText(input.uploadId, 240);
  const { db, bucket } = getUploadBindings();
  const file = await db.prepare(
    "SELECT * FROM upload_files WHERE id = ? AND project_id = ? AND multipart_upload_id = ? AND status = 'uploading' LIMIT 1"
  ).bind(fileId, project.id, uploadId).first<UploadFile>();
  if (file) {
    await bucket.resumeMultipartUpload(file.object_key, uploadId).abort().catch(() => undefined);
    await db.prepare("UPDATE upload_files SET status = 'failed' WHERE id = ?").bind(file.id).run();
  }
  return json({ ok: true });
}

async function downloadAdminFile(request: Request, params: URLSearchParams): Promise<Response> {
  const fileId = params.get("fileId") || "";
  const expires = Number(params.get("expires"));
  const signature = params.get("signature") || "";
  if (!(await verifyDownloadSignature(fileId, expires, signature))) await requireOwner(request);
  const { db, bucket } = getUploadBindings();
  const file = await db.prepare("SELECT * FROM upload_files WHERE id = ? AND status = 'ready' LIMIT 1")
    .bind(fileId).first<UploadFile>();
  if (!file) throw new ClientError("File not found.", 404);
  const object = await bucket.get(file.object_key);
  if (!object) throw new ClientError("Stored file not found.", 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", file.content_type || "application/octet-stream");
  headers.set("Content-Length", String(object.size));
  headers.set("Content-Disposition", contentDisposition(file.original_name));
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(object.body, { headers });
}

function publicProject(project: UploadProject) {
  return {
    id: project.id,
    name: project.name,
    clientName: project.client_name,
    clientEmail: project.client_email,
    status: project.status,
    maxFileSize: project.max_file_size,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

async function handle(operation: () => Promise<Response>): Promise<Response> {
  try {
    return await operation();
  } catch (error) {
    const known = error instanceof ClientError || error instanceof AccountError;
    const status = known ? error.status : 503;
    const message = known ? error.message : "The file service is temporarily unavailable.";
    if (!known) console.error("Content X upload error", error);
    return json({ error: message }, status);
  }
}
