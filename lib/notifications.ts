import { getAccountDatabase, type AccountUser } from "./auth";
import { contentXEmailShell, ownerNotificationEmail, sendTransactionalEmail } from "./email";

export type NotificationType = "upload" | "version" | "comment" | "reply" | "feedback" | "approval" | "payment" | "delivery" | "managedReview" | "security" | "test";

export type NotificationPreferences = {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  uploadEmail: boolean;
  uploadInApp: boolean;
  versionEmail: boolean;
  versionInApp: boolean;
  approvalEmail: boolean;
  approvalInApp: boolean;
  paymentEmail: boolean;
  paymentInApp: boolean;
  securityEmail: boolean;
  securityInApp: boolean;
  commentEmailMode: "instant" | "digest" | "off";
  commentInApp: boolean;
  digestThreshold: number;
};

type StoredPreference = {
  user_id: string;
  email_address: string | null;
  email_enabled: number;
  in_app_enabled: number;
  upload_email: number;
  upload_in_app: number;
  version_email: number;
  version_in_app: number;
  approval_email: number;
  approval_in_app: number;
  payment_email: number;
  payment_in_app: number;
  security_email: number;
  security_in_app: number;
  comment_email_mode: string;
  comment_in_app: number;
  digest_threshold: number;
};

type PublishInput = {
  recipientUserId?: string | null;
  recipientEmail?: string | null;
  eventType: NotificationType;
  title: string;
  message: string;
  projectId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actionUrl?: string | null;
};

let notificationSchemaPromise: Promise<void> | null = null;

