import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEFAULT_CONFIG, loadConfig } from "../config.js";
import { diffDocs } from "../diff.js";
import { CliError } from "../errors.js";
import { extract } from "../extract.js";
import { CONFIG_FILE } from "./init.js";

export interface ExtractOptions {
  cwd: string;
  config?: string;
  out?: string;
  /** Print a diff against this saved document instead of the document. */
  against?: string;
}

export function runExtract({ cwd, config, out, against }: ExtractOptions): string {
  const configPath = resolve(cwd, config ?? CONFIG_FILE);
  const cfg = existsSync(configPath) || config ? loadConfig(configPath) : DEFAULT_CONFIG;
  const doc = extract(cwd, cfg);
  if (against) {
    let prev: unknown;
    try {
      prev = JSON.parse(readFileSync(resolve(cwd, against), "utf8"));
    } catch (error) {
      throw new CliError(`Cannot read ${against}: ${(error as Error).message}`);
    }
    return `${JSON.stringify(diffDocs(prev as typeof doc, doc), null, 2)}\n`;
  }
  const json = `${JSON.stringify(doc, null, 2)}\n`;
  if (out) writeFileSync(resolve(cwd, out), json);
  return json;
}
