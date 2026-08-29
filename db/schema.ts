import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const paymentOrders = sqliteTable("payment_orders", {
  razorpayOrderId: text("razorpay_order_id").primaryKey(),
  receipt: text("receipt").notNull().unique(),
  planId: text("plan_id").notNull(),
  planName: text("plan_name").notNull(),
  billing: text("billing").notNull(),
  quantity: integer("quantity").notNull(),
  amountPaise: integer("amount_paise").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  paymentId: text("payment_id"),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  refundStatus: text("refund_status").notNull().default("none"),
  refundReason: text("refund_reason"),
  refundAmountPaise: integer("refund_amount_paise"),
  refundRequestedAt: integer("refund_requested_at", { mode: "timestamp_ms" }),
  refundUpdatedAt: integer("refund_updated_at", { mode: "timestamp_ms" }),
  refundNote: text("refund_note"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const uploadProjects = sqliteTable(
  "upload_projects",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    clientName: text("client_name"),
    clientEmail: text("client_email"),
    uploadTokenHash: text("upload_token_hash").notNull().unique(),
    status: text("status").notNull().default("active"),
    maxFileSize: integer("max_file_size").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  table => [index("idx_upload_projects_status_updated").on(table.status, table.updatedAt)],
);

export const uploadFiles = sqliteTable(
  "upload_files",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => uploadProjects.id),
    objectKey: text("object_key").notNull().unique(),
    originalName: text("original_name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    status: text("status").notNull().default("uploading"),
    multipartUploadId: text("multipart_upload_id"),
    uploaderName: text("uploader_name"),
    uploaderEmail: text("uploader_email"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
    assetId: text("asset_id"),
    versionNumber: integer("version_number").notNull().default(1),
    parentFileId: text("parent_file_id"),
  },
  table => [
    index("idx_upload_files_project_status").on(table.projectId, table.status),
    index("idx_upload_files_asset_version").on(table.assetId, table.versionNumber),
  ],
);

export const projectShareLinks = sqliteTable(
  "project_share_links",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => uploadProjects.id),
    tokenHash: text("token_hash").notNull().unique(),
    createdByUserId: text("created_by_user_id"),
    name: text("name").notNull(),
    allowUploads: integer("allow_uploads", { mode: "boolean" }).notNull().default(false),
    status: text("status").notNull().default("active"),
    expiresAt: integer("expires_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    lastUsedAt: integer("last_used_at"),
  },
  table => [index("idx_project_share_links_project_status").on(table.projectId, table.status, table.updatedAt)],
);

export const accountUsers = sqliteTable("account_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  passwordIterations: integer("password_iterations").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const accountSessions = sqliteTable(
  "account_sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id").notNull().references(() => accountUsers.id),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
    lastSeenAt: integer("last_seen_at").notNull(),
    userAgent: text("user_agent"),
  },
  table => [index("idx_account_sessions_user_expires").on(table.userId, table.expiresAt)],
);

export const authLoginAttempts = sqliteTable("auth_login_attempts", {
  attemptKey: text("attempt_key").primaryKey(),
  attempts: integer("attempts").notNull(),
  windowStartedAt: integer("window_started_at").notNull(),
  blockedUntil: integer("blocked_until").notNull().default(0),
});

export const authIdentities = sqliteTable(
  "auth_identities",
  {
    provider: text("provider").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    userId: text("user_id").notNull().references(() => accountUsers.id),
    email: text("email").notNull(),
    verifiedAt: integer("verified_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  table => [
    primaryKey({ columns: [table.provider, table.providerUserId] }),
    index("idx_auth_identities_user").on(table.userId),
    index("idx_auth_identities_email").on(table.email),
  ],
);

export const accountPasswordResets = sqliteTable(
  "account_password_resets",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id").notNull().references(() => accountUsers.id),
    email: text("email").notNull(),
    expiresAt: integer("expires_at").notNull(),
    usedAt: integer("used_at"),
    createdAt: integer("created_at").notNull(),
    requestIpHash: text("request_ip_hash"),
    userAgent: text("user_agent"),
  },
  table => [index("idx_account_password_resets_user_email").on(table.userId, table.email, table.expiresAt)],
);

