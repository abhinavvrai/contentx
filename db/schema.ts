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
