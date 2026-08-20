import { rmSync } from "node:fs";

for (const buildDirectory of ["dist", ".wrangler", "node_modules/.vite"]) {
  rmSync(buildDirectory, { recursive: true, force: true });
}
