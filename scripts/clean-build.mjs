import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

// .wrangler also contains local D1/R2 data. Never erase it during a build.
for (const buildDirectory of ["dist", ".wrangler/deploy", "node_modules/.vite"]) {
  rmSync(fileURLToPath(new URL(`../${buildDirectory}`, import.meta.url)), { recursive: true, force: true });
}
