import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  },
  table => [index("idx_upload_files_project_status").on(table.projectId, table.status)],
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