export async function ensureNotificationSchema(): Promise<void> {
  const db = getAccountDatabase();
  if (!notificationSchemaPromise) {
    notificationSchemaPromise = db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS notification_preferences (
        user_id TEXT PRIMARY KEY NOT NULL,
        email_address TEXT,
        email_enabled INTEGER NOT NULL DEFAULT 1,
        in_app_enabled INTEGER NOT NULL DEFAULT 1,
        upload_email INTEGER NOT NULL DEFAULT 1,
        upload_in_app INTEGER NOT NULL DEFAULT 1,
        version_email INTEGER NOT NULL DEFAULT 1,
        version_in_app INTEGER NOT NULL DEFAULT 1,
        approval_email INTEGER NOT NULL DEFAULT 1,
        approval_in_app INTEGER NOT NULL DEFAULT 1,
        payment_email INTEGER NOT NULL DEFAULT 1,
        payment_in_app INTEGER NOT NULL DEFAULT 1,
        security_email INTEGER NOT NULL DEFAULT 1,
        security_in_app INTEGER NOT NULL DEFAULT 1,
        comment_email_mode TEXT NOT NULL DEFAULT 'digest',
        comment_in_app INTEGER NOT NULL DEFAULT 1,
        digest_threshold INTEGER NOT NULL DEFAULT 9,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES account_users(id) ON DELETE CASCADE
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS account_notifications (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        recipient_email TEXT,
        event_type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        project_id TEXT,
        actor_name TEXT,
        actor_email TEXT,
        action_url TEXT,
        read_at INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES account_users(id) ON DELETE CASCADE
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS email_notification_queue (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        recipient_email TEXT NOT NULL,
        event_type TEXT NOT NULL,
        subject TEXT NOT NULL,
        preview TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL,
        batch_key TEXT,
        provider_id TEXT,
        error TEXT,
        created_at INTEGER NOT NULL,
        sent_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES account_users(id) ON DELETE SET NULL
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_account_notifications_user_created ON account_notifications(user_id, created_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_email_notification_queue_batch_status ON email_notification_queue(batch_key, status, created_at)"),
      db.prepare("PRAGMA optimize"),
    ]).catch(error => {
      notificationSchemaPromise = null;
      throw error;
    });
  }
  await notificationSchemaPromise;
}

export async function getNotificationCenter(user: AccountUser): Promise<{ preferences: NotificationPreferences; notifications: unknown[]; queuedEmails: unknown[] }> {
  await ensureNotificationSchema();
  const db = getAccountDatabase();
  const preferences = await getOrCreatePreferences(user.id, user.email);
  const [notifications, queuedEmails] = await Promise.all([
    db.prepare(`SELECT id, event_type, title, message, project_id, actor_name, actor_email, action_url, read_at, created_at
      FROM account_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`).bind(user.id).all(),
    db.prepare(`SELECT id, event_type, subject, preview, status, error, created_at, sent_at
      FROM email_notification_queue WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`).bind(user.id).all(),
  ]);
  return { preferences, notifications: notifications.results, queuedEmails: queuedEmails.results };
}

export async function updateNotificationPreferences(user: AccountUser, input: Record<string, unknown>): Promise<NotificationPreferences> {
  await ensureNotificationSchema();
  const current = await getOrCreatePreferences(user.id, user.email);
  const next: NotificationPreferences = {
    ...current,
    emailEnabled: bool(input.emailEnabled, current.emailEnabled),
    inAppEnabled: bool(input.inAppEnabled, current.inAppEnabled),
    uploadEmail: bool(input.uploadEmail, current.uploadEmail),
    uploadInApp: bool(input.uploadInApp, current.uploadInApp),
    versionEmail: bool(input.versionEmail, current.versionEmail),
    versionInApp: bool(input.versionInApp, current.versionInApp),
    approvalEmail: bool(input.approvalEmail, current.approvalEmail),
    approvalInApp: bool(input.approvalInApp, current.approvalInApp),
    paymentEmail: bool(input.paymentEmail, current.paymentEmail),
    paymentInApp: bool(input.paymentInApp, current.paymentInApp),
    securityEmail: bool(input.securityEmail, current.securityEmail),
    securityInApp: bool(input.securityInApp, current.securityInApp),
    commentInApp: bool(input.commentInApp, current.commentInApp),
    commentEmailMode: ["instant", "digest", "off"].includes(String(input.commentEmailMode)) ? input.commentEmailMode as NotificationPreferences["commentEmailMode"] : current.commentEmailMode,
    digestThreshold: clampInteger(input.digestThreshold, 3, 25, current.digestThreshold),
  };
  await getAccountDatabase().prepare(`INSERT INTO notification_preferences
    (user_id, email_address, email_enabled, in_app_enabled, upload_email, upload_in_app, version_email, version_in_app,
      approval_email, approval_in_app, payment_email, payment_in_app, security_email, security_in_app, comment_email_mode,
      comment_in_app, digest_threshold, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET email_address = excluded.email_address, email_enabled = excluded.email_enabled,
      in_app_enabled = excluded.in_app_enabled, upload_email = excluded.upload_email, upload_in_app = excluded.upload_in_app,
      version_email = excluded.version_email, version_in_app = excluded.version_in_app, approval_email = excluded.approval_email,
      approval_in_app = excluded.approval_in_app, payment_email = excluded.payment_email, payment_in_app = excluded.payment_in_app,
      security_email = excluded.security_email, security_in_app = excluded.security_in_app, comment_email_mode = excluded.comment_email_mode,
      comment_in_app = excluded.comment_in_app, digest_threshold = excluded.digest_threshold, updated_at = excluded.updated_at`)
    .bind(user.id, user.email, asInt(next.emailEnabled), asInt(next.inAppEnabled), asInt(next.uploadEmail), asInt(next.uploadInApp),
      asInt(next.versionEmail), asInt(next.versionInApp), asInt(next.approvalEmail), asInt(next.approvalInApp),
      asInt(next.paymentEmail), asInt(next.paymentInApp), asInt(next.securityEmail), asInt(next.securityInApp),
      next.commentEmailMode, asInt(next.commentInApp), next.digestThreshold, Date.now(), Date.now()).run();
  return next;
}

export async function publishNotification(input: PublishInput): Promise<{ id: string; emailStatus: string }> {
  await ensureNotificationSchema();
  const db = getAccountDatabase();
  const recipientEmail = cleanEmail(input.recipientEmail);
  const recipientUserId = cleanText(input.recipientUserId, 120);
  const preferences = recipientUserId ? await getOrCreatePreferences(recipientUserId, recipientEmail) : defaultPreferences();
  const id = randomId("ntf");
  const createdAt = Date.now();
  const inAppAllowed = preferences.inAppEnabled && inAppAllowedFor(input.eventType, preferences);
  if (recipientUserId && inAppAllowed) {
    await db.prepare(`INSERT INTO account_notifications
      (id, user_id, recipient_email, event_type, title, message, project_id, actor_name, actor_email, action_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, recipientUserId, recipientEmail || null, input.eventType, cleanText(input.title, 180), cleanText(input.message, 1200),
        cleanText(input.projectId, 120) || null, cleanText(input.actorName, 120) || null, cleanEmail(input.actorEmail) || null,
        cleanText(input.actionUrl, 500) || null, createdAt).run();
  }
  const emailStatus = recipientEmail && preferences.emailEnabled ? await queueOrSendEmail(input, preferences, id, recipientUserId, recipientEmail, createdAt) : "disabled";
  return { id, emailStatus };
}

export async function notifyOwner(input: Omit<PublishInput, "recipientEmail" | "recipientUserId">): Promise<void> {
  const ownerEmail = ownerNotificationEmail();
  if (!ownerEmail) return;
  await publishNotification({ ...input, recipientEmail: ownerEmail });
}

export async function markNotificationRead(user: AccountUser, id: string): Promise<void> {
  await ensureNotificationSchema();
  await getAccountDatabase().prepare("UPDATE account_notifications SET read_at = ? WHERE id = ? AND user_id = ?")
    .bind(Date.now(), cleanText(id, 120), user.id).run();
}

async function queueOrSendEmail(input: PublishInput, preferences: NotificationPreferences, notificationId: string, userId: string, email: string, createdAt: number): Promise<string> {
  const type = input.eventType;
  if (type === "comment" && preferences.commentEmailMode === "off") return "disabled";
  if (type !== "comment" && !emailAllowedFor(type, preferences)) return "disabled";
  const subject = cleanText(input.title, 180);
  const preview = cleanText(input.message, 500);
  const payload = { ...input, notificationId };
  const batchKey = type === "comment" && preferences.commentEmailMode === "digest" ? `comments:${email}:${input.projectId || "general"}` : null;
  const queueId = randomId("eml");
  if (batchKey) {
    await getAccountDatabase().prepare(`INSERT INTO email_notification_queue
      (id, user_id, recipient_email, event_type, subject, preview, payload_json, status, batch_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'batched', ?, ?)`)
      .bind(queueId, userId || null, email, type, subject, preview, JSON.stringify(payload), batchKey, createdAt).run();
    return sendDigestIfReady(batchKey, email, preferences.digestThreshold, input.actionUrl || null);
  }
  const result = await sendTransactionalEmail({
    to: email,
    subject,
    html: contentXEmailShell(input.title, input.message, input.actionUrl ? { label: "Open Content X", url: input.actionUrl } : undefined),
    idempotencyKey: queueId,
  });
  await getAccountDatabase().prepare(`INSERT INTO email_notification_queue
    (id, user_id, recipient_email, event_type, subject, preview, payload_json, status, provider_id, error, created_at, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(queueId, userId || null, email, type, subject, preview, JSON.stringify(payload), result.status, result.providerId || null, result.error || null, createdAt, result.status === "sent" ? Date.now() : null).run();
  return result.status;
}

async function sendDigestIfReady(batchKey: string, email: string, threshold: number, actionUrl: string | null): Promise<string> {
  const db = getAccountDatabase();
  const pending = await db.prepare(`SELECT id, subject, preview FROM email_notification_queue
    WHERE batch_key = ? AND status = 'batched' ORDER BY created_at ASC LIMIT 50`).bind(batchKey).all<{ id: string; subject: string; preview: string }>();
  if (pending.results.length < threshold) return `batched ${pending.results.length}/${threshold}`;
  const countLabel = pending.results.length >= threshold ? `${threshold}+` : String(pending.results.length);
  const latest = pending.results.slice(-5).map(item => `• ${item.preview}`).join("\n");
  const result = await sendTransactionalEmail({
    to: email,
    subject: `You have ${countLabel} new Content X comments`,
    html: contentXEmailShell(`You have ${countLabel} new comments`, `Your review page has new feedback. Latest notes:\n${latest}`, actionUrl ? { label: "Open comments", url: actionUrl } : undefined),
    idempotencyKey: randomId("digest"),
  });
  const ids = pending.results.map(item => item.id);
  for (const id of ids) {
    await db.prepare("UPDATE email_notification_queue SET status = ?, provider_id = ?, error = ?, sent_at = ? WHERE id = ?")
      .bind(result.status === "sent" ? "sent_digest" : result.status, result.providerId || null, result.error || null, Date.now(), id).run();
  }
  return result.status === "sent" ? "sent_digest" : result.status;
}

async function getOrCreatePreferences(userId: string, email: string): Promise<NotificationPreferences> {
  const db = getAccountDatabase();
  const row = await db.prepare("SELECT * FROM notification_preferences WHERE user_id = ? LIMIT 1").bind(userId).first<StoredPreference>();
  if (row) return fromStored(row);
  const now = Date.now();
  const defaults = defaultPreferences();
  await db.prepare(`INSERT INTO notification_preferences
    (user_id, email_address, created_at, updated_at) VALUES (?, ?, ?, ?)`)
    .bind(userId, cleanEmail(email) || null, now, now).run();
  return defaults;
}

function defaultPreferences(): NotificationPreferences {
  return {
    emailEnabled: true,
    inAppEnabled: true,
    uploadEmail: true,
    uploadInApp: true,
    versionEmail: true,
    versionInApp: true,
    approvalEmail: true,
    approvalInApp: true,
    paymentEmail: true,
    paymentInApp: true,
    securityEmail: true,
    securityInApp: true,
    commentEmailMode: "digest",
    commentInApp: true,
    digestThreshold: 9,
  };
}

function fromStored(row: StoredPreference): NotificationPreferences {
  return {
    emailEnabled: Boolean(row.email_enabled),
    inAppEnabled: Boolean(row.in_app_enabled),
    uploadEmail: Boolean(row.upload_email),
    uploadInApp: Boolean(row.upload_in_app),
    versionEmail: Boolean(row.version_email),
    versionInApp: Boolean(row.version_in_app),
    approvalEmail: Boolean(row.approval_email),
    approvalInApp: Boolean(row.approval_in_app),
    paymentEmail: Boolean(row.payment_email),
    paymentInApp: Boolean(row.payment_in_app),
    securityEmail: Boolean(row.security_email),
    securityInApp: Boolean(row.security_in_app),
    commentEmailMode: ["instant", "digest", "off"].includes(row.comment_email_mode) ? row.comment_email_mode as NotificationPreferences["commentEmailMode"] : "digest",
    commentInApp: Boolean(row.comment_in_app),
    digestThreshold: Math.max(3, Math.min(25, Number(row.digest_threshold) || 9)),
  };
}

function inAppAllowedFor(type: NotificationType, preferences: NotificationPreferences): boolean {
  if (type === "comment" || type === "reply" || type === "feedback") return preferences.commentInApp;
  if (type === "upload") return preferences.uploadInApp;
  if (type === "version" || type === "delivery" || type === "managedReview") return preferences.versionInApp;
  if (type === "approval") return preferences.approvalInApp;
  if (type === "payment") return preferences.paymentInApp;
  if (type === "security") return preferences.securityInApp;
  return true;
}

function emailAllowedFor(type: NotificationType, preferences: NotificationPreferences): boolean {
  if (type === "upload") return preferences.uploadEmail;
  if (type === "version" || type === "delivery" || type === "managedReview") return preferences.versionEmail;
  if (type === "approval") return preferences.approvalEmail;
  if (type === "payment") return preferences.paymentEmail;
  if (type === "security") return preferences.securityEmail;
  return true;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asInt(value: boolean): number {
  return value ? 1 : 0;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const number = Number(value);
  if (!Number.isInteger(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function cleanText(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function cleanEmail(value: unknown): string {
  const email = cleanText(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function randomId(prefix: string): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `${prefix}_${Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("")}`;
}
