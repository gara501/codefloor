import { existsSync, readFileSync } from "node:fs";
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
  let options = parsed.options;
  // Solution-style configs (files: [] + references) keep paths in a referenced config.
  if (!options.paths) {
    for (const ref of parsed.projectReferences ?? []) {
      const refAbs = ts.resolveProjectReferencePath(ref);
      const refRead = ts.readConfigFile(refAbs, ts.sys.readFile);
      if (refRead.error) continue;
      const refOptions = ts.parseJsonConfigFileContent(
        refRead.config,
        ts.sys,
        dirname(refAbs),
      ).options;
      if (refOptions.paths) {
        options = {
          ...refOptions,
          ...options,
          paths: refOptions.paths,
          baseUrl: refOptions.baseUrl,
        };
        break;
      }
    }
  }
  return { ...defaults, ...options, allowJs: true };
}

/** Maps a resolved file outside `known` (e.g. a workspace package's dist) to its package's source entry. */
function packageEntryResolver(repoDir: string, files: string[]) {
  const cache = new Map<string, string | undefined>();
  return (rel: string): string | undefined => {
    let dir = dirname(rel);
    while (dir !== "." && dir !== "" && !existsSync(join(repoDir, dir, "package.json")))
      dir = dirname(dir);
    if (dir === "." || dir === "" || dir.split("/").includes("node_modules")) return undefined;
    if (!cache.has(dir)) {
      const inside = files.filter((f) => f.startsWith(`${dir}/`));
      const entry = ["ts", "tsx", "js", "mjs"]
        .map((ext) => `${dir}/src/index.${ext}`)
        .find((f) => inside.includes(f));
      cache.set(dir, entry ?? inside[0]);
    }
    return cache.get(dir);
  };
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
  const toPackageEntry = packageEntryResolver(repoDir, files);

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
      const target = known.has(rel) ? rel : rel.startsWith("..") ? undefined : toPackageEntry(rel);
      if (target && target !== file) targets.add(target);
    }
    graph.set(file, targets);
  }
  return graph;
}
