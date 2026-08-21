import { env } from "cloudflare:workers";
import { getSessionUser } from "./auth";

export const DEFAULT_MAX_FILE_BYTES = 50 * 1024 * 1024 * 1024;
export const DEFAULT_MAX_PROJECT_BYTES = 250 * 1024 * 1024 * 1024;
export const UPLOAD_PART_BYTES = 8 * 1024 * 1024;
export const MAX_UPLOAD_PARTS = 10_000;

type UploadBindings = {
  DB?: D1Database;
  UPLOADS?: R2Bucket;
  CONTENTX_OWNER_TOKEN?: string;
};

export type UploadProject = {
  id: string;
  name: string;
  client_name: string | null;
  client_email: string | null;
  status: string;
  max_file_size: number;
  created_at: number;
  updated_at: number;
};

export type UploadFile = {
  id: string;
  project_id: string;
  object_key: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  status: string;
  multipart_upload_id: string | null;
  uploader_name: string | null;
  uploader_email: string | null;
  created_at: number;
  completed_at: number | null;
  deleted_at: number | null;
  asset_id: string | null;
  version_number: number;
  parent_file_id: string | null;
};

export type ProjectAccess = {
  project: UploadProject;
  canUpload: boolean;
  accessType: "account" | "legacy-link" | "share-link";
};

let schemaPromise: Promise<void> | null = null;

export function getUploadBindings(): { db: D1Database; bucket: R2Bucket } {
  const bindings = env as unknown as UploadBindings;
  if (!bindings.DB) throw new Error("File database is not available.");
  if (!bindings.UPLOADS) throw new Error("File storage is not available.");
  return { db: bindings.DB, bucket: bindings.UPLOADS };
}

