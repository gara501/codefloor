import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { type CodefloorDoc, validate } from "@codefloor/schema";
import { listSourceFiles } from "../files.js";
import { hashPatterns } from "../hash.js";

export interface ValidateCmdOptions {
  /** Repo root for file checks and --stale; --stale defaults to the document's folder. */
  root?: string;
  stale?: boolean;
}

export function runValidate(
  file: string,
  opts: ValidateCmdOptions,
): { exitCode: 0 | 1; report: string } {
  const lines: string[] = [];
  let doc: unknown;
  try {
    doc = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    return { exitCode: 1, report: `✗ cannot read ${file}: ${(error as Error).message}` };
  }

  const root = opts.root ? resolve(opts.root) : undefined;
  const result = validate(doc, root ? { fileExists: (p) => existsSync(join(root, p)) } : {});
  for (const e of result.errors) lines.push(`error ${e.path || "(root)"}: ${e.message}`);
  for (const w of result.warnings) lines.push(`warning ${w.path}: ${w.message}`);

  let stale = 0;
  if (result.ok && opts.stale) {
    const repo = root ?? dirname(resolve(file));
    const d = doc as CodefloorDoc;
    const files = listSourceFiles(repo, "");
    const recorded = d.meta?.sources ?? {};
    for (const node of d.nodes) {
      if (!node.files?.length) continue;
      const saved = recorded[node.id];
      if (!saved) lines.push(`no hash: ${node.id}`);
      else if (saved !== hashPatterns(repo, node.files, files)) {
        lines.push(`stale: ${node.id}`);
        stale++;
      }
    }
  }

  const ok = result.ok && stale === 0;
  lines.push(ok ? "✓ valid" : `✗ ${result.errors.length} error(s), ${stale} stale module(s)`);
  return { exitCode: ok ? 0 : 1, report: lines.join("\n") };
}
