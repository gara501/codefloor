import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { expect, it } from "vitest";
import { extract } from "./extract.js";

function project(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "cf-real-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

const layers = [{ id: "m", label: "Modules" }];

it("follows solution-style tsconfig references to find paths", () => {
  const dir = project({
    "tsconfig.json": JSON.stringify({ files: [], references: [{ path: "./tsconfig.app.json" }] }),
    "tsconfig.app.json": JSON.stringify({
      compilerOptions: {
        baseUrl: ".",
        paths: { "@/*": ["src/*"] },
        moduleResolution: "Bundler",
        module: "ESNext",
      },
      include: ["src"],
    }),
    "src/a/index.ts": 'import { b } from "@/b";\nexport const a = b;\n',
    "src/b/index.ts": "export const b = 1;\n",
  });
  const doc = extract(dir, { root: "src", tsconfig: "tsconfig.json", layers, modules: [] });
  expect(doc.edges.map((e) => e.id)).toEqual(["a->b"]);
});

it("links workspace packages imported through node_modules symlinks", () => {
  const dir = project({
    "packages/a/package.json": JSON.stringify({ name: "a" }),
    "packages/a/src/index.ts": 'import { b } from "b";\nexport const a = b;\n',
    "packages/b/package.json": JSON.stringify({
      name: "b",
      types: "dist/index.d.ts",
      main: "dist/index.js",
    }),
    "packages/b/dist/index.d.ts": "export declare const b: number;\n",
    "packages/b/src/index.ts": "export const b = 1;\n",
  });
  mkdirSync(join(dir, "node_modules"));
  symlinkSync(join(dir, "packages/b"), join(dir, "node_modules/b"), "dir");
  const doc = extract(dir, { root: "packages", layers, modules: [] });
  expect(doc.edges.map((e) => e.id)).toEqual(["a->b"]);
});
