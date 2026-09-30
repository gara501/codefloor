import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { CodefloorDoc } from "@codefloor/schema";
import { expect, it } from "vitest";
import { runValidate } from "./commands/validate.js";
import { loadConfig } from "./config.js";
import { diffDocs } from "./diff.js";
import { extract } from "./extract.js";

// Keeps docs/tutorial.md honest: the finished map must match the sample app's code.
const APP = fileURLToPath(new URL("../../../examples/tutorial-app", import.meta.url));
const SOLUTION = `${APP}/solution/codefloor.json`;

it("the tutorial solution validates and is not stale", () => {
  const r = runValidate(SOLUTION, { root: APP, stale: true });
  expect(r.report).toContain("✓ valid");
  expect(r.exitCode).toBe(0);
});

it("the tutorial solution matches a fresh extraction", () => {
  const saved = JSON.parse(readFileSync(SOLUTION, "utf8")) as CodefloorDoc;
  const fresh = extract(APP, loadConfig(`${APP}/solution/codefloor.config.json`));
  expect(diffDocs(saved, fresh)).toEqual({
    added: [],
    removed: [],
    changed: [],
    edgesAdded: [],
    edgesRemoved: [],
  });
});
