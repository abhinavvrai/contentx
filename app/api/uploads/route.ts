import { parseMediaRange } from "../../../lib/media-range";
import {
  authorizeProject,
  ClientError,
  DEFAULT_MAX_FILE_BYTES,
  DEFAULT_MAX_PROJECT_BYTES,
  FREE_ACCOUNT_STORAGE_BYTES,
  UPLOAD_PART_BYTES,
  cleanEmail,
  cleanText,
  contentDisposition,
  createDownloadSignature,
  ensureUploadSchema,
  formatBytes,
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
  validateUploadFileMetadata,
  validateUploadPartSignature,
  verifyDownloadSignature,
  type UploadFile,
  type UploadProject,
} from "../../../lib/uploads";
import { AccountError, ensureAccountSchema, getAccountDatabase, getSessionUser, requireSameOrigin, requireSessionUser } from "../../../lib/auth";
import { notifyOwner, publishNotification } from "../../../lib/notifications";
import { ensurePaymentSchema, revisionPolicyForPlan } from "../../../lib/razorpay";

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
    if (action === "account-projects") return getAccountProjects(request);
    if (action === "comments") return getProjectComments(request, url.searchParams);
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
    if (action === "create-account-project") return createAccountProject(request, input);
    if (action === "create-folder") return createProjectFolder(request, input);
    if (action === "create-comment") return createProjectComment(request, input);
    if (action === "create-comment-voice") return createCommentVoiceNote(request, input);
    if (action === "comment-voice-link") return createCommentVoiceLink(request, input);
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
    if (action === "comment-status") return updateProjectCommentStatus(request, input);
    if (action === "move-assets") return moveProjectAssets(request, input);
    if (action === "move-folder") return moveProjectFolder(request, input);
    if (action === "rename-folder") return renameProjectFolder(request, input);
    if (action === "project-settings") return updateProjectSettings(request, input);
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
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    if (action === "account-project") return deleteAccountProject(request, url.searchParams.get("projectId") || "");
    if (action === "project-folder") return deleteProjectFolder(request, url.searchParams);
    await requireOwner(request);
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

async function deleteAccountProject(request: Request, rawProjectId: string): Promise<Response> {
  requireSameOrigin(request);
  await Promise.all([ensureAccountSchema(), ensurePaymentSchema()]);
  const user = await requireSessionUser(request);
  const projectId = cleanText(rawProjectId, 80);
  if (!projectId) throw new ClientError("Choose a project to delete.");
  const { db, bucket } = getUploadBindings();
  const project = await db.prepare(`SELECT p.id, p.name FROM upload_projects p
    JOIN user_upload_projects u ON u.project_id = p.id
    WHERE p.id = ? AND u.user_id = ? LIMIT 1`).bind(projectId, user.id).first<{ id:string; name:string }>();
  if (!project) throw new ClientError("Project not found.", 404);
  const files = await db.prepare("SELECT id, object_key, status, multipart_upload_id FROM upload_files WHERE project_id = ?")
    .bind(projectId).all<Pick<UploadFile,"id"|"object_key"|"status"|"multipart_upload_id">>();
  const voices = await db.prepare("SELECT object_key FROM project_comment_voice_notes WHERE project_id = ?").bind(projectId).all<{ object_key:string }>();
  for (const file of files.results) {
    if (file.status === "uploading" && file.multipart_upload_id) {
      await bucket.resumeMultipartUpload(file.object_key, file.multipart_upload_id).abort().catch(() => undefined);
    }
  }
  const objectKeys = [...new Set([...files.results.map(file => file.object_key), ...voices.results.map(voice => voice.object_key)].filter(Boolean))];
  for (let offset = 0; offset < objectKeys.length; offset += 1000) {
    await bucket.delete(objectKeys.slice(offset, offset + 1000));
  }
  await db.batch([
    db.prepare("UPDATE payment_orders SET project_id = NULL WHERE project_id = ?").bind(projectId),
    db.prepare("UPDATE order_selections SET project_id = NULL, asset_id = NULL WHERE project_id = ?").bind(projectId),
    db.prepare("DELETE FROM project_review_comments WHERE project_id = ?").bind(projectId),
    db.prepare("DELETE FROM project_comment_voice_notes WHERE project_id = ?").bind(projectId),
    db.prepare("DELETE FROM project_share_links WHERE project_id = ?").bind(projectId),
    db.prepare("DELETE FROM project_folders WHERE project_id = ?").bind(projectId),
    db.prepare("DELETE FROM upload_files WHERE project_id = ?").bind(projectId),
    db.prepare("DELETE FROM user_upload_projects WHERE project_id = ? AND user_id = ?").bind(projectId, user.id),
    db.prepare("DELETE FROM upload_projects WHERE id = ?").bind(projectId),
  ]);
  return json({ ok:true, deletedProject:{ id:project.id, name:project.name }, deletedFiles:files.results.length });
}

