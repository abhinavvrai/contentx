import {
  AccountError,
  accountDatabaseAvailable,
  expiredGoogleNonceCookie,
  expiredSessionCookie,
  getAccountCapabilities,
  getVerifiedAccountCapabilities,
  getSessionUser,
  issueGoogleNonce,
  loginAccount,
  loginWithGoogle,
  logoutAccount,
  registerAccount,
  requestEmailOtp,
  requestPasswordReset,
  resetAccountPassword,
  sessionCookie,
  verifyEmailOtp,
} from "../../../lib/auth";

export async function GET(request: Request) {
  return handle(async () => {
    const [user, providers, databaseAvailable] = await Promise.all([
      getSessionUser(request),
      getVerifiedAccountCapabilities(),
      accountDatabaseAvailable(),
    ]);
    return response({ user, providers, database: { available: databaseAvailable } });
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
    if (action === "request_password_reset") {
      await requestPasswordReset(request, input);
      return response({ ok: true });
    }
    if (action === "reset_password") {
      const { user, token } = await resetAccountPassword(request, input);
      return response({ user }, 200, { "Set-Cookie": sessionCookie(request, token) });
    }
    if (action === "request_otp") {
      await requestEmailOtp(request, input);
      return response({ ok: true });
    }
    if (action === "verify_otp") {
      const { user, token } = await verifyEmailOtp(request, input);
      return response({ user }, 200, { "Set-Cookie": sessionCookie(request, token) });
    }
    if (action === "google_nonce") {
      const { nonce, cookie } = issueGoogleNonce(request);
      return response({ nonce, clientId: getAccountCapabilities().google.clientId }, 200, { "Set-Cookie": cookie });
    }
    if (action === "google_login") {
      const { user, token } = await loginWithGoogle(request, input);
      const headers = new Headers();
      headers.append("Set-Cookie", sessionCookie(request, token));
      headers.append("Set-Cookie", expiredGoogleNonceCookie(request));
      return response({ user }, 200, headers);
    }
    if (action === "logout") {
      await logoutAccount(request);
      return response({ ok: true }, 200, { "Set-Cookie": expiredSessionCookie(request) });
    }
    throw new AccountError("Choose a valid account action.", 404);
  });
}

function response(body: unknown, status = 200, headers: HeadersInit = {}) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "no-store");
  return Response.json(body, {
    status,
    headers: responseHeaders,
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
