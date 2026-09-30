# Codefloor — Design

Status: implemented in v0.1.0 · License: MIT

## 1. Goal

Open-source tool that produces an interactive architecture explorer (layers, modules, edges, step-by-step flows) for any project, driven by a single JSON file.

Success criteria:

- `npx codefloor serve examples/booking-platform/codefloor.json` opens a working explorer.
- `npx codefloor extract` produces a valid skeleton for a TS/JS repo.
- The Claude skill can generate and incrementally update `codefloor.json` for a repo.
- No internal or proprietary references anywhere in the repo (enforced by `scripts/check-no-internal.mjs` in CI).

Non-goals (v1): non-JS/TS extractors, hosted service, editing the graph in the UI, Playwright e2e.

## 2. Repository layout

```
codefloor/
  packages/
    schema/   @codefloor/schema   types, JSON Schema, validate()
    viewer/   @codefloor/viewer   <Codefloor /> + standalone app
    cli/      codefloor           init · extract · validate · build · serve
  skill/codefloor/                Claude skill (SKILL.md + references/)
  examples/booking-platform/      demo document
  scripts/check-no-internal.mjs
```

Dependency direction: `cli → schema`, `viewer → schema` (types + `validate`), `cli → viewer` (prebuilt app assets). The skill depends only on the CLI. The JSON document is the only contract between parts.

## 3. `@codefloor/schema`

```ts
interface CodefloorDoc {
  $schema?: string;
  name: string;
  description?: string;
  lastReviewed: string;             // YYYY-MM-DD
  layers: Layer[];                  // order = top-to-bottom render order
  nodes: ArchNode[];
  edges: ArchEdge[];
  flows: Flow[];
  meta?: { sources?: Record<string, string> }; // nodeId -> content hash
}
interface Layer   { id: string; label: string; description?: string }
interface ArchNode {
  id: string; label: string; layer: string;
  status: "built" | "planned";
  files?: string[];                 // repo-relative paths or globs
  description: string;
}
type EdgeKind = "imports" | "calls" | "http" | "event" | "reads" | "writes";
interface ArchEdge { id: string; from: string; to: string; label?: string; kind?: EdgeKind; status: "built" | "planned" }
interface FlowStep { node: string; label: string; detail: string }
interface Flow { id: string; name: string; description: string; steps: FlowStep[] }
```

Exports: the types, `EDGE_KINDS`, `isGlob`, and `validate(doc: unknown, opts?: { fileExists?: (path) => boolean })` returning `{ ok, errors, warnings }`. The JSON Schema (draft 2020-12) ships as `@codefloor/schema/schema.json`.

`validate` is hand-written with zero dependencies so the viewer can run it in the browser. Structural checks (required fields, types, enums), then semantic ones: unique ids per collection, known layers, edge endpoints and flow step nodes exist, no self-edges, flows have at least one step, and (with `fileExists`) every non-glob file exists. Unused layers are warnings.

## 4. `@codefloor/viewer`

```tsx
<Codefloor data={doc} theme="system" urlState className title />
```

- List view (modules grouped by layer, expandable details) and diagram view (React Flow, deterministic layered layout, folder groups).
- Flows: pick one, walk it with Previous/Next, dots, or ←/→; the path is drawn hop by hop even where no edge exists.
- Search (`/`), Esc clears, click-to-pin highlighting, detail card with connections and flows.
- `urlState` mirrors `?view,node,flow,step` to the URL with the History API; unknown ids are ignored and steps clamped.
- Invalid documents render a list of validation issues instead of crashing.
- Plain CSS (`codefloor.css`, `.cf-*` classes, `--cf-*` variables), light/dark/system themes, all motion disabled under `prefers-reduced-motion`.
- Runtime deps: `@xyflow/react`; peers `react`/`react-dom` ≥ 19.2.

Builds: library (ESM + `.d.ts` + `codefloor.css`) and a standalone app (`dist-app/`) that loads `./codefloor.json`.

## 5. `codefloor` CLI

| Command | Behavior |
|---|---|
| `init [--force]` | Writes `codefloor.config.json`. |
| `extract [--config f] [--out f]` | TypeScript compiler API import graph (honors tsconfig `paths`), files grouped into modules by config rules (first match wins; otherwise first folder under `root`). Emits nodes (`description: "TODO: describe"`), deduped `imports` edges, empty flows and `meta.sources` hashes. |
| `extract --against f` | JSON diff `{ added, removed, changed, edgesAdded, edgesRemoved }`; only `imports` edges are compared, only hashed nodes can be "removed". |
| `validate <file> [--root dir] [--stale]` | `--root` checks files exist; `--stale` recomputes hashes and fails on drift (nodes without a hash are warnings). |
| `build <file> [--out dir]` | Validates, then writes the viewer app + `codefloor.json` (default `codefloor-site/`). |
| `serve <file> [--port 4321]` | Builds to a temp folder and serves it on 127.0.0.1. |

Exit codes: 0 ok, 1 validation/stale failure, 2 usage/IO error. Stack traces only with `DEBUG=codefloor`.

## 6. Claude skill

`skill/codefloor/SKILL.md` with two modes. **generate**: init → choose layers from docs → extract → write descriptions → add non-import edges and external systems → 3–6 flows → validate. **update**: `extract --against` → touch only added/changed/removed nodes and the flows through them → refresh hashes and date → `validate --stale`.

Cost controls: unchanged nodes are never read in update mode; large files are read by exports plus the first ~150 lines; CI can run `validate --stale` without an LLM to detect drift.

## 7. Testing

Vitest everywhere: validator rules and the demo against both `validate()` and the JSON Schema; viewer layout, selection parsing, and RTL tests for list, flows, keyboard, URL state and invalid data; CLI extractor against a fixture with tsconfig paths, cycles, type-only and external imports, diff, stale detection, site build and server path-traversal guard. `check:internal` runs with `npm test` and in CI.
