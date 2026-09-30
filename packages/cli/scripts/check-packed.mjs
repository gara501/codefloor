// prepack guard: refuse to publish without the compiled CLI and the bundled viewer app.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED = ["dist/bin.js", "app/index.html"];

export function missingArtifacts(dir) {
  return REQUIRED.filter((file) => !existsSync(join(dir, file)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const missing = missingArtifacts(fileURLToPath(new URL("..", import.meta.url)));
  if (missing.length) {
    console.error(`Missing ${missing.join(", ")}. Run "npm run build" at the repo root first.`);
    process.exit(1);
  }
}
