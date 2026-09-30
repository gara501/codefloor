import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import picomatch from "picomatch";

/** sha256 over the sorted files matching `patterns`. */
export function hashPatterns(repoDir: string, patterns: string[], files: string[]): string {
  const match = picomatch(patterns);
  const hash = createHash("sha256");
  for (const file of files.filter((f) => match(f)).sort()) {
    hash
      .update(file)
      .update("\0")
      .update(readFileSync(join(repoDir, file)))
      .update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}
