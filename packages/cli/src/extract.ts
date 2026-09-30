import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { ArchEdge, ArchNode, CodefloorDoc } from "@codefloor/schema";
import picomatch from "picomatch";
import type { CodefloorConfig } from "./config.js";
import { listSourceFiles } from "./files.js";
import { buildImportGraph } from "./graph.js";
import { hashPatterns } from "./hash.js";

export const TODO_DESCRIPTION = "TODO: describe";

export interface ModuleInfo {
  id: string;
  label: string;
  layer: string;
  patterns: string[];
}

/** file -> module. First matching rule wins; otherwise the first folder under root. */
export function assignModules(files: string[], config: CodefloorConfig): Map<string, ModuleInfo> {
  const rules = config.modules.map((rule) => ({ rule, match: picomatch(rule.include) }));
  const root = config.root.replace(/^\.\/?|\/$/g, "");
  const defaultLayer = config.layers[0]?.id ?? "modules";
  const out = new Map<string, ModuleInfo>();
  for (const file of files) {
    const hit = rules.find((r) => r.match(file));
    if (hit) {
      const { id, label, layer, include } = hit.rule;
      out.set(file, { id, label: label ?? id, layer, patterns: include });
      continue;
    }
    const rest = root && file.startsWith(`${root}/`) ? file.slice(root.length + 1) : file;
    const slash = rest.indexOf("/");
    if (slash === -1) {
      const id = rest.replace(/\.[^.]+$/, "");
      out.set(file, { id, label: id, layer: defaultLayer, patterns: [file] });
    } else {
      const id = rest.slice(0, slash);
      const prefix = root ? `${root}/${id}` : id;
      out.set(file, { id, label: id, layer: defaultLayer, patterns: [`${prefix}/**`] });
    }
  }
  return out;
}

function projectName(repoDir: string): string {
  const pkg = join(repoDir, "package.json");
  if (existsSync(pkg)) {
    try {
      const name = JSON.parse(readFileSync(pkg, "utf8")).name;
      if (typeof name === "string" && name) return name;
    } catch {
      // fall through to the folder name
    }
  }
  return basename(repoDir);
}

/** Skeleton document: modules, import edges and content hashes. */
export function extract(repoDir: string, config: CodefloorConfig): CodefloorDoc {
  const files = listSourceFiles(repoDir, config.root);
  const byFile = assignModules(files, config);
  const graph = buildImportGraph(repoDir, files, config.tsconfig);

  const modules = new Map<string, ModuleInfo>();
  for (const info of byFile.values()) if (!modules.has(info.id)) modules.set(info.id, info);

  const edgeIds = new Set<string>();
  for (const [file, targets] of graph) {
    const from = byFile.get(file)?.id;
    for (const target of targets) {
      const to = byFile.get(target)?.id;
      if (from && to && from !== to) edgeIds.add(`${from}->${to}`);
    }
  }

  const ids = [...modules.keys()].sort();
  const nodes: ArchNode[] = ids.map((id) => {
    const m = modules.get(id) as ModuleInfo;
    return {
      id,
      label: m.label,
      layer: m.layer,
      status: "built",
      files: m.patterns,
      description: TODO_DESCRIPTION,
    };
  });
  const edges: ArchEdge[] = [...edgeIds].sort().map((id) => {
    const [from = "", to = ""] = id.split("->");
    return { id, from, to, kind: "imports", status: "built" };
  });
  const sources: Record<string, string> = {};
  for (const node of nodes) sources[node.id] = hashPatterns(repoDir, node.files ?? [], files);

  return {
    $schema: "https://unpkg.com/@codefloor/schema/schema.json",
    name: projectName(repoDir),
    lastReviewed: new Date().toISOString().slice(0, 10),
    layers: config.layers,
    nodes,
    edges,
    flows: [],
    meta: { sources },
  };
}
