import { readFileSync } from "node:fs";
import type { Layer } from "@codefloor/schema";
import { CliError } from "./errors.js";

export interface ModuleRule {
  id: string;
  label?: string;
  layer: string;
  include: string[];
}

export interface CodefloorConfig {
  root: string;
  tsconfig?: string;
  layers: Layer[];
  modules: ModuleRule[];
}

export const DEFAULT_CONFIG: CodefloorConfig = {
  root: "src",
  tsconfig: "tsconfig.json",
  layers: [{ id: "modules", label: "Modules" }],
  modules: [],
};

export function loadConfig(path: string): CodefloorConfig {
  let raw: Partial<CodefloorConfig>;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new CliError(`Cannot read config ${path}: ${(error as Error).message}`);
  }
  const config = { ...DEFAULT_CONFIG, ...raw };
  if (config.layers.length === 0) throw new CliError("Config needs at least one layer.");
  return config;
}