export const notificationPreferences = sqliteTable("notification_preferences", {
  userId: text("user_id").primaryKey().references(() => accountUsers.id),
  emailAddress: text("email_address"),
  emailEnabled: integer("email_enabled", { mode: "boolean" }).notNull().default(true),
  inAppEnabled: integer("in_app_enabled", { mode: "boolean" }).notNull().default(true),
  uploadEmail: integer("upload_email", { mode: "boolean" }).notNull().default(true),
  uploadInApp: integer("upload_in_app", { mode: "boolean" }).notNull().default(true),
  versionEmail: integer("version_email", { mode: "boolean" }).notNull().default(true),
  versionInApp: integer("version_in_app", { mode: "boolean" }).notNull().default(true),
  approvalEmail: integer("approval_email", { mode: "boolean" }).notNull().default(true),
  approvalInApp: integer("approval_in_app", { mode: "boolean" }).notNull().default(true),
  paymentEmail: integer("payment_email", { mode: "boolean" }).notNull().default(true),
  paymentInApp: integer("payment_in_app", { mode: "boolean" }).notNull().default(true),
  securityEmail: integer("security_email", { mode: "boolean" }).notNull().default(true),
  securityInApp: integer("security_in_app", { mode: "boolean" }).notNull().default(true),
  commentEmailMode: text("comment_email_mode").notNull().default("digest"),
  commentInApp: integer("comment_in_app", { mode: "boolean" }).notNull().default(true),
  digestThreshold: integer("digest_threshold").notNull().default(9),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const accountNotifications = sqliteTable(
  "account_notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => accountUsers.id),
    recipientEmail: text("recipient_email"),
    eventType: text("event_type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    projectId: text("project_id"),
    actorName: text("actor_name"),
    actorEmail: text("actor_email"),
    actionUrl: text("action_url"),
    readAt: integer("read_at"),
    createdAt: integer("created_at").notNull(),
  },
  table => [index("idx_account_notifications_user_created").on(table.userId, table.createdAt)],
);

export const emailNotificationQueue = sqliteTable(
  "email_notification_queue",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => accountUsers.id),
    recipientEmail: text("recipient_email").notNull(),
    eventType: text("event_type").notNull(),
    subject: text("subject").notNull(),
    preview: text("preview").notNull(),
    payloadJson: text("payload_json").notNull(),
    status: text("status").notNull(),
    batchKey: text("batch_key"),
    providerId: text("provider_id"),
    error: text("error"),
    createdAt: integer("created_at").notNull(),
    sentAt: integer("sent_at"),
  },
  table => [index("idx_email_notification_queue_batch_status").on(table.batchKey, table.status, table.createdAt)],
);

export const orderSelections = sqliteTable(
  "order_selections",
  {
    razorpayOrderId: text("razorpay_order_id").primaryKey(),
    userId: text("user_id").notNull().references(() => accountUsers.id),
    contentType: text("content_type").notNull(),
    deliveryFormat: text("delivery_format"),
    addOnsJson: text("add_ons_json").notNull().default("[]"),
    createdAt: integer("created_at").notNull(),
  },
  table => [index("idx_order_selections_user_created").on(table.userId, table.createdAt)],
);

export const projectBriefs = sqliteTable(
  "project_briefs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => accountUsers.id),
    razorpayOrderId: text("razorpay_order_id").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    instructions: text("instructions").notNull(),
    referenceUrl: text("reference_url"),
    status: text("status").notNull().default("submitted"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  table => [index("idx_project_briefs_user_updated").on(table.userId, table.updatedAt)],
);

export const userUploadProjects = sqliteTable("user_upload_projects", {
  projectId: text("project_id").primaryKey(),
  userId: text("user_id").notNull().references(() => accountUsers.id),
  razorpayOrderId: text("razorpay_order_id").notNull().unique(),
  createdAt: integer("created_at").notNull(),
});

export const projectReviewComments = sqliteTable(
  "project_review_comments",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => uploadProjects.id),
    fileId: text("file_id"),
    assetId: text("asset_id"),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email"),
    body: text("body").notNull(),
    timestampSeconds: integer("timestamp_seconds"),
    status: text("status").notNull().default("open"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
  },
  table => [index("idx_project_review_comments_project_created").on(table.projectId, table.createdAt)],
);
