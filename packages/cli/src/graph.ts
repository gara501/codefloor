import { readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import ts from "typescript";

function compilerOptions(repoDir: string, tsconfigPath?: string): ts.CompilerOptions {
  const defaults: ts.CompilerOptions = {
    allowJs: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  };
  if (!tsconfigPath) return defaults;
  const abs = join(repoDir, tsconfigPath);
  const read = ts.readConfigFile(abs, ts.sys.readFile);
  if (read.error) return defaults;
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, dirname(abs));
  return { ...defaults, ...parsed.options, allowJs: true };
}

/** file -> files it imports, restricted to `files` (externals dropped). */
export function buildImportGraph(
  repoDir: string,
  files: string[],
  tsconfigPath?: string,
): Map<string, Set<string>> {
  const options = compilerOptions(repoDir, tsconfigPath);
  const known = new Set(files);
  const host = ts.createModuleResolutionCache(repoDir, (f) => f, options);
  const graph = new Map<string, Set<string>>();

  for (const file of files) {
    const abs = join(repoDir, file);
    const targets = new Set<string>();
    const info = ts.preProcessFile(readFileSync(abs, "utf8"), true, true);
    for (const ref of info.importedFiles) {
      const resolved = ts.resolveModuleName(
        ref.fileName,
        abs,
        options,
        ts.sys,
        host,
      ).resolvedModule;
      if (!resolved) continue;
      const rel = relative(repoDir, resolved.resolvedFileName).split(sep).join("/");
      if (known.has(rel) && rel !== file) targets.add(rel);
    }
    graph.set(file, targets);
  }
  return graph;
}
