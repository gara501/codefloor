import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { buildSite, startServer } from "./site.js";

const DEMO = fileURLToPath(
  new URL("../../../examples/booking-platform/codefloor.json", import.meta.url),
);
const tmp = () => mkdtempSync(join(tmpdir(), "cf-site-"));

function fakeApp(): string {
  const dir = tmp();
  writeFileSync(join(dir, "index.html"), "<!doctype html><div id=root></div>");
  mkdirSync(join(dir, "assets"));
  writeFileSync(join(dir, "assets", "app.js"), "console.log(1)");
  return dir;
}

describe("buildSite", () => {
  it("copies the app and writes codefloor.json", () => {
    const out = join(tmp(), "site");
    buildSite(DEMO, out, fakeApp());
    expect(existsSync(join(out, "index.html"))).toBe(true);
    expect(existsSync(join(out, "assets", "app.js"))).toBe(true);
    expect(existsSync(join(out, "codefloor.json"))).toBe(true);
  });

  it("refuses an invalid document", () => {
    const bad = join(tmp(), "bad.json");
    writeFileSync(bad, JSON.stringify({ name: "x" }));
    expect(() => buildSite(bad, join(tmp(), "site"), fakeApp())).toThrow(/invalid/);
  });
});

describe("startServer", () => {
  let close: (() => Promise<void>) | undefined;
  afterEach(async () => close?.());

  it("serves the site and blocks path traversal", async () => {
    const out = join(tmp(), "site");
    buildSite(DEMO, out, fakeApp());
    const server = await startServer(out, 0);
    close = server.close;
    const index = await fetch(server.url);
    expect(index.status).toBe(200);
    expect(index.headers.get("content-type")).toContain("text/html");
    const json = await fetch(new URL("codefloor.json", server.url));
    expect(json.status).toBe(200);
    expect(json.headers.get("content-type")).toContain("application/json");
    const traversal = await fetch(`${server.url}%2e%2e/%2e%2e/package.json`);
    expect(traversal.status).toBe(404);
  });
});
