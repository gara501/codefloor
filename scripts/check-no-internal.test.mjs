import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { findInternalTerms } from "./check-no-internal.mjs";

it("flags whole-word, case-insensitive matches only", () => {
  const dir = mkdtempSync(join(tmpdir(), "cf-int-"));
  writeFileSync(join(dir, "a.txt"), "Hello Acme team\n");
  writeFileSync(join(dir, "b.txt"), "acmes everywhere\n");
  expect(findInternalTerms(dir, ["acme"])).toEqual([{ file: "a.txt", line: 1, term: "acme" }]);
});

it("reads terms from CODEFLOOR_DENYLIST, then an untracked file, else none", async () => {
  const { loadTerms } = await import("./check-no-internal.mjs");
  const dir = mkdtempSync(join(tmpdir(), "cf-terms-"));
  expect(loadTerms(dir, { CODEFLOOR_DENYLIST: "Foo, bar ,," })).toEqual(["foo", "bar"]);
  expect(loadTerms(dir, {})).toEqual([]);
  writeFileSync(join(dir, ".internal-denylist"), "baz\n\nqux\n");
  expect(loadTerms(dir, {})).toEqual(["baz", "qux"]);
});
