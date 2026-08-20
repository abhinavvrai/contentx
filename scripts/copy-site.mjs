import { cpSync, mkdirSync, rmSync } from "node:fs";

const destination = "dist/client/site";

rmSync(destination, { recursive: true, force: true });
mkdirSync("dist/client", { recursive: true });
cpSync("public/site", destination, { recursive: true });
