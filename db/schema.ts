import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
