import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEFAULT_CONFIG, loadConfig } from "../config.js";
import { extract } from "../extract.js";
import { CONFIG_FILE } from "./init.js";

export interface ExtractOptions {
  cwd: string;
  config?: string;
  out?: string;
}

export function runExtract({ cwd, config, out }: ExtractOptions): string {
  const configPath = resolve(cwd, config ?? CONFIG_FILE);
  const cfg = existsSync(configPath) || config ? loadConfig(configPath) : DEFAULT_CONFIG;
  const json = `${JSON.stringify(extract(cwd, cfg), null, 2)}\n`;
  if (out) writeFileSync(resolve(cwd, out), json);
  return json;
}
