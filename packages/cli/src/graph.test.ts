import { expect, it } from "vitest";
import { listSourceFiles } from "./files.js";
import { buildImportGraph } from "./graph.js";
import { FIXTURE } from "./testUtils.js";

it("lists source files, skipping tests", () => {
  expect(listSourceFiles(FIXTURE, "src")).toEqual([
    "src/app/main.ts",
    "src/features/cart/index.ts",
    "src/features/cart/store.ts",
    "src/lib/api.ts",
  ]);
});

it("resolves tsconfig paths and relative imports, dropping externals", () => {
  const files = listSourceFiles(FIXTURE, "src");
  const graph = buildImportGraph(FIXTURE, files, "tsconfig.json");
  expect([...(graph.get("src/app/main.ts") ?? [])]).toEqual(["src/features/cart/index.ts"]);
  expect([...(graph.get("src/lib/api.ts") ?? [])]).toEqual(["src/features/cart/index.ts"]);
  expect([...(graph.get("src/features/cart/store.ts") ?? [])].sort()).toEqual([
    "src/features/cart/index.ts",
    "src/lib/api.ts",
  ]);
});
