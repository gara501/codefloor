#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { runExtract } from "./commands/extract.js";
import { runInit } from "./commands/init.js";
import { CliError } from "./errors.js";

const HELP = `codefloor — interactive architecture maps from a JSON document

Usage:
  codefloor init [--force]                      Write codefloor.config.json
  codefloor extract [--config f] [--out f]      Extract a skeleton document from TS/JS imports
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
      const json = runExtract({ cwd, config: values.config, out: values.out });
      if (!values.out) process.stdout.write(json);
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
