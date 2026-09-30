import { appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { runValidate } from "./commands/validate.js";
import { loadConfig } from "./config.js";
import { extract } from "./extract.js";
import { copyFixture } from "./testUtils.js";

const DEMO = fileURLToPath(
  new URL("../../../examples/booking-platform/codefloor.json", import.meta.url),
);

function fixtureDoc() {
  const dir = copyFixture();
  const doc = extract(dir, loadConfig(join(dir, "codefloor.config.json")));
  const file = join(dir, "codefloor.json");
  writeFileSync(file, JSON.stringify(doc));
  return { dir, doc, file };
}

it("passes the demo", () => {
  expect(runValidate(DEMO, {}).exitCode).toBe(0);
});

it("fails on an unreadable document", () => {
  const { dir } = fixtureDoc();
  const bad = join(dir, "bad.json");
  writeFileSync(bad, "{nope");
  expect(runValidate(bad, {}).exitCode).toBe(1);
});

it("flags stale modules after their files change", () => {
  const { dir, file } = fixtureDoc();
  appendFileSync(join(dir, "src/features/cart/store.ts"), "\nexport const y = 1;\n");
  const r = runValidate(file, { stale: true });
  expect(r.exitCode).toBe(1);
  expect(r.report).toContain("stale: cart");
  expect(r.report).not.toContain("stale: lib");
});

it("warns but passes when a node has no recorded hash", () => {
  const { doc, file } = fixtureDoc();
  delete doc.meta?.sources?.lib;
  writeFileSync(file, JSON.stringify(doc));
  const r = runValidate(file, { stale: true });
  expect(r.exitCode).toBe(0);
  expect(r.report).toContain("no hash: lib");
});

it("checks files against --root", () => {
  const { dir, doc, file } = fixtureDoc();
  doc.nodes[0]?.files?.push("src/missing.ts");
  writeFileSync(file, JSON.stringify(doc));
  const r = runValidate(file, { root: dir });
  expect(r.exitCode).toBe(1);
  expect(r.report).toContain("src/missing.ts");
});
