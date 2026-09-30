import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_CONFIG } from "../config.js";

export const CONFIG_FILE = "codefloor.config.json";

export function runInit(cwd: string, force: boolean): 0 | 2 {
  const path = join(cwd, CONFIG_FILE);
  if (existsSync(path) && !force) {
    console.error(`${CONFIG_FILE} already exists (use --force to overwrite).`);
    return 2;
  }
  writeFileSync(path, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`);
  console.log(`Wrote ${CONFIG_FILE}`);
  return 0;
}
