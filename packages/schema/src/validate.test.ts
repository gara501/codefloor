import { describe, expect, it } from "vitest";
import type { CodefloorDoc } from "./types.js";
import { validate } from "./validate.js";

function doc(): CodefloorDoc {
  return {
    name: "Mini",
    lastReviewed: "2026-01-01",
    layers: [
      { id: "ui", label: "UI" },
      { id: "data", label: "Data" },
    ],
    nodes: [
      { id: "web", label: "Web", layer: "ui", status: "built", description: "Web app." },
      { id: "db", label: "DB", layer: "data", status: "built", description: "Database." },
    ],
    edges: [{ id: "web-db", from: "web", to: "db", kind: "reads", status: "built" }],
    flows: [
      {
        id: "load",
        name: "Load",
        description: "Loads data.",
        steps: [
          { node: "web", label: "Request", detail: "User opens the page." },
          { node: "db", label: "Query", detail: "Rows are read." },
        ],
      },
    ],
  };
}

const paths = (issues: { path: string }[]) => issues.map((i) => i.path);

describe("validate", () => {
  it("accepts a valid document", () => {
    expect(validate(doc())).toEqual({ ok: true, errors: [], warnings: [] });
  });

  it("rejects non-objects", () => {
    const r = validate(null);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ path: "" });
    expect(r.errors[0]?.message).toContain("object");
  });

  it("reports a missing description", () => {
    const d = doc() as unknown as { nodes: Record<string, unknown>[] };
    delete d.nodes[0]?.description;
    expect(paths(validate(d).errors)).toContain("nodes[0].description");
  });

  it("reports an invalid status", () => {
    const d = doc() as unknown as { nodes: Record<string, unknown>[] };
    (d.nodes[0] as Record<string, unknown>).status = "done";
    expect(paths(validate(d).errors)).toContain("nodes[0].status");
  });

  it("reports duplicate node ids", () => {
    const d = doc();
    (d.nodes[1] as { id: string }).id = "web";
    const err = validate(d).errors.find((e) => e.path === "nodes[1].id");
    expect(err?.message).toContain("duplicate");
  });

  it("reports unknown layers", () => {
    const d = doc();
    (d.nodes[0] as { layer: string }).layer = "ghost";
    expect(paths(validate(d).errors)).toContain("nodes[0].layer");
  });

  it("reports unknown edge targets", () => {
    const d = doc();
    (d.edges[0] as { to: string }).to = "ghost";
    expect(paths(validate(d).errors)).toContain("edges[0].to");
  });

  it("reports self-edges", () => {
    const d = doc();
    (d.edges[0] as { to: string }).to = "web";
    const err = validate(d).errors.find((e) => e.path === "edges[0]");
    expect(err?.message).toContain("self");
  });

  it("reports unknown edge kinds", () => {
    const d = doc() as unknown as { edges: Record<string, unknown>[] };
    (d.edges[0] as Record<string, unknown>).kind = "smoke";
    expect(paths(validate(d).errors)).toContain("edges[0].kind");
  });

  it("reports empty flows", () => {
    const d = doc();
    (d.flows[0] as { steps: unknown[] }).steps = [];
    expect(paths(validate(d).errors)).toContain("flows[0].steps");
  });

  it("reports unknown flow step nodes", () => {
    const d = doc();
    (d.flows[0]?.steps[0] as { node: string }).node = "ghost";
    expect(paths(validate(d).errors)).toContain("flows[0].steps[0].node");
  });

  it("warns about unused layers", () => {
    const d = doc();
    d.layers.push({ id: "extra", label: "Extra" });
    const r = validate(d);
    expect(r.ok).toBe(true);
    expect(paths(r.warnings)).toEqual(["layers[2]"]);
  });

  it("checks non-glob files with fileExists", () => {
    const d = doc();
    (d.nodes[0] as { files?: string[] }).files = ["src/a.ts", "src/b/**"];
    const r = validate(d, { fileExists: () => false });
    expect(paths(r.errors)).toEqual(["nodes[0].files[0]"]);
  });
});
