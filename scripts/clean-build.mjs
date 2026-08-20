import { rmSync } from "node:fs";

for (const buildDirectory of ["dist", ".wrangler"]) {
  rmSync(buildDirectory, { recursive: true, force: true });
}
