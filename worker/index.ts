/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  UPLOADS: R2Bucket;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === "www.contentx.co.in") {
      return withSecurityHeaders(request, Response.redirect(`https://contentx.co.in${url.pathname}${url.search}`, 308));
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return withSecurityHeaders(request, response);
    }

    if (url.pathname.startsWith("/site/") || url.pathname.startsWith("/site-v2/")) {
      return withSecurityHeaders(request, await env.ASSETS.fetch(request));
    }

    return withSecurityHeaders(request, await handler.fetch(request, env, ctx));
  },
};

export default worker;

function withSecurityHeaders(request: Request, response: Response): Response {
  const url = new URL(request.url);
  const headers = new Headers(response.headers);
  const contentType = headers.get("content-type") || "";
  const isSiteFile = url.pathname === "/" || url.pathname === "/site/index.html" || url.pathname.startsWith("/site/src/");
  if (isSiteFile || contentType.includes("text/html")) {
    headers.set("Cache-Control", "no-store, must-revalidate");
  }
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://accounts.google.com",
      "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://accounts.google.com https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline' https://accounts.google.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "media-src 'self' blob:",
      "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://accounts.google.com https://www.googleapis.com https://*.supabase.co",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  );
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
