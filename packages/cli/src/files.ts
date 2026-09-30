import { readdirSync } from "node:fs";
import { join } from "node:path";

const SOURCE = /\.(tsx?|jsx?|mjs|cjs)$/;
const SKIP_FILE = /\.d\.ts$|\.(test|spec)\.[^.]+$/;
const SKIP_DIR = new Set(["node_modules", "dist", ".git"]);

/** Repo-relative POSIX paths of source files under `root`, sorted. */
export function listSourceFiles(repoDir: string, root: string): string[] {
  const out: string[] = [];
  const walk = (rel: string) => {
    let entries: import("node:fs").Dirent[];
    try {
      entries = readdirSync(join(repoDir, rel), { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!SKIP_DIR.has(entry.name)) walk(path);
      } else if (SOURCE.test(entry.name) && !SKIP_FILE.test(entry.name)) {
        out.push(path);
      }
    }
  };
  walk(root.replace(/^\.\/?|\/$/g, ""));
  return out.sort();
}