export async function ensureUploadSchema(): Promise<void> {
  const { db } = getUploadBindings();
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS upload_projects (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        client_name TEXT,
        client_email TEXT,
        upload_token_hash TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'active',
        max_file_size INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS upload_files (
        id TEXT PRIMARY KEY NOT NULL,
        project_id TEXT NOT NULL,
        object_key TEXT NOT NULL UNIQUE,
        original_name TEXT NOT NULL,
        content_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'uploading',
        multipart_upload_id TEXT,
        uploader_name TEXT,
        uploader_email TEXT,
        created_at INTEGER NOT NULL,
        completed_at INTEGER,
        deleted_at INTEGER,
        FOREIGN KEY (project_id) REFERENCES upload_projects(id)
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_upload_files_project_status ON upload_files(project_id, status)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_upload_projects_status_updated ON upload_projects(status, updated_at)"),
      db.prepare(`CREATE TABLE IF NOT EXISTS project_share_links (
        id TEXT PRIMARY KEY NOT NULL,
        project_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        created_by_user_id TEXT,
        name TEXT NOT NULL,
        allow_uploads INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        expires_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_used_at INTEGER,
        FOREIGN KEY (project_id) REFERENCES upload_projects(id)
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_project_share_links_project_status ON project_share_links(project_id, status, updated_at)"),
      ]);
      const columns = await db.prepare("PRAGMA table_info(upload_files)").all<{ name: string }>();
      const names = new Set(columns.results.map(column => column.name));
      if (!names.has("asset_id")) await db.prepare("ALTER TABLE upload_files ADD COLUMN asset_id TEXT").run();
      if (!names.has("version_number")) await db.prepare("ALTER TABLE upload_files ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1").run();
      if (!names.has("parent_file_id")) await db.prepare("ALTER TABLE upload_files ADD COLUMN parent_file_id TEXT").run();
      await db.batch([
        db.prepare("UPDATE upload_files SET asset_id = id WHERE asset_id IS NULL"),
        db.prepare("CREATE INDEX IF NOT EXISTS idx_upload_files_asset_version ON upload_files(asset_id, version_number)"),
        db.prepare("PRAGMA optimize"),
      ]);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

export async function readJson<T>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) throw new ClientError("Expected a JSON request.", 415);
  try {
    return await request.json() as T;
  } catch {
    throw new ClientError("The request body is not valid JSON.", 400);
  }
}

export class ClientError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function requireOwner(request: Request): Promise<void> {
  const supplied = request.headers.get("x-contentx-owner-token")?.trim() || "";
  const expected = ownerSecret();
  if (!expected) throw new ClientError("Owner file access is not configured yet.", 503);
  if (!supplied || !(await safeTokenEqual(supplied, expected))) {
    throw new ClientError("Owner file access was not accepted.", 401);
  }
}

export async function authorizeProject(request: Request, projectId: string, purpose: "view" | "upload" = "view"): Promise<ProjectAccess> {
  const token = bearerToken(request);
  const { db } = getUploadBindings();
  let project: UploadProject | null = null;
  let canUpload = false;
  let accessType: ProjectAccess["accessType"] = "account";
  if (token) {
    const tokenHash = await hashToken(token);
    project = await db.prepare(
      `SELECT id, name, client_name, client_email, status, max_file_size, created_at, updated_at
       FROM upload_projects WHERE id = ? AND upload_token_hash = ? LIMIT 1`
    ).bind(projectId, tokenHash).first<UploadProject>();
    if (project) {
      canUpload = true;
      accessType = "legacy-link";
    } else {
      const share = await db.prepare(`SELECT p.id, p.name, p.client_name, p.client_email, p.status,
        p.max_file_size, p.created_at, p.updated_at, s.allow_uploads, s.id AS share_id
        FROM project_share_links s JOIN upload_projects p ON p.id = s.project_id
        WHERE s.project_id = ? AND s.token_hash = ? AND s.status = 'active'
          AND (s.expires_at IS NULL OR s.expires_at > ?) LIMIT 1`)
        .bind(projectId, tokenHash, Date.now()).first<UploadProject & { allow_uploads: number; share_id: string }>();
      if (share) {
        project = share;
        canUpload = Boolean(share.allow_uploads);
        accessType = "share-link";
        await db.prepare("UPDATE project_share_links SET last_used_at = ? WHERE id = ?").bind(Date.now(), share.share_id).run();
      }
    }
  } else {
    const user = await getSessionUser(request);
    if (!user) throw new ClientError("Sign in or use the complete private upload link.", 401);
    project = await db.prepare(
      `SELECT p.id, p.name, p.client_name, p.client_email, p.status, p.max_file_size, p.created_at, p.updated_at
       FROM upload_projects p JOIN user_upload_projects u ON u.project_id = p.id
       WHERE p.id = ? AND u.user_id = ? LIMIT 1`
    ).bind(projectId, user.id).first<UploadProject>();
    canUpload = Boolean(project);
  }
  if (!project || project.status !== "active") throw new ClientError("This upload link is invalid or no longer active.", 403);
  if (purpose === "upload" && !canUpload) throw new ClientError("This share link is view-only. Ask the project owner to enable uploads.", 403);
  return { project, canUpload, accessType };
}

export async function requireProject(request: Request, projectId: string, purpose: "view" | "upload" = "view"): Promise<UploadProject> {
  return (await authorizeProject(request, projectId, purpose)).project;
}

export async function hashToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function createDownloadSignature(fileId: string, expires: number): Promise<string> {
  const secret = ownerSecret();
  if (!secret) throw new ClientError("Owner file access is not configured yet.", 503);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${fileId}.${expires}`));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyDownloadSignature(fileId: string, expires: number, signature: string): Promise<boolean> {
  if (!fileId || !signature || !Number.isSafeInteger(expires) || expires < Date.now() || expires > Date.now() + 10 * 60 * 1000) return false;
  const expected = await createDownloadSignature(fileId, expires);
  return safeTokenEqual(signature, expected);
}

export function randomId(prefix: string): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `${prefix}_${base64url(bytes)}`;
}

export function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

export function objectKey(projectId: string, fileId: string, fileName: string): string {
  const safeName = fileName
    .normalize("NFKC")
    .replace(/[\\/\u0000-\u001f\u007f]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "upload.bin";
  return `projects/${projectId}/${fileId}/${safeName}`;
}

export function contentDisposition(fileName: string): string {
  const fallback = fileName.replace(/[^\x20-\x7e]+/g, "_").replace(/["\\]/g, "_").slice(0, 160) || "download";
  const encoded = encodeURIComponent(fileName).replace(/'/g, "%27");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function cleanEmail(value: unknown): string {
  const email = cleanText(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function validateFileSize(value: unknown, maximum = DEFAULT_MAX_FILE_BYTES): number {
  const size = Number(value);
  if (!Number.isSafeInteger(size) || size < 1) throw new ClientError("Choose a non-empty file.");
  if (size > maximum) throw new ClientError(`This project accepts files up to ${formatBytes(maximum)}.`, 413);
  if (Math.ceil(size / UPLOAD_PART_BYTES) > MAX_UPLOAD_PARTS) throw new ClientError("This file is too large for the upload service.", 413);
  return size;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${Math.round(bytes / 1024 ** 3)} GB`;
  return `${Math.round(bytes / 1024 ** 2)} MB`;
}

function bearerToken(request: Request): string {
  const header = request.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function ownerSecret(): string {
  const bindings = env as unknown as UploadBindings;
  return bindings.CONTENTX_OWNER_TOKEN?.trim() || process.env.CONTENTX_OWNER_TOKEN?.trim() || "";
}

async function safeTokenEqual(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([hashToken(left), hashToken(right)]);
  let difference = leftHash.length ^ rightHash.length;
  for (let index = 0; index < Math.max(leftHash.length, rightHash.length); index += 1) {
    difference |= (leftHash.charCodeAt(index) || 0) ^ (rightHash.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
