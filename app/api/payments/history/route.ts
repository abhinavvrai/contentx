import {
  AccountError,
  ensureAccountSchema,
  getAccountDatabase,
  requireSameOrigin,
  requireSessionUser,
} from "../../../../lib/auth";
import { ClientError, requireOwner } from "../../../../lib/uploads";
import { ensurePaymentSchema, json } from "../../../../lib/razorpay";

type PaymentRow = Record<string, unknown> & {
  add_ons_json?: string | null;
};

const refundablePaymentStatuses = new Set(["verified", "captured"]);
const completedProjectStatuses = new Set(["completed", "delivered", "closed", "approved"]);
const refundStatuses = new Set(["none", "requested", "processing", "refunded", "cancelled"]);

export async function GET(request: Request) {
  return handle(async () => {
    const ownerToken = request.headers.get("x-contentx-owner-token")?.trim();
    if (ownerToken) {
      await requireOwner(request);
      await Promise.all([ensureAccountSchema(), ensurePaymentSchema()]);
      const db = getAccountDatabase();
      const payments = await db.prepare(`${paymentSelectSql()}
        ORDER BY p.created_at DESC LIMIT 200`).all<PaymentRow>();
      return json({ scope: "owner", payments: payments.results.map(publicPayment) });
    }

    await Promise.all([ensureAccountSchema(), ensurePaymentSchema()]);
    const user = await requireSessionUser(request);
    const db = getAccountDatabase();
    const payments = await db.prepare(`${paymentSelectSql()}
      WHERE s.user_id = ? ORDER BY p.created_at DESC LIMIT 100`)
      .bind(user.id).all<PaymentRow>();
    return json({ scope: "client", payments: payments.results.map(publicPayment) });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request);
    await requireOwner(request);
    await Promise.all([ensureAccountSchema(), ensurePaymentSchema()]);

    const input = await request.json() as {
      action?: string;
      razorpayOrderId?: string;
      refundAmountPaise?: number;
      reason?: string;
      note?: string;
    };
    const action = cleanText(input.action, 40);
    const orderId = cleanText(input.razorpayOrderId, 140);
    const reason = cleanText(input.reason, 400);
    const note = cleanText(input.note, 800);
    if (!orderId) throw new AccountError("Choose the payment record to update.");
    if (!["request_refund", "mark_processing", "mark_refunded", "cancel_refund"].includes(action)) {
      throw new AccountError("Choose a valid refund action.");
    }

    const db = getAccountDatabase();
    const existing = await db.prepare(`${paymentSelectSql()}
      WHERE p.razorpay_order_id = ? LIMIT 1`).bind(orderId).first<PaymentRow>();
    if (!existing) throw new AccountError("Payment record was not found.", 404);
    if (!refundablePaymentStatuses.has(String(existing.status))) {
      throw new AccountError("Only verified or captured payments can be considered for refund.", 409);
    }

    const projectStatus = String(existing.brief_status || "").toLowerCase();
    if (action === "request_refund" && completedProjectStatuses.has(projectStatus)) {
      throw new AccountError("This project is already marked complete, so it is not eligible for this refund queue.", 409);
    }

    const now = Date.now();
    const orderAmount = Number(existing.amount_paise || 0);
    const requestedAmount = Number(input.refundAmountPaise || orderAmount);
    const refundAmount = Number.isSafeInteger(requestedAmount) && requestedAmount > 0
      ? Math.min(requestedAmount, orderAmount)
      : orderAmount;
    const nextStatus = action === "request_refund"
      ? "requested"
      : action === "mark_processing"
        ? "processing"
        : action === "mark_refunded"
          ? "refunded"
          : "cancelled";

    await db.prepare(`UPDATE payment_orders SET refund_status = ?, refund_reason = ?,
      refund_amount_paise = ?, refund_requested_at = COALESCE(refund_requested_at, ?),
      refund_updated_at = ?, refund_note = ?, updated_at = ? WHERE razorpay_order_id = ?`)
      .bind(
        nextStatus,
        reason || null,
        nextStatus === "cancelled" ? null : refundAmount,
        now,
        now,
        note || (nextStatus === "refunded" ? "Marked refunded by owner. Confirm payout in Razorpay dashboard." : null),
        now,
        orderId,
      ).run();

    const updated = await db.prepare(`${paymentSelectSql()}
      WHERE p.razorpay_order_id = ? LIMIT 1`).bind(orderId).first<PaymentRow>();
    return json({ payment: publicPayment(updated || existing) });
  });
}

function paymentSelectSql() {
  return `SELECT p.razorpay_order_id, p.receipt, p.plan_id, p.plan_name, p.billing,
    p.quantity, p.amount_paise, p.currency, p.status, p.payment_id,
    p.customer_name, p.customer_email, p.customer_phone, p.created_at, p.updated_at,
    p.refund_status, p.refund_reason, p.refund_amount_paise, p.refund_requested_at,
    p.refund_updated_at, p.refund_note, s.content_type, s.delivery_format, s.add_ons_json,
    b.id AS brief_id, b.title AS brief_title, b.status AS brief_status, u.project_id
    FROM payment_orders p
    LEFT JOIN order_selections s ON s.razorpay_order_id = p.razorpay_order_id
    LEFT JOIN project_briefs b ON b.razorpay_order_id = p.razorpay_order_id
    LEFT JOIN user_upload_projects u ON u.razorpay_order_id = p.razorpay_order_id`;
}

function publicPayment(row: PaymentRow) {
  const status = String(row.refund_status || "none");
  return {
    ...row,
    customer_phone: undefined,
    refund_status: refundStatuses.has(status) ? status : "none",
    add_ons: parseAddOns(row.add_ons_json),
    add_ons_json: undefined,
  };
}

function cleanText(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function parseAddOns(value: unknown): unknown[] {
  try {
    const parsed = JSON.parse(typeof value === "string" ? value : "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function handle(handler: () => Promise<Response>) {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof AccountError || error instanceof ClientError) return json({ error: error.message }, error.status);
    return json({ error: "Payment history is unavailable right now." }, 503);
  }
}
