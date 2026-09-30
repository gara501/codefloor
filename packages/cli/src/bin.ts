#!/usr/bin/env node
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { runExtract } from "./commands/extract.js";
import { runInit } from "./commands/init.js";
import { runValidate } from "./commands/validate.js";
import { CliError } from "./errors.js";
import { buildSite, startServer } from "./site.js";

const HELP = `codefloor — interactive architecture maps from a JSON document

Usage:
  codefloor init [--force]                      Write codefloor.config.json
  codefloor extract [--config f] [--out f]      Extract a skeleton document from TS/JS imports
  codefloor extract --against codefloor.json    Print what changed since that document (JSON diff)
  codefloor validate <file> [--root dir] [--stale]
                                                Validate; --root checks files, --stale compares hashes
  codefloor build <file> [--out dir]            Write a static site (default: codefloor-site/)
  codefloor serve <file> [--port 4321]          Build to a temp folder and serve it locally
  codefloor --help | --version
`;

function version(): string {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  return String(pkg.version);
}

async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      config: { type: "string" },
      out: { type: "string" },
      against: { type: "string" },
      root: { type: "string" },
      stale: { type: "boolean" },
      port: { type: "string" },
      force: { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });
  const [command] = positionals;
  const cwd = process.cwd();

  if (values.version) {
    console.log(version());
    return 0;
  }
  if (values.help || !command) {
    console.log(HELP);
    return command || values.help ? 0 : 2;
  }
  switch (command) {
    case "init":
      return runInit(cwd, values.force ?? false);
    case "extract": {
      const json = runExtract({
        cwd,
        config: values.config,
        out: values.out,
        against: values.against,
      });
      if (!values.out || values.against) process.stdout.write(json);
      return 0;
    }
    case "validate": {
      const file = positionals[1];
      if (!file) throw new CliError("Usage: codefloor validate <file> [--root dir] [--stale]");
      const { exitCode, report } = runValidate(file, { root: values.root, stale: values.stale });
      console.log(report);
      return exitCode;
    }
    case "build": {
      const file = positionals[1];
      if (!file) throw new CliError("Usage: codefloor build <file> [--out dir]");
      const out = resolve(cwd, values.out ?? "codefloor-site");
      buildSite(resolve(cwd, file), out);
      console.log(`Built ${out}`);
      return 0;
    }
    case "serve": {
      const file = positionals[1];
      if (!file) throw new CliError("Usage: codefloor serve <file> [--port 4321]");
      const port = Number(values.port ?? 4321);
      if (!Number.isInteger(port) || port < 0 || port > 65535)
        throw new CliError(`Invalid port "${values.port}".`);
      const dir = join(mkdtempSync(join(tmpdir(), "codefloor-")), "site");
      buildSite(resolve(cwd, file), dir);
      const server = await startServer(dir, port);
      console.log(`codefloor serving ${file} at ${server.url} (Ctrl+C to stop)`);
      await new Promise<void>((done) => process.once("SIGINT", () => done()));
      await server.close();
      return 0;
    }
    default:
      throw new CliError(`Unknown command "${command}".\n\n${HELP}`);
  }
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error: unknown) => {
    if (process.env.DEBUG === "codefloor") console.error(error);
    else console.error(error instanceof Error ? error.message : String(error));
    process.exit(error instanceof CliError ? error.exitCode : 2);
  },
);
