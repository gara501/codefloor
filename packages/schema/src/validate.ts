import type { EdgeKind, NodeStatus } from "./types.js";

export interface Issue {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Issue[];
  warnings: Issue[];
}

export interface ValidateOptions {
  /** Called for every non-glob entry in `node.files`. */
  fileExists?: (relPath: string) => boolean;
}

export const EDGE_KINDS: readonly EdgeKind[] = [
  "imports",
  "calls",
  "http",
  "event",
  "reads",
  "writes",
];
const STATUSES: readonly NodeStatus[] = ["built", "planned"];

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

export const isGlob = (p: string): boolean => /[*?{[]/.test(p);

function structure(doc: unknown, errors: Issue[]): void {
  const err = (path: string, message: string) => errors.push({ path, message });
  const str = (o: Obj, key: string, path: string, optional = false) => {
    const v = o[key];
    if (v === undefined && optional) return;
    if (typeof v !== "string" || (!optional && v.length === 0))
      err(`${path}.${key}`.replace(/^\./, ""), "must be a non-empty string");
  };
  const oneOf = (
    o: Obj,
    key: string,
    path: string,
    allowed: readonly string[],
    optional = false,
  ) => {
    const v = o[key];
    if (v === undefined && optional) return;
    if (typeof v !== "string" || !allowed.includes(v))
      err(`${path}.${key}`, `must be one of: ${allowed.join(", ")}`);
  };
  const list = (o: Obj, key: string, each: (item: Obj, path: string) => void) => {
    const v = o[key];
    if (!Array.isArray(v)) {
      err(key, "must be an array");
      return;
    }
    v.forEach((item, i) => {
      const path = `${key}[${i}]`;
      if (!isObj(item)) err(path, "must be an object");
      else each(item, path);
    });
  };

  if (!isObj(doc)) {
    err("", "document must be an object");
    return;
  }
  str(doc, "name", "");
  str(doc, "lastReviewed", "");
  str(doc, "description", "", true);
  list(doc, "layers", (l, p) => {
    str(l, "id", p);
    str(l, "label", p);
    str(l, "description", p, true);
  });
  list(doc, "nodes", (n, p) => {
    str(n, "id", p);
    str(n, "label", p);
    str(n, "layer", p);
    str(n, "description", p);
    oneOf(n, "status", p, STATUSES);
    if (
      n.files !== undefined &&
      (!Array.isArray(n.files) || n.files.some((f) => typeof f !== "string"))
    ) {
      err(`${p}.files`, "must be an array of strings");
    }
  });
  list(doc, "edges", (e, p) => {
    str(e, "id", p);
    str(e, "from", p);
    str(e, "to", p);
    str(e, "label", p, true);
    oneOf(e, "kind", p, EDGE_KINDS, true);
    oneOf(e, "status", p, STATUSES);
  });
  list(doc, "flows", (f, p) => {
    str(f, "id", p);
    str(f, "name", p);
    str(f, "description", p);
    if (!Array.isArray(f.steps)) {
      err(`${p}.steps`, "must be an array");
      return;
    }
    f.steps.forEach((s, i) => {
      const sp = `${p}.steps[${i}]`;
      if (!isObj(s)) {
        err(sp, "must be an object");
        return;
      }
      str(s, "node", sp);
      str(s, "label", sp);
      str(s, "detail", sp);
    });
  });
}

interface Shape {
  layers: { id: string }[];
  nodes: { id: string; layer: string; files?: string[] }[];
  edges: { id: string; from: string; to: string }[];
  flows: { id: string; steps: { node: string }[] }[];
}

function semantics(doc: Shape, opts: ValidateOptions, errors: Issue[], warnings: Issue[]): void {
  const err = (path: string, message: string) => errors.push({ path, message });
  const unique = (items: { id: string }[], key: string) => {
    const seen = new Set<string>();
    items.forEach((item, i) => {
      if (seen.has(item.id)) err(`${key}[${i}].id`, `duplicate id "${item.id}"`);
      seen.add(item.id);
    });
    return seen;
  };
  const layerIds = unique(doc.layers, "layers");
  const nodeIds = unique(doc.nodes, "nodes");
  unique(doc.edges, "edges");
  unique(doc.flows, "flows");

  doc.nodes.forEach((n, i) => {
    if (!layerIds.has(n.layer)) err(`nodes[${i}].layer`, `unknown layer "${n.layer}"`);
    n.files?.forEach((f, j) => {
      if (opts.fileExists && !isGlob(f) && !opts.fileExists(f))
        err(`nodes[${i}].files[${j}]`, `file not found: ${f}`);
    });
  });
  doc.edges.forEach((e, i) => {
    if (!nodeIds.has(e.from)) err(`edges[${i}].from`, `unknown node "${e.from}"`);
    if (!nodeIds.has(e.to)) err(`edges[${i}].to`, `unknown node "${e.to}"`);
    if (e.from === e.to) err(`edges[${i}]`, "self-edge is not allowed");
  });
  doc.flows.forEach((f, i) => {
    if (f.steps.length === 0) err(`flows[${i}].steps`, "flow needs at least one step");
    f.steps.forEach((s, j) => {
      if (!nodeIds.has(s.node)) err(`flows[${i}].steps[${j}].node`, `unknown node "${s.node}"`);
    });
  });
  const used = new Set(doc.nodes.map((n) => n.layer));
  doc.layers.forEach((l, i) => {
    if (!used.has(l.id))
      warnings.push({ path: `layers[${i}]`, message: `layer "${l.id}" has no nodes` });
  });
}

export function validate(doc: unknown, opts: ValidateOptions = {}): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  structure(doc, errors);
  if (errors.length === 0) semantics(doc as Shape, opts, errors, warnings);
  return { ok: errors.length === 0, errors, warnings };
}
