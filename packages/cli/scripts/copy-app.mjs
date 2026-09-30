// Copies the viewer's standalone app into this package so `build`/`serve` work offline.
import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const from = fileURLToPath(new URL("../../viewer/dist-app/", import.meta.url));
const to = fileURLToPath(new URL("../app/", import.meta.url));
if (!existsSync(from)) {
  console.error("viewer dist-app missing: run `npm run build -w @codefloor/viewer` first");
  process.exit(1);
}
rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true });
console.log("copied viewer app → packages/cli/app");
