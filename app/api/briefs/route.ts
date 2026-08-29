import {
  AccountError,
  ensureAccountSchema,
  getAccountDatabase,
  requireSameOrigin,
  requireSessionUser,
} from "../../../lib/auth";
import {
  DEFAULT_MAX_FILE_BYTES,
  ensureUploadSchema,
  hashToken,
  randomId,
  randomToken,
} from "../../../lib/uploads";
import { ensurePaymentSchema } from "../../../lib/razorpay";

type BriefInput = {
  razorpayOrderId?: string;
  title?: string;
  description?: string;
  instructions?: string;
  referenceUrl?: string;
};

export async function GET(request: Request) {
  return handle(async () => {
    await Promise.all([ensureAccountSchema(), ensurePaymentSchema()]);
    const user = await requireSessionUser(request);
    const db = getAccountDatabase();
    const orders = await db.prepare(`SELECT p.razorpay_order_id, p.plan_id, p.plan_name, p.billing,
      p.quantity, p.amount_paise, p.currency, p.status, p.refund_status, p.refund_reason,
      p.refund_amount_paise, p.refund_requested_at, p.refund_updated_at, p.created_at, s.content_type, s.delivery_format,
      s.add_ons_json, b.id AS brief_id, b.title, b.description, b.instructions,
      b.reference_url, b.status AS brief_status, COALESCE(u.project_id, s.project_id) AS project_id
      FROM order_selections s
      JOIN payment_orders p ON p.razorpay_order_id = s.razorpay_order_id
      LEFT JOIN project_briefs b ON b.razorpay_order_id = p.razorpay_order_id
      LEFT JOIN user_upload_projects u ON u.razorpay_order_id = p.razorpay_order_id
      WHERE s.user_id = ? ORDER BY p.created_at DESC LIMIT 100`)
      .bind(user.id).all<Record<string, unknown>>();
    return json({
      user,
      orders: orders.results.map((order: Record<string, unknown>) => ({
        ...order,
        add_ons: parseAddOns(order.add_ons_json),
        add_ons_json: undefined,
      })),
    });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request);
    await Promise.all([ensureAccountSchema(), ensurePaymentSchema(), ensureUploadSchema()]);
    const user = await requireSessionUser(request);
    const input = await request.json() as BriefInput;
    const orderId = cleanText(input.razorpayOrderId, 120);
    const title = cleanText(input.title, 140);
    const description = cleanText(input.description, 2500);
    const instructions = cleanText(input.instructions, 5000);
    const referenceUrl = cleanSourceLinks(input.referenceUrl);
    if (!orderId) throw new AccountError("Choose the paid order for this brief.");
    if (!title) throw new AccountError("Add a title for the video or episode.");
    if (!description) throw new AccountError("Add a short project description.");
    if (!instructions) throw new AccountError("Tell us what you want the final edit to achieve.");
    if (input.referenceUrl && !referenceUrl) throw new AccountError("Paste at least one valid source link beginning with https://.");

    const db = getAccountDatabase();
    const order = await db.prepare(`SELECT p.razorpay_order_id, p.plan_id, p.status, p.refund_status
      FROM payment_orders p JOIN order_selections s ON s.razorpay_order_id = p.razorpay_order_id
      WHERE p.razorpay_order_id = ? AND s.user_id = ? LIMIT 1`)
      .bind(orderId, user.id).first<{ razorpay_order_id: string; plan_id: string; status: string; refund_status?: string | null }>();
    if (!order) throw new AccountError("This order does not belong to your account.", 403);
    if (["revision_short", "revision_long"].includes(order.plan_id)) throw new AccountError("Revision round payments stay attached to their existing video and do not create a new brief.", 409);
    if (!["verified", "captured"].includes(order.status)) throw new AccountError("Complete the payment before submitting the full project brief.", 409);
    if (order.refund_status === "refunded") throw new AccountError("This payment has been refunded. Choose another paid order to start a project.", 409);
    if (order.refund_status === "requested" || order.refund_status === "processing") throw new AccountError("A refund is already active for this payment, so the project brief is paused.", 409);

    const now = Date.now();
    const existing = await db.prepare("SELECT id FROM project_briefs WHERE razorpay_order_id = ? AND user_id = ? LIMIT 1")
      .bind(orderId, user.id).first<{ id: string }>();
    const briefId = existing?.id || randomId("brf");
    await db.prepare(`INSERT INTO project_briefs
      (id, user_id, razorpay_order_id, title, description, instructions, reference_url, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)
      ON CONFLICT(razorpay_order_id) DO UPDATE SET title = excluded.title,
        description = excluded.description, instructions = excluded.instructions,
        reference_url = excluded.reference_url, status = 'submitted', updated_at = excluded.updated_at`)
      .bind(briefId, user.id, orderId, title, description, instructions, referenceUrl || null, now, now).run();

    let upload = await db.prepare("SELECT project_id FROM user_upload_projects WHERE razorpay_order_id = ? AND user_id = ? LIMIT 1")
      .bind(orderId, user.id).first<{ project_id: string }>();
    if (!upload) {
      const projectId = randomId("prj");
      const tokenHash = await hashToken(randomToken());
      await db.batch([
        db.prepare(`INSERT INTO upload_projects
          (id, name, client_name, client_email, upload_token_hash, status, max_file_size, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`)
          .bind(projectId, title, user.name, user.email, tokenHash, DEFAULT_MAX_FILE_BYTES, now, now),
        db.prepare(`INSERT INTO user_upload_projects (project_id, user_id, razorpay_order_id, created_at)
          VALUES (?, ?, ?, ?)`)
          .bind(projectId, user.id, orderId, now),
      ]);
      upload = { project_id: projectId };
    } else {
      await db.prepare("UPDATE upload_projects SET name = ?, client_name = ?, client_email = ?, updated_at = ? WHERE id = ?")
        .bind(title, user.name, user.email, now, upload.project_id).run();
    }

    const origin = new URL(request.url).origin;
    return json({
      brief: { id: briefId, razorpayOrderId: orderId, title, description, instructions, referenceUrl, status: "submitted" },
      projectId: upload.project_id,
      uploadUrl: `${origin}/site/index.html#upload?project=${encodeURIComponent(upload.project_id)}`,
    }, existing ? 200 : 201);
  });
}

