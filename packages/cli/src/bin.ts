#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { runExtract } from "./commands/extract.js";
import { runInit } from "./commands/init.js";
import { runValidate } from "./commands/validate.js";
import { CliError } from "./errors.js";

const HELP = `codefloor — interactive architecture maps from a JSON document

Usage:
  codefloor init [--force]                      Write codefloor.config.json
  codefloor extract [--config f] [--out f]      Extract a skeleton document from TS/JS imports
  codefloor extract --against codefloor.json    Print what changed since that document (JSON diff)
  codefloor validate <file> [--root dir] [--stale]
                                                Validate; --root checks files, --stale compares hashes
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
