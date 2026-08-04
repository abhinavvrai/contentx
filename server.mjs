import { createServer } from "node:http";
import { createReadStream, statSync, existsSync } from "node:fs";
import { extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT || process.argv[2] || 4173);

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".mp4", "video/mp4"],
  [".svg", "image/svg+xml"]
]);

function sendFile(request, response, filePath) {
  const stat = statSync(filePath);
  const ext = extname(filePath).toLowerCase();
  const type = types.get(ext) || "application/octet-stream";

  if (request.headers.range && ext === ".mp4") {
    const match = request.headers.range.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = Number(match[1]);
      if (!Number.isSafeInteger(start) || start < 0 || start >= stat.size) {
        response.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
        response.end();
        return;
      }
      const requestedEnd = match[2] ? Number(match[2]) : start + 1024 * 1024;
      const end = Math.min(stat.size - 1, Number.isSafeInteger(requestedEnd) ? requestedEnd : stat.size - 1);
      response.writeHead(206, {
        "Content-Type": type,
        "Content-Length": end - start + 1,
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes"
      });
      createReadStream(filePath, { start, end }).pipe(response);
      return;
    }
  }

  response.writeHead(200, {
    "Content-Type": type,
    "Content-Length": stat.size,
    "Accept-Ranges": "bytes"
  });
  createReadStream(filePath).pipe(response);
}

createServer((request, response) => {
  try {
    const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
    const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = resolve(root, `.${pathname}`);
    const relativePath = relative(root, filePath);

    if (relativePath.startsWith("..") || isAbsolute(relativePath) || !existsSync(filePath)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    sendFile(request, response, filePath);
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Server error");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Content X running at http://127.0.0.1:${port}`);
});
