import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validate } from "@codefloor/schema";
import { describe, expect, it } from "vitest";
import { runInit } from "./commands/init.js";
import { loadConfig } from "./config.js";
import { extract } from "./extract.js";
import { copyFixture, FIXTURE } from "./testUtils.js";

const run = (dir: string) => extract(dir, loadConfig(join(dir, "codefloor.config.json")));

describe("extract", () => {
  const doc = run(FIXTURE);

  it("groups files into modules", () => {
    expect(doc.nodes.map((n) => n.id).sort()).toEqual(["app", "cart", "lib"]);
    expect(doc.nodes.find((n) => n.id === "lib")?.layer).toBe("infra");
    expect(doc.nodes.find((n) => n.id === "app")?.files).toEqual(["src/app/**"]);
  });

  it("emits deduped module edges without self-edges or externals", () => {
    expect(doc.edges.map((e) => e.id).sort()).toEqual(["app->cart", "cart->lib", "lib->cart"]);
    expect(doc.edges.every((e) => e.kind === "imports" && e.status === "built")).toBe(true);
  });

  it("produces a valid skeleton", () => {
    expect(validate(doc).errors).toEqual([]);
    expect(doc.flows).toEqual([]);
  });

  it("hashes are stable and change when a module's file changes", () => {
    const dir = copyFixture();
    const before = run(dir).meta?.sources ?? {};
    expect(run(dir).meta?.sources).toEqual(before);
    appendFileSync(join(dir, "src/lib/api.ts"), "\nexport const v = 2;\n");
    const after = run(dir).meta?.sources ?? {};
    expect(after.lib).not.toBe(before.lib);
    expect(after.cart).toBe(before.cart);
  });
});

describe("init", () => {
  it("writes a config and refuses to overwrite without force", () => {
    const dir = copyFixture();
    expect(runInit(dir, false)).toBe(2);
    expect(runInit(dir, true)).toBe(0);
    const cfg = JSON.parse(readFileSync(join(dir, "codefloor.config.json"), "utf8"));
    expect(cfg.layers[0].id).toBe("modules");
    expect(existsSync(join(dir, "codefloor.config.json"))).toBe(true);
  });
});
