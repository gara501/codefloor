import type { ArchNode } from "@codefloor/schema";
import { describe, expect, it } from "vitest";
import {
  folderOf,
  groupModules,
  layoutArchitecture,
  NODE_HEIGHT,
  NODE_WIDTH,
  OTHER_GROUP,
  pickEdgeHandles,
} from "./layout";
import { demo } from "./testDemo";

const node = (files?: string[]): ArchNode => ({
  id: "x",
  label: "X",
  layer: "l",
  status: "built",
  description: "d",
  files,
});

describe("folderOf", () => {
  it("cuts globs and strips src/", () => {
    expect(folderOf(node(["src/auth/**"]))).toBe("auth");
  });
  it("uses the folder of a plain path", () => {
    expect(folderOf(node(["services/booking/src/index.ts"]))).toBe("services/booking/src");
  });
  it("falls back to other without files", () => {
    expect(folderOf(node())).toBe(OTHER_GROUP);
  });
});

describe("groupModules", () => {
  const groups = groupModules(demo);
  it("places every node exactly once", () => {
    const ids = groups.flatMap((g) => g.nodeIds).sort();
    expect(ids).toEqual(demo.nodes.map((n) => n.id).sort());
  });
  it("folds file-less nodes into the layer's other group", () => {
    expect(groups.find((g) => g.id === "data:other")?.nodeIds).toContain("postgres");
    expect(groups.find((g) => g.id === "external:other")?.nodeIds).toContain("email-provider");
  });
});

describe("layoutArchitecture", () => {
  const layout = layoutArchitecture(demo);
  it("never overlaps two nodes", () => {
    const pos = Object.values(layout.nodePositions);
    for (const [i, a] of pos.entries()) {
      for (const b of pos.slice(i + 1)) {
        const overlap = Math.abs(a.x - b.x) < NODE_WIDTH && Math.abs(a.y - b.y) < NODE_HEIGHT;
        expect(overlap).toBe(false);
      }
    }
  });
  it("stacks layer labels top to bottom in order", () => {
    const ys = demo.layers.map((l) => layout.layerLabelPositions[l.id]?.y ?? -1);
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
    expect(new Set(ys).size).toBe(ys.length);
  });
  it("routes cross-layer edges downward from bottom to top", () => {
    const byId = Object.fromEntries(demo.nodes.map((n) => [n.id, n]));
    expect(pickEdgeHandles(layout, { from: "web-app", to: "api-gateway" }, byId)).toEqual({
      sourceHandle: "bottom-source",
      targetHandle: "top-target",
    });
  });
});
