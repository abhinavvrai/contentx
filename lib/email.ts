import { env } from "cloudflare:workers";

type EmailBindings = {
  RESEND_API_KEY?: string;
  CONTENTX_EMAIL_FROM?: string;
  CONTENTX_OWNER_EMAIL?: string;
};

export type EmailResult = {
  status: "sent" | "skipped" | "failed";
  providerId?: string;
  error?: string;
};

type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  idempotencyKey?: string;
};

export function ownerNotificationEmail(): string {
  return bindingValue("CONTENTX_OWNER_EMAIL");
}

export async function sendTransactionalEmail(message: EmailMessage): Promise<EmailResult> {
  const apiKey = bindingValue("RESEND_API_KEY");
  const from = bindingValue("CONTENTX_EMAIL_FROM") || "Content X <notifications@contentx.co.in>";
  const recipients = Array.isArray(message.to) ? message.to : [message.to];
  const safeRecipients = recipients.map(cleanEmail).filter(Boolean).slice(0, 50);
  if (!apiKey || !safeRecipients.length) return { status: "skipped", error: !apiKey ? "RESEND_API_KEY is not configured." : "No valid email recipient." };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "ContentXWebsite/1.0",
      ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to: safeRecipients,
      subject: cleanText(message.subject, 180),
      html: message.html,
      text: message.text || htmlToText(message.html),
    }),
  });
  const payload = await response.json().catch(() => ({})) as { id?: string; message?: string; error?: string };
  if (!response.ok) return { status: "failed", error: payload.message || payload.error || "Email provider rejected the message." };
  return { status: "sent", providerId: payload.id };
}

export function contentXEmailShell(title: string, body: string, action?: { label: string; url: string }): string {
  const safeTitle = escapeHTML(title);
  const safeBody = escapeHTML(body).replace(/\n/g, "<br>");
  const actionHtml = action ? `<p style="margin:28px 0 0"><a href="${escapeAttribute(action.url)}" style="display:inline-block;background:#ff5c20;color:#fff;text-decoration:none;padding:14px 18px;border-radius:10px;font-weight:800">${escapeHTML(action.label)}</a></p>` : "";
  return `<!doctype html><html><body style="margin:0;background:#f6f6f4;font-family:Arial,sans-serif;color:#17171b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f6f4;padding:28px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e5e5e2;border-radius:18px;overflow:hidden"><tr><td style="padding:26px 28px;border-bottom:1px solid #eee"><strong style="display:inline-block;background:#ff5c20;color:#fff;border-radius:9px;padding:9px 11px">CX</strong><span style="margin-left:10px;font-weight:800">Content X</span></td></tr><tr><td style="padding:30px 28px"><h1 style="margin:0 0 14px;font-size:26px;line-height:1.15">${safeTitle}</h1><p style="margin:0;color:#56565f;font-size:15px;line-height:1.65">${safeBody}</p>${actionHtml}</td></tr><tr><td style="padding:18px 28px;background:#fafaf8;color:#8b8b92;font-size:12px">You received this because notification email is enabled for Content X.</td></tr></table></td></tr></table></body></html>`;
}

function bindingValue(key: keyof EmailBindings): string {
  const bindings = env as unknown as EmailBindings;
  const value = bindings[key] || process.env[key];
  return typeof value === "string" ? value.trim() : "";
}

function cleanText(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function cleanEmail(value: unknown): string {
  const email = cleanText(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function escapeHTML(value: unknown): string {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character] || character);
}

function escapeAttribute(value: unknown): string {
  return escapeHTML(value).replace(/"/g, "&quot;");
}

function htmlToText(html: string): string {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
