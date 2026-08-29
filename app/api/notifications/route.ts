import { AccountError, getSessionUser, requireSameOrigin, requireSessionUser } from "../../../lib/auth";
import { getNotificationCenter, markNotificationRead, notifyOwner, publishNotification, updateNotificationPreferences, type NotificationType } from "../../../lib/notifications";

const ALLOWED_EVENTS = new Set<NotificationType>(["upload", "version", "comment", "reply", "feedback", "approval", "payment", "delivery", "managedReview", "security", "test"]);

export async function GET(request: Request) {
  return handle(async () => {
    const user = await requireSessionUser(request);
    return response(await getNotificationCenter(user));
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request);
    const input = await request.json() as Record<string, unknown>;
    const action = typeof input.action === "string" ? input.action : "";
    if (action === "update_preferences") {
      const user = await requireSessionUser(request);
      return response({ preferences: await updateNotificationPreferences(user, input) });
    }
    if (action === "mark_read") {
      const user = await requireSessionUser(request);
      await markNotificationRead(user, cleanText(input.id, 120));
      return response({ ok: true });
    }
    if (action === "test_notification") {
      const user = await requireSessionUser(request);
      const result = await publishNotification({
        recipientUserId: user.id,
        recipientEmail: user.email,
        eventType: "test",
        title: "Content X notifications are working",
        message: "This is a test notification from your account settings.",
        actionUrl: new URL("/site/index.html#account", request.url).toString(),
      });
      return response({ ok: true, result });
    }
    if (action === "record_event") {
      const eventType = normalizeEvent(input.eventType);
      const title = cleanText(input.title, 180);
      const message = cleanText(input.message, 1200);
      if (!eventType || !title || !message) throw new AccountError("Notification event is incomplete.", 400);
      const actionUrl = cleanText(input.actionUrl, 500) || new URL("/site/index.html#review", request.url).toString();
      const actorName = cleanText(input.actorName, 120);
      const actorEmail = cleanEmail(input.actorEmail);
      const projectId = cleanText(input.projectId, 120);
      const user = await getSessionUser(request).catch(() => null);
      const results = [];
      if (user) {
        results.push(await publishNotification({ recipientUserId: user.id, recipientEmail: user.email, eventType, title, message, projectId, actorName, actorEmail, actionUrl }));
      }
      if (["upload", "comment", "reply", "feedback", "approval", "version"].includes(eventType)) {
        await notifyOwner({ eventType, title, message, projectId, actorName: actorName || user?.name || null, actorEmail: actorEmail || user?.email || null, actionUrl });
      }
      return response({ ok: true, results });
    }
    throw new AccountError("Choose a valid notification action.", 404);
  });
}

function normalizeEvent(value: unknown): NotificationType | "" {
  const event = typeof value === "string" ? value : "";
  return ALLOWED_EVENTS.has(event as NotificationType) ? event as NotificationType : "";
}

function cleanText(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function cleanEmail(value: unknown): string {
  const email = cleanText(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function response(body: unknown, status = 200, headers: HeadersInit = {}) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "no-store");
  return Response.json(body, { status, headers: responseHeaders });
}

async function handle(operation: () => Promise<Response>): Promise<Response> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AccountError) return response({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return response({ error: "The notification request was not valid." }, 400);
    console.error("Content X notification error", error);
    return response({ error: "Notifications are temporarily unavailable." }, 503);
  }
}
