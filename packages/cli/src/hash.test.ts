import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { hashPatterns } from "./hash.js";

it("ignores CRLF vs LF line endings", () => {
  const lf = mkdtempSync(join(tmpdir(), "cf-lf-"));
  const crlf = mkdtempSync(join(tmpdir(), "cf-crlf-"));
  writeFileSync(join(lf, "a.ts"), "export const a = 1;\nexport const b = 2;\n");
  writeFileSync(join(crlf, "a.ts"), "export const a = 1;\r\nexport const b = 2;\r\n");
  expect(hashPatterns(crlf, ["a.ts"], ["a.ts"])).toBe(hashPatterns(lf, ["a.ts"], ["a.ts"]));
});
