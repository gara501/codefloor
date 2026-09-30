---
name: codefloor
description: Generate or update a codefloor.json architecture map for a repository (layers, modules, edges, step-by-step flows) and preview it as an interactive explorer. Use when the user asks to map, document or visualize a project's architecture, create or refresh codefloor.json, or keep an architecture diagram in sync with the code.
---

# codefloor

Produces `codefloor.json` (schema `codefloor/v1`) for the current repository and keeps it current. The `codefloor` CLI does the mechanical work (import graph, hashes, validation, preview); you write what code analysis cannot: layer choices, module descriptions and flows.

Read `references/schema.md` for the document format and `references/writing-guide.md` before writing descriptions or flows.

## Prerequisites

- Node 20+. Run `npx codefloor --version`; if it fails, install with `npm i -D codefloor`.
- Work from the repository root.

## Pick a mode

- `codefloor.json` does not exist → **generate**.
- It exists → **update**. Never regenerate an existing document from scratch; humans may have edited it.

## Mode: generate

1. If `codefloor.config.json` is missing, run `npx codefloor init`.
2. Read `CLAUDE.md`, `README*` and `docs/` (skim) to decide the layers (usually 3–6, ordered top to bottom: entry/presentation first, infrastructure/external last). Edit `codefloor.config.json`: set `root`, `tsconfig`, `layers`, and add `modules` rules (`id`, `label`, `layer`, `include` globs) so each module is a meaningful unit (a feature, a service, a shared library), not a single file.
3. Run `npx codefloor extract --out codefloor.json`. Every node starts with `description: "TODO: describe"`.
4. For each node, read its files (see Cost rules) and replace the description following the writing guide.
5. Add non-import edges the code implies but imports cannot show (`http`, `event`, `reads`, `writes`, `calls`) and external systems (databases, queues, third-party APIs) as nodes without `files`.
6. Derive 3–6 flows from entry points (routes, handlers, CLI commands, jobs). Each flow is the path one request or event takes, 4–10 steps.
7. Add `status: "planned"` nodes or edges only when docs, tickets or TODOs state the intent. Never invent roadmap items.
8. Run `npx codefloor validate codefloor.json --root .` and fix every error. Repeat until it prints `✓ valid`.
9. Offer a preview: `npx codefloor serve codefloor.json`.

## Mode: update

1. Run `npx codefloor extract --against codefloor.json`. It prints `{ added, removed, changed, edgesAdded, edgesRemoved }`.
2. If everything is empty, stop: the map is current.
3. For `added` nodes: add them with descriptions (take the skeleton node from `npx codefloor extract`).
4. For `changed` nodes: re-read only their files and rewrite the description only if behavior changed.
5. For `removed` nodes: delete the node, its edges and any flow steps that reference it.
6. Apply `edgesAdded` / `edgesRemoved` to import edges. Leave hand-written non-import edges alone unless their endpoints were removed.
7. Revisit only the flows that pass through touched nodes.
8. Refresh hashes and the date: copy `meta.sources` from a fresh `npx codefloor extract` output into the document and set `lastReviewed` to today.
9. Run `npx codefloor validate codefloor.json --root . --stale` until it prints `✓ valid`.

## Cost rules

- In update mode, never read files of nodes that are not in `added` or `changed`.
- For files over 300 lines, read exports and the first ~150 lines; open more only if the description would otherwise be a guess.
- Prefer one representative file per module (index, main, router, service entry) over reading every file.
- CI can run `npx codefloor validate codefloor.json --stale` (no LLM) to detect drift and trigger an update.

## Output checklist

- `validate` prints `✓ valid`.
- No `TODO: describe` left.
- 3–6 flows, each 4–10 steps, every step node exists.
- `planned` items are backed by written evidence.
- No secrets, credentials, internal hostnames or personal data in descriptions.
