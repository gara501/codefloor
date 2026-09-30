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
