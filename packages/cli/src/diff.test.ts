import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { loadConfig } from "./config.js";
import { diffDocs } from "./diff.js";
import { extract } from "./extract.js";
import { copyFixture } from "./testUtils.js";

const run = (dir: string) => extract(dir, loadConfig(join(dir, "codefloor.config.json")));
const empty = { added: [], removed: [], changed: [], edgesAdded: [], edgesRemoved: [] };

it("reports nothing when the code did not change", () => {
  const dir = copyFixture();
  expect(diffDocs(run(dir), run(dir))).toEqual(empty);
});

it("reports added modules and their import edges", () => {
  const dir = copyFixture();
  const prev = run(dir);
  mkdirSync(join(dir, "src/utils"));
  writeFileSync(join(dir, "src/utils/format.ts"), "export const fmt = (n: number) => String(n);\n");
  writeFileSync(
    join(dir, "src/app/main.ts"),
    'import { add } from "@/features/cart";\nimport { fmt } from "../utils/format";\nexport const t = fmt(add(1));\n',
  );
  const d = diffDocs(prev, run(dir));
  expect(d.added).toEqual(["utils"]);
  expect(d.changed).toEqual(["app"]);
  expect(d.edgesAdded).toEqual(["app->utils"]);
});

it("reports removed imports and removed modules", () => {
  const dir = copyFixture();
  const prev = run(dir);
  writeFileSync(join(dir, "src/features/cart/store.ts"), "export const add = (n: number) => n;\n");
  rmSync(join(dir, "src/lib"), { recursive: true });
  writeFileSync(
    join(dir, "src/app/main.ts"),
    'import { add } from "@/features/cart";\nexport const t = add(1);\n',
  );
  const d = diffDocs(prev, run(dir));
  expect(d.removed).toEqual(["lib"]);
  expect(d.edgesRemoved).toEqual(["cart->lib", "lib->cart"]);
  expect(d.changed).toContain("cart");
});

it("never reports hand-added non-import edges as removed", () => {
  const dir = copyFixture();
  const prev = run(dir);
  prev.edges.push({ id: "app->lib", from: "app", to: "lib", kind: "http", status: "built" });
  expect(diffDocs(prev, run(dir)).edgesRemoved).toEqual([]);
});
