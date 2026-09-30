# codefloor/v1 schema

```ts
interface CodefloorDoc {
  $schema?: string;
  name: string;
  description?: string;
  lastReviewed: string;             // YYYY-MM-DD
  layers: { id: string; label: string; description?: string }[]; // render order, top to bottom
  nodes: {
    id: string; label: string; layer: string;
    status: "built" | "planned";
    files?: string[];               // repo-relative paths or globs; omit for external systems
    description: string;
  }[];
  edges: {
    id: string; from: string; to: string;
    label?: string;
    kind?: "imports" | "calls" | "http" | "event" | "reads" | "writes";
    status: "built" | "planned";
  }[];
  flows: {
    id: string; name: string; description: string;
    steps: { node: string; label: string; detail: string }[];
  }[];
  meta?: { sources?: Record<string, string> }; // nodeId -> content hash (written by extract)
}
```

Rules enforced by `codefloor validate`:

- Unique ids within layers, nodes, edges and flows.
- `node.layer` must be a declared layer; unused layers are a warning.
- Edge endpoints and flow step nodes must exist; no self-edges.
- Every flow has at least one step.
- With `--root`, every non-glob entry in `files` must exist.
- With `--stale`, nodes whose files changed since `meta.sources` was written fail.

Conventions:

- Edge id: `"<from>-><to>"`.
- Extracted import edges use `kind: "imports"`; `extract --against` only compares those, so hand-written edges of other kinds are never reported as removed.
