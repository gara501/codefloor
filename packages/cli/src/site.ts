import { cpSync, existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "@codefloor/schema";
import { CliError } from "./errors.js";

/** Prebuilt viewer app shipped with the CLI package. */
export function appDir(): string {
  return fileURLToPath(new URL("../app/", import.meta.url));
}

export function buildSite(docPath: string, outDir: string, appSource = appDir()): void {
  let doc: unknown;
  try {
    doc = JSON.parse(readFileSync(docPath, "utf8"));
  } catch (error) {
    throw new CliError(`Cannot read ${docPath}: ${(error as Error).message}`);
  }
  const result = validate(doc);
  if (!result.ok) {
    const lines = result.errors.map((e) => `  ${e.path || "(root)"}: ${e.message}`);
    throw new CliError(`${docPath} is invalid:\n${lines.join("\n")}`, 1);
  }
  if (!existsSync(join(appSource, "index.html"))) {
    throw new CliError(`Viewer app not found at ${appSource}. Run "npm run build" first.`);
  }
  cpSync(appSource, outDir, { recursive: true });
  writeFileSync(join(outDir, "codefloor.json"), `${JSON.stringify(doc, null, 2)}\n`);
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

export function startServer(
  dir: string,
  port: number,
): Promise<{ url: string; close(): Promise<void> }> {
  const root = resolve(dir);
  const server = createServer((req, res) => {
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const file = resolve(root, `.${pathname.endsWith("/") ? `${pathname}index.html` : pathname}`);
    if (!file.startsWith(root + sep) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  });
  return new Promise((ok, fail) => {
    server.once("error", fail);
    server.listen(port, "127.0.0.1", () => {
      const { port: actual } = server.address() as AddressInfo;
      ok({
        url: `http://127.0.0.1:${actual}/`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}
