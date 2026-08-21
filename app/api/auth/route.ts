import {
  AccountError,
  expiredSessionCookie,
  getSessionUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  sessionCookie,
} from "../../../lib/auth";

export async function GET(request: Request) {
  return handle(async () => {
    const user = await getSessionUser(request);
    return response({ user });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const input = await request.json() as Record<string, unknown>;
    const action = typeof input.action === "string" ? input.action : "";
    if (action === "register") {
      const { user, token } = await registerAccount(request, input);
      return response({ user }, 201, { "Set-Cookie": sessionCookie(request, token) });
    }
    if (action === "login") {
      const { user, token } = await loginAccount(request, input);
      return response({ user }, 200, { "Set-Cookie": sessionCookie(request, token) });
    }
    if (action === "logout") {
      await logoutAccount(request);
      return response({ ok: true }, 200, { "Set-Cookie": expiredSessionCookie(request) });
    }
    throw new AccountError("Choose a valid account action.", 404);
  });
}

function response(body: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

async function handle(operation: () => Promise<Response>): Promise<Response> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AccountError) return response({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return response({ error: "The account request was not valid." }, 400);
    console.error("Content X account error", error);
    return response({ error: "Account access is temporarily unavailable." }, 503);
  }
}
