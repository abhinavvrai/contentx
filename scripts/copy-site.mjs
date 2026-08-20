import { cpSync, mkdirSync, rmSync } from "node:fs";

mkdirSync("dist/client", { recursive: true });

for (const destination of ["dist/client/site", "dist/client/site-v2"]) {
  rmSync(destination, { recursive: true, force: true });
  cpSync("public/site", destination, { recursive: true });
}