async function getClientProject(request: Request, projectId: string): Promise<Response> {
  await Promise.all([ensureAccountSchema(), ensurePaymentSchema()]);
  const access = await authorizeProject(request, projectId);
  const project = access.project;
  const { db } = getUploadBindings();
  const files = await db.prepare(
    `SELECT f.id, f.original_name, f.content_type, f.size_bytes, f.status, f.uploader_name,
      f.created_at, f.completed_at, f.folder_id, COALESCE(f.asset_id, f.id) AS asset_id,
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
  const folders = await db.prepare(`SELECT id, project_id, parent_id, name, position, created_at, updated_at,
    (SELECT COUNT(*) FROM upload_files f WHERE f.project_id = project_folders.project_id
      AND f.folder_id = project_folders.id AND f.status = 'ready'
      AND NOT EXISTS (SELECT 1 FROM upload_files newer WHERE newer.project_id = f.project_id
        AND newer.status = 'ready' AND COALESCE(newer.asset_id,newer.id) = COALESCE(f.asset_id,f.id)
        AND COALESCE(newer.version_number,1) > COALESCE(f.version_number,1))) AS asset_count
    FROM project_folders WHERE project_id = ? ORDER BY parent_id, position, name`).bind(project.id).all();
  let revisionPolicy: { service: "video" | "longform"; included: number; purchasedByAsset: Record<string, number> } | null = null;
  if (access.accessType === "account") {
    const accountDb = getAccountDatabase();
    const originalOrder = await accountDb.prepare(`SELECT p.plan_id
      FROM user_upload_projects u JOIN payment_orders p ON p.razorpay_order_id = u.razorpay_order_id
      WHERE u.project_id = ? AND p.status IN ('verified', 'captured')
        AND COALESCE(p.refund_status, 'none') NOT IN ('requested', 'processing', 'refunded') LIMIT 1`)
      .bind(project.id).first<{ plan_id: string }>();
    const policy = revisionPolicyForPlan(originalOrder?.plan_id || "");
    if (policy) {
      const purchases = await accountDb.prepare(`SELECT s.asset_id, COUNT(*) AS purchased
        FROM order_selections s JOIN payment_orders p ON p.razorpay_order_id = s.razorpay_order_id
        WHERE s.project_id = ? AND s.asset_id IS NOT NULL
          AND p.plan_id IN ('revision_short', 'revision_long')
          AND p.status IN ('verified', 'captured')
          AND COALESCE(p.refund_status, 'none') NOT IN ('requested', 'processing', 'refunded')
        GROUP BY s.asset_id`).bind(project.id).all<{ asset_id: string; purchased: number }>();
      revisionPolicy = {
        ...policy,
        purchasedByAsset: Object.fromEntries(purchases.results.map(item => [item.asset_id, Number(item.purchased || 0)])),
      };
    }
  }
  return json({ project: publicProject(project), files: files.results, folders: folders.results, revisionPolicy, permissions: { canUpload: access.canUpload, accessType: access.accessType } });
}

async function createProjectFolder(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  const name = cleanText(input.name, 80);
  const parentId = cleanText(input.parentId, 80) || null;
  if (!projectId || !name) throw new ClientError("Name the folder before creating it.");
  await requireProjectManager(request, projectId);
  const { db } = getUploadBindings();
  if (parentId) {
    const parent = await db.prepare("SELECT id FROM project_folders WHERE id = ? AND project_id = ? LIMIT 1").bind(parentId, projectId).first();
    if (!parent) throw new ClientError("Choose a folder from this project.", 404);
  }
  const duplicate = await db.prepare("SELECT id FROM project_folders WHERE project_id = ? AND COALESCE(parent_id,'') = COALESCE(?, '') AND lower(name) = lower(?) LIMIT 1").bind(projectId, parentId, name).first();
  if (duplicate) throw new ClientError("A folder with this name already exists here.");
  const position = await db.prepare("SELECT COALESCE(MAX(position),-1)+1 AS next FROM project_folders WHERE project_id = ? AND COALESCE(parent_id,'') = COALESCE(?, '')").bind(projectId, parentId).first<{ next:number }>();
  const id = randomId("fld"), now = Date.now();
  await db.prepare("INSERT INTO project_folders (id,project_id,parent_id,name,position,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").bind(id, projectId, parentId, name, Number(position?.next || 0), now, now).run();
  return json({ folder:{ id, project_id:projectId, parent_id:parentId, name, position:Number(position?.next || 0), asset_count:0 } }, 201);
}

async function moveProjectAssets(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  const folderId = cleanText(input.folderId, 80) || null;
  const assetIds = Array.isArray(input.assetIds) ? input.assetIds.map(value => cleanText(value,80)).filter(Boolean).slice(0,100) : [];
  if (!projectId || !assetIds.length) throw new ClientError("Choose at least one project asset.");
  await requireProjectManager(request, projectId);
  const { db } = getUploadBindings();
  if (folderId) {
    const folder = await db.prepare("SELECT id FROM project_folders WHERE id = ? AND project_id = ? LIMIT 1").bind(folderId, projectId).first();
    if (!folder) throw new ClientError("Choose a folder from this project.", 404);
  }
  await db.batch(assetIds.map(assetId => db.prepare("UPDATE upload_files SET folder_id = ? WHERE project_id = ? AND COALESCE(asset_id,id) = ?").bind(folderId, projectId, assetId)));
  return json({ ok:true, moved:assetIds.length, folderId });
}

async function moveProjectFolder(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  const folderId = cleanText(input.folderId, 80);
  const parentId = cleanText(input.parentId, 80) || null;
  if (!projectId || !folderId || folderId === parentId) throw new ClientError("Choose a valid folder destination.");
  await requireProjectManager(request, projectId);
  const { db } = getUploadBindings();
  const folder = await db.prepare("SELECT id FROM project_folders WHERE id = ? AND project_id = ? LIMIT 1").bind(folderId, projectId).first();
  if (!folder) throw new ClientError("Folder not found.", 404);
  if (parentId) {
    const parent = await db.prepare("SELECT id FROM project_folders WHERE id = ? AND project_id = ? LIMIT 1").bind(parentId, projectId).first();
    if (!parent) throw new ClientError("Choose a folder from this project.", 404);
    const cycle = await db.prepare(`WITH RECURSIVE descendants(id) AS (
      SELECT id FROM project_folders WHERE parent_id = ? AND project_id = ?
      UNION ALL SELECT f.id FROM project_folders f JOIN descendants d ON f.parent_id = d.id WHERE f.project_id = ?
    ) SELECT id FROM descendants WHERE id = ? LIMIT 1`).bind(folderId, projectId, projectId, parentId).first();
    if (cycle) throw new ClientError("A folder cannot be moved inside one of its own subfolders.");
  }
  await db.prepare("UPDATE project_folders SET parent_id = ?, updated_at = ? WHERE id = ? AND project_id = ?").bind(parentId, Date.now(), folderId, projectId).run();
  return json({ ok:true, folderId, parentId });
}

async function renameProjectFolder(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  const folderId = cleanText(input.folderId, 80);
  const name = cleanText(input.name, 80);
  if (!projectId || !folderId || !name) throw new ClientError("Enter a folder name.");
  await requireProjectManager(request, projectId);
  const { db } = getUploadBindings();
  const folder = await db.prepare("SELECT id, parent_id FROM project_folders WHERE id = ? AND project_id = ? LIMIT 1")
    .bind(folderId, projectId).first<{ id:string; parent_id:string|null }>();
  if (!folder) throw new ClientError("Folder not found.", 404);
  const duplicate = await db.prepare("SELECT id FROM project_folders WHERE project_id = ? AND id != ? AND COALESCE(parent_id,'') = COALESCE(?, '') AND lower(name) = lower(?) LIMIT 1")
    .bind(projectId, folderId, folder.parent_id, name).first();
  if (duplicate) throw new ClientError("A folder with this name already exists here.");
  await db.prepare("UPDATE project_folders SET name = ?, updated_at = ? WHERE id = ? AND project_id = ?")
    .bind(name, Date.now(), folderId, projectId).run();
  return json({ ok:true, folder:{ id:folderId, name } });
}

async function deleteProjectFolder(request: Request, params: URLSearchParams): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(params.get("projectId"), 80);
  const folderId = cleanText(params.get("folderId"), 80);
  if (!projectId || !folderId) throw new ClientError("Choose a folder to remove.");
  await requireProjectManager(request, projectId);
  const { db } = getUploadBindings();
  const folder = await db.prepare("SELECT id, parent_id, name FROM project_folders WHERE id = ? AND project_id = ? LIMIT 1")
    .bind(folderId, projectId).first<{ id:string; parent_id:string|null; name:string }>();
  if (!folder) throw new ClientError("Folder not found.", 404);
  const now = Date.now();
  await db.batch([
    db.prepare("UPDATE upload_files SET folder_id = ? WHERE project_id = ? AND folder_id = ?").bind(folder.parent_id, projectId, folderId),
    db.prepare("UPDATE project_folders SET parent_id = ?, updated_at = ? WHERE project_id = ? AND parent_id = ?").bind(folder.parent_id, now, projectId, folderId),
    db.prepare("DELETE FROM project_folders WHERE id = ? AND project_id = ?").bind(folderId, projectId),
  ]);
  return json({ ok:true, removedFolder:{ id:folder.id, name:folder.name }, movedTo:folder.parent_id });
}

async function updateProjectSettings(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  const name = cleanText(input.name, 120);
  const clientName = cleanText(input.clientName, 120) || null;
  const clientEmail = input.clientEmail ? cleanEmail(input.clientEmail) : "";
  const status = cleanText(input.status, 20) || "active";
  if (!projectId || !name) throw new ClientError("Enter a project name.");
  if (input.clientEmail && !clientEmail) throw new ClientError("Enter a valid client email address.");
  if (!["active", "archived"].includes(status)) throw new ClientError("Choose a valid project status.");
  await requireProjectManager(request, projectId);
  const { db } = getUploadBindings();
  const now = Date.now();
  const result = await db.prepare("UPDATE upload_projects SET name = ?, client_name = ?, client_email = ?, status = ?, updated_at = ? WHERE id = ?")
    .bind(name, clientName, clientEmail || null, status, now, projectId).run();
  if (!result.meta.changes) throw new ClientError("Project not found.", 404);
  const project = await db.prepare("SELECT id, name, client_name, client_email, status, max_file_size, created_at, updated_at FROM upload_projects WHERE id = ? LIMIT 1")
    .bind(projectId).first<UploadProject>();
  return json({ ok:true, project:publicProject(project!) });
}

async function getAccountProjects(request: Request): Promise<Response> {
  await ensureAccountSchema();
  const user = await requireSessionUser(request);
  const { db } = getUploadBindings();
  await ensureDefaultAccountProject(db, user);
  const projects = await db.prepare(
    `SELECT p.id AS project_id, p.name, p.client_name, p.client_email, p.status, p.max_file_size,
      p.created_at, p.updated_at, u.razorpay_order_id,
      COUNT(CASE WHEN f.status = 'ready' THEN 1 END) AS file_count,
      COALESCE(SUM(CASE WHEN f.status IN ('uploading', 'ready') THEN f.size_bytes ELSE 0 END), 0) AS total_bytes
     FROM user_upload_projects u
     JOIN upload_projects p ON p.id = u.project_id
     LEFT JOIN upload_files f ON f.project_id = p.id
     WHERE u.user_id = ?
     GROUP BY p.id
     ORDER BY p.updated_at DESC LIMIT 100`
  ).bind(user.id).all<Record<string, unknown>>();
  const usage = await accountStorageUsage(db, user.id);
  return json({ user, projects: projects.results, storage: { usedBytes: usage, quotaBytes: FREE_ACCOUNT_STORAGE_BYTES } });
}

async function ensureDefaultAccountProject(db: D1Database, user: { id: string; name: string; email: string }): Promise<void> {
  const existing = await db.prepare("SELECT project_id FROM user_upload_projects WHERE user_id = ? LIMIT 1").bind(user.id).first();
  if (existing) return;
  const now = Date.now();
  const projectId = randomId("prj");
  await db.batch([
    db.prepare(`INSERT INTO upload_projects
      (id, name, client_name, client_email, upload_token_hash, status, max_file_size, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`)
      .bind(projectId, "My first review project", user.name, user.email, await hashToken(randomToken()), DEFAULT_MAX_FILE_BYTES, now, now),
    db.prepare(`INSERT INTO user_upload_projects (project_id, user_id, razorpay_order_id, created_at)
      VALUES (?, ?, ?, ?)`)
      .bind(projectId, user.id, `free_${projectId}`, now),
  ]);
}

async function createAccountProject(request: Request, input: JsonInput): Promise<Response> {
  await ensureAccountSchema();
  requireSameOrigin(request);
  const user = await requireSessionUser(request);
  const name = cleanText(input.name, 120);
  const clientName = cleanText(input.clientName, 120);
  const clientEmail = input.clientEmail ? cleanEmail(input.clientEmail) : "";
  if (!name) throw new ClientError("Enter a project name.");
  if (input.clientEmail && !clientEmail) throw new ClientError("Enter a valid client email.");
  const { db } = getUploadBindings();
  const now = Date.now();
  const projectId = randomId("prj");
  await db.batch([
    db.prepare(`INSERT INTO upload_projects
      (id, name, client_name, client_email, upload_token_hash, status, max_file_size, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`)
      .bind(projectId, name, clientName || user.name, clientEmail || user.email, await hashToken(randomToken()), DEFAULT_MAX_FILE_BYTES, now, now),
    db.prepare(`INSERT INTO user_upload_projects (project_id, user_id, razorpay_order_id, created_at)
      VALUES (?, ?, ?, ?)`)
      .bind(projectId, user.id, `free_${projectId}`, now),
  ]);
  return json({ project: { id: projectId, name, clientName: clientName || user.name, clientEmail: clientEmail || user.email, status: "active", maxFileSize: DEFAULT_MAX_FILE_BYTES, createdAt: now, updatedAt: now }, storage: { usedBytes: await accountStorageUsage(db, user.id), quotaBytes: FREE_ACCOUNT_STORAGE_BYTES } }, 201);
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

async function getProjectComments(request: Request, params: URLSearchParams): Promise<Response> {
  const projectId = cleanText(params.get("projectId"), 80);
  if (!projectId) throw new ClientError("Choose a project.");
  await requireProject(request, projectId, "view");
  const { db } = getUploadBindings();
  const comments = await db.prepare(`SELECT id, project_id, file_id, asset_id, voice_note_id, author_name, author_email,
    body, timestamp_seconds, status, created_at, updated_at
    FROM project_review_comments
    WHERE project_id = ? AND deleted_at IS NULL
    ORDER BY created_at DESC LIMIT 300`).bind(projectId).all();
  return json({ comments: comments.results });
}

async function createProjectComment(request: Request, input: JsonInput): Promise<Response> {
  await ensureAccountSchema();
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  if (!projectId) throw new ClientError("Choose a project.");
  await requireProject(request, projectId, "view");
  const body = cleanText(input.body, 2000);
  const authorName = cleanText(input.authorName, 100);
  const authorEmail = input.authorEmail ? cleanEmail(input.authorEmail) : "";
  const fileId = cleanText(input.fileId, 80) || null;
  const assetId = cleanText(input.assetId, 80) || null;
  const voiceNoteId = cleanText(input.voiceNoteId, 80) || null;
  const timestamp = input.timestampSeconds === "" || input.timestampSeconds == null ? null : Number(input.timestampSeconds);
  if (!body && !voiceNoteId) throw new ClientError("Write a comment or record a voice note before sending.");
  if (authorName.length < 2) throw new ClientError("Enter your name before commenting.");
  if (input.authorEmail && !authorEmail) throw new ClientError("Enter a valid email address.");
  if (timestamp !== null && (!Number.isInteger(timestamp) || timestamp < 0 || timestamp > 24 * 60 * 60)) throw new ClientError("Choose a valid timestamp.");
  const { db } = getUploadBindings();
  const id = randomId("com");
  if (voiceNoteId) {
    const voice = await db.prepare("SELECT id FROM project_comment_voice_notes WHERE id = ? AND project_id = ? LIMIT 1").bind(voiceNoteId, projectId).first();
    if (!voice) throw new ClientError("Choose a voice note from this project.", 400);
  }
  // A timestamp must refer to a ready file in this authorized project, never
  // to a caller-supplied file/asset from another client's workspace.
  if (fileId) {
    const file = await db.prepare("SELECT id, asset_id FROM upload_files WHERE id = ? AND project_id = ? AND status = 'ready' LIMIT 1")
      .bind(fileId, projectId).first<{ id: string; asset_id: string | null }>();
    if (!file || (assetId && assetId !== (file.asset_id || file.id))) throw new ClientError("Choose a file from this project.", 400);
  } else if (assetId || timestamp !== null) {
    throw new ClientError("Choose a file before adding a timestamp or asset comment.", 400);
  }
  const now = Date.now();
  const commentBody = body || "Voice note";
  await db.prepare(`INSERT INTO project_review_comments
    (id, project_id, file_id, asset_id, voice_note_id, author_name, author_email, body, timestamp_seconds, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`)
    .bind(id, projectId, fileId, assetId, voiceNoteId, authorName, authorEmail || null, commentBody, timestamp, now, now).run();
  const owner = await db.prepare(`SELECT u.user_id, a.email
    FROM user_upload_projects u JOIN account_users a ON a.id = u.user_id
    WHERE u.project_id = ? LIMIT 1`).bind(projectId).first<{ user_id: string; email: string }>();
  await publishNotification({
    recipientUserId: owner?.user_id || null,
    recipientEmail: owner?.email || null,
    eventType: "comment",
    title: "New review comment",
    message: `${authorName} left feedback on a shared Content X project.`,
    projectId,
    actorName: authorName,
    actorEmail: authorEmail || null,
    actionUrl: new URL(`/site/index.html#workspace?project=${encodeURIComponent(projectId)}`, request.url).toString(),
  }).catch(() => undefined);
  return json({ comment: { id, projectId, fileId, assetId, voiceNoteId, authorName, authorEmail, body:commentBody, timestampSeconds: timestamp, status: "open", createdAt: now, updatedAt: now } }, 201);
}

async function createCommentVoiceNote(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80); await requireProject(request, projectId, "view");
  const dataUrl = cleanText(input.dataUrl, 1_800_000), duration = Number(input.durationSeconds);
  const match = /^data:(audio\/(?:webm|ogg|mp4|mpeg));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new ClientError("Use a supported voice-note format.", 400);
  if (!Number.isInteger(duration) || duration < 1 || duration > 60) throw new ClientError("Voice notes can be up to 60 seconds.", 400);
  const binary = atob(match[2]); if (binary.length > 1_250_000) throw new ClientError("Voice note is too large.", 413);
  const bytes = Uint8Array.from(binary, value => value.charCodeAt(0));
  const id = randomId("vcn"), key = objectKey(projectId, id, `voice-note.${match[1].split("/")[1]}`), now = Date.now();
  const { db, bucket } = getUploadBindings(); await enforceAccountStorageQuota(db, projectId, bytes.byteLength); await bucket.put(key, bytes, { httpMetadata:{ contentType:match[1] } });
  try { await db.prepare(`INSERT INTO project_comment_voice_notes (id, project_id, object_key, content_type, size_bytes, duration_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, projectId, key, match[1], bytes.byteLength, duration, now).run(); }
  catch (error) { await bucket.delete(key).catch(() => undefined); throw error; }
  return json({ voiceNoteId:id, durationSeconds:duration }, 201);
}

async function createCommentVoiceLink(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80), voiceNoteId = cleanText(input.voiceNoteId, 80); await requireProject(request, projectId, "view");
  const { db } = getUploadBindings(); const voice = await db.prepare("SELECT id FROM project_comment_voice_notes WHERE id = ? AND project_id = ? LIMIT 1").bind(voiceNoteId, projectId).first();
  if (!voice) throw new ClientError("Voice note not found.", 404);
  const expires = Date.now() + 5 * 60 * 1000, signature = await createDownloadSignature(voiceNoteId, expires), url = new URL(request.url);
  return json({ downloadUrl:`${url.origin}${url.pathname}?action=download&fileId=${encodeURIComponent(voiceNoteId)}&expires=${expires}&signature=${signature}&inline=1`, expires });
}

async function updateProjectCommentStatus(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  const commentId = cleanText(input.commentId, 80);
  const status = cleanText(input.status, 20);
  if (!projectId || !commentId || !["open", "completed", "resolved"].includes(status)) throw new ClientError("Choose a valid comment update.");
  await requireProjectManager(request, projectId);
  const { db } = getUploadBindings();
  const result = await db.prepare("UPDATE project_review_comments SET status = ?, updated_at = ? WHERE id = ? AND project_id = ? AND deleted_at IS NULL")
    .bind(status, Date.now(), commentId, projectId).run();
  if (!result.meta.changes) throw new ClientError("Comment not found.", 404);
  return json({ ok: true, status });
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
    shareUrl: `${origin}/s/${encodeURIComponent(token)}`,
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

async function accountStorageUsage(db: D1Database, userId: string): Promise<number> {
  const usage = await db.prepare(`SELECT
    COALESCE((SELECT SUM(f.size_bytes) FROM user_upload_projects u JOIN upload_files f ON f.project_id = u.project_id WHERE u.user_id = ? AND f.status IN ('uploading', 'ready')), 0)
    + COALESCE((SELECT SUM(v.size_bytes) FROM user_upload_projects u JOIN project_comment_voice_notes v ON v.project_id = u.project_id WHERE u.user_id = ?), 0) AS total_bytes`)
    .bind(userId, userId).first<{ total_bytes: number }>();
  return Number(usage?.total_bytes || 0);
}

async function enforceAccountStorageQuota(db: D1Database, projectId: string, incomingBytes: number): Promise<void> {
  const owner = await db.prepare("SELECT user_id FROM user_upload_projects WHERE project_id = ? LIMIT 1")
    .bind(projectId).first<{ user_id: string }>();
  if (!owner) return;
  const used = await accountStorageUsage(db, owner.user_id);
  if (used + incomingBytes > FREE_ACCOUNT_STORAGE_BYTES) {
    throw new ClientError(`This free account has reached its ${formatBytes(FREE_ACCOUNT_STORAGE_BYTES)} storage limit. Delete older files or wait for premium storage.`, 413);
  }
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
  const validatedFile = validateUploadFileMetadata(input.fileName, input.contentType);
  const originalName = validatedFile.fileName;
  const sizeBytes = validateFileSize(input.fileSize, project.max_file_size);
  const contentType = validatedFile.contentType;
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
  await enforceAccountStorageQuota(db, project.id, sizeBytes);
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
  validateUploadPartSignature(file, bytes, partNumber);
  const part = await bucket.resumeMultipartUpload(file.object_key, uploadId).uploadPart(partNumber, bytes);
  return json({ partNumber: part.partNumber, etag: part.etag });
}

async function completeUpload(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  const project = await requireProject(request, projectId, "upload");
  const fileId = cleanText(input.fileId, 80);
  const uploadId = cleanText(input.uploadId, 2048);
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
  await notifyCompletedUpload(request, project, file, completed.size).catch(error => console.warn("Content X upload notification failed", error));
  return json({ file: { id: file.id, name: file.original_name, contentType: file.content_type,
    sizeBytes: completed.size, status: "ready", completedAt: now,
    assetId: file.asset_id || file.id, versionNumber: file.version_number || 1 } });
}

async function notifyCompletedUpload(request: Request, project: UploadProject, file: UploadFile, sizeBytes: number): Promise<void> {
  const uploader = file.uploader_name || file.uploader_email || "A client";
  const fileSize = formatBytes(sizeBytes);
  const actionUrl = new URL(`/site/index.html#owner`, request.url).toString();
  await notifyOwner({
    eventType: "upload",
    title: "New file uploaded to Content X",
    message: `${uploader} uploaded ${file.original_name} (${fileSize}) to ${project.name}.`,
    projectId: project.id,
    actorName: file.uploader_name || null,
    actorEmail: file.uploader_email || null,
    actionUrl,
  });
  if (project.client_email) {
    await publishNotification({
      recipientEmail: project.client_email,
      eventType: "upload",
      title: "Your file was uploaded",
      message: `${file.original_name} (${fileSize}) is now saved in your Content X project workspace.`,
      projectId: project.id,
      actorName: "Content X",
      actionUrl: new URL(`/site/index.html#workspace?project=${encodeURIComponent(project.id)}`, request.url).toString(),
    });
  }
}

async function abortUpload(request: Request, input: JsonInput): Promise<Response> {
  requireSameOrigin(request);
  const projectId = cleanText(input.projectId, 80);
  const project = await requireProject(request, projectId, "upload");
  const fileId = cleanText(input.fileId, 80);
  const uploadId = cleanText(input.uploadId, 2048);
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
  if (!file && fileId.startsWith("vcn_")) {
    const voice = await db.prepare("SELECT * FROM project_comment_voice_notes WHERE id = ? LIMIT 1").bind(fileId).first<{ object_key:string; content_type:string; size_bytes:number }>();
    if (!voice) throw new ClientError("Voice note not found.", 404);
    const object = await bucket.get(voice.object_key); if (!object) throw new ClientError("Stored voice note not found.", 404);
    return new Response(object.body, { headers:{ "Content-Type":voice.content_type, "Content-Length":String(voice.size_bytes), "Content-Disposition":"inline", "Cache-Control":"private, no-store", "X-Content-Type-Options":"nosniff" } });
  }
  if (!file) throw new ClientError("File not found.", 404);
  const range = parseMediaRange(request.headers.get("Range"), Number(file.size_bytes));
  if (range === false) return new Response(null, { status:416, headers:{ "Content-Range":`bytes */${file.size_bytes}`, "Accept-Ranges":"bytes", "Cache-Control":"private, no-store" } });
  const object = await bucket.get(file.object_key, range ? { range } : undefined);
  if (!object) throw new ClientError("Stored file not found.", 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", file.content_type || "application/octet-stream");
  headers.set("Content-Length", String(range ? range.length : object.size));
  headers.set("Accept-Ranges", "bytes");
  if (range) headers.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${file.size_bytes}`);
  const safeInline = params.get("inline") === "1" && /^(application\/pdf|text\/|image\/|audio\/|video\/)/.test(file.content_type || "");
  headers.set("Content-Disposition", safeInline ? contentDisposition(file.original_name).replace(/^attachment/i, "inline") : contentDisposition(file.original_name));
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(object.body, { status:range ? 206 : 200, headers });
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
