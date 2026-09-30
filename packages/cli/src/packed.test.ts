import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
// @ts-expect-error plain .mjs script without types
import { missingArtifacts } from "../scripts/check-packed.mjs";

it("lists the build outputs a published package needs", () => {
  const dir = mkdtempSync(join(tmpdir(), "cf-pack-"));
  expect(missingArtifacts(dir)).toEqual(["dist/bin.js", "app/index.html"]);
  mkdirSync(join(dir, "dist"));
  mkdirSync(join(dir, "app"));
  writeFileSync(join(dir, "dist/bin.js"), "");
  writeFileSync(join(dir, "app/index.html"), "");
  expect(missingArtifacts(dir)).toEqual([]);
});