function cleanText(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function cleanSourceLinks(value: unknown): string {
  const text = cleanText(value, 5000);
  if (!text) return "";
  const lines = text.split(/\r?\n|,/).map(line => line.trim()).filter(Boolean).slice(0, 30);
  const cleaned: string[] = [];
  for (const line of lines) {
    const urls = [...line.matchAll(/https:\/\/[^\s<>"']+/gi)].map(match => match[0]);
    if (!urls.length) throw new AccountError("Each source line needs a valid https:// link. Put non-link notes in the instructions box.");
    let safeLine = cleanText(line.replace(/[\u0000-\u001f\u007f]/g, " "), 500);
    for (const rawUrl of urls) {
      let normalized = "";
      try {
        const url = new URL(rawUrl);
        normalized = url.protocol === "https:" ? url.toString() : "";
      } catch {
        normalized = "";
      }
      if (!normalized) throw new AccountError("Source links must begin with https://.");
      safeLine = safeLine.replace(rawUrl, normalized);
    }
    cleaned.push(safeLine);
  }
  return cleaned.join("\n");
}

function parseAddOns(value: unknown): unknown[] {
  try {
    const parsed = JSON.parse(typeof value === "string" ? value : "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function handle(operation: () => Promise<Response>): Promise<Response> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AccountError) return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return json({ error: "The project brief was not valid." }, 400);
    console.error("Content X brief error", error);
    return json({ error: "The project brief service is temporarily unavailable." }, 503);
  }
}
