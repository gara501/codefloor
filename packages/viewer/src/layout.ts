import type { ArchEdge, ArchNode, CodefloorDoc } from "@codefloor/schema";

// Deterministic canvas layout: layers stack top to bottom in document order;
// inside a layer, modules are grouped by folder into small grids that wrap
// left to right; every layer is centered on the widest.

export const NODE_WIDTH = 172;
export const NODE_HEIGHT = 58;
const GAP_X = 16;
const GAP_Y = 14;
const GROUP_PAD = 14;
const GROUP_LABEL_HEIGHT = 22;
const GROUP_GAP = 28;
const MAX_ROW_WIDTH = 1900;
const LAYER_LABEL_HEIGHT = 30;
const LAYER_GAP = 64;
export const OTHER_GROUP = "other";

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  width: number;
  height: number;
}

export interface ModuleGroup {
  id: string;
  layerId: string;
  label: string;
  nodeIds: string[];
}

export interface ArchitectureLayout {
  nodePositions: Record<string, Point>;
  layerLabelPositions: Record<string, Point>;
  layerIndexById: Record<string, number>;
  groups: ModuleGroup[];
  groupRects: Record<string, Rect>;
}

/** Folder of a node's first file or glob, e.g. "features/chat". */
export function folderOf(node: ArchNode): string {
  const first = node.files?.[0];
  if (!first) return OTHER_GROUP;
  const path = first.replace(/^src\//, "");
  const glob = path.search(/[*?{[]/);
  const head = glob === -1 ? path : path.slice(0, glob);
  const slash = head.lastIndexOf("/");
  return slash <= 0 ? OTHER_GROUP : head.slice(0, slash);
}

/** Per-layer folder groups in document order; singletons fold into "other". */
export function groupModules(doc: CodefloorDoc): ModuleGroup[] {
  const groups: ModuleGroup[] = [];
  for (const layer of doc.layers) {
    const byFolder = new Map<string, string[]>();
    for (const node of doc.nodes) {
      if (node.layer !== layer.id) continue;
      const folder = folderOf(node);
      byFolder.set(folder, [...(byFolder.get(folder) ?? []), node.id]);
    }
    const other: string[] = [];
    for (const [folder, nodeIds] of byFolder) {
      if (folder === OTHER_GROUP || nodeIds.length < 2) other.push(...nodeIds);
      else groups.push({ id: `${layer.id}:${folder}`, layerId: layer.id, label: folder, nodeIds });
    }
    if (other.length > 0) {
      groups.push({
        id: `${layer.id}:${OTHER_GROUP}`,
        layerId: layer.id,
        label: OTHER_GROUP,
        nodeIds: other,
      });
    }
  }
  return groups;
}

function groupSize(count: number) {
  const cols = Math.max(1, Math.ceil(Math.sqrt(count * 1.5)));
  const rows = Math.ceil(count / cols);
  return {
    cols,
    width: cols * NODE_WIDTH + (cols - 1) * GAP_X + GROUP_PAD * 2,
    height: GROUP_LABEL_HEIGHT + rows * NODE_HEIGHT + (rows - 1) * GAP_Y + GROUP_PAD * 2,
  };
}

export function layoutArchitecture(doc: CodefloorDoc): ArchitectureLayout {
  const nodePositions: Record<string, Point> = {};
  const layerLabelPositions: Record<string, Point> = {};
  const layerIndexById: Record<string, number> = {};
  const groupRects: Record<string, Rect> = {};
  const groups = groupModules(doc);
  const layerWidths: Record<string, number> = {};

  let cursorY = 0;
  for (const [layerIndex, layer] of doc.layers.entries()) {
    layerIndexById[layer.id] = layerIndex;
    layerLabelPositions[layer.id] = { x: 0, y: cursorY };
    let x = 0;
    let y = cursorY + LAYER_LABEL_HEIGHT;
    let rowHeight = 0;
    let width = 0;
    for (const group of groups.filter((g) => g.layerId === layer.id)) {
      const size = groupSize(group.nodeIds.length);
      if (x > 0 && x + size.width > MAX_ROW_WIDTH) {
        x = 0;
        y += rowHeight + GROUP_GAP;
        rowHeight = 0;
      }
      groupRects[group.id] = { x, y, width: size.width, height: size.height };
      group.nodeIds.forEach((id, index) => {
        nodePositions[id] = {
          x: x + GROUP_PAD + (index % size.cols) * (NODE_WIDTH + GAP_X),
          y:
            y +
            GROUP_PAD +
            GROUP_LABEL_HEIGHT +
            Math.floor(index / size.cols) * (NODE_HEIGHT + GAP_Y),
        };
      });
      width = Math.max(width, x + size.width);
      x += size.width + GROUP_GAP;
      rowHeight = Math.max(rowHeight, size.height);
    }
    layerWidths[layer.id] = width;
    cursorY = y + rowHeight + LAYER_GAP;
  }

  const maxWidth = Math.max(0, ...Object.values(layerWidths));
  for (const layer of doc.layers) {
    const dx = (maxWidth - (layerWidths[layer.id] ?? 0)) / 2;
    const label = layerLabelPositions[layer.id];
    if (label) label.x += dx;
    for (const group of groups.filter((g) => g.layerId === layer.id)) {
      const rect = groupRects[group.id];
      if (rect) rect.x += dx;
      for (const id of group.nodeIds) {
        const p = nodePositions[id];
        if (p) p.x += dx;
      }
    }
  }

  return { nodePositions, layerLabelPositions, layerIndexById, groups, groupRects };
}

export type HandleSide = "top" | "bottom" | "left" | "right";

export interface EdgeHandles {
  sourceHandle: `${HandleSide}-source`;
  targetHandle: `${HandleSide}-target`;
}

// Vertical across layers; within a layer, whichever axis separates the boxes more.
export function pickEdgeHandles(
  layout: ArchitectureLayout,
  edge: Pick<ArchEdge, "from" | "to">,
  nodesById: Record<string, ArchNode>,
): EdgeHandles {
  const fromNode = nodesById[edge.from];
  const toNode = nodesById[edge.to];
  const fromLayer = fromNode ? (layout.layerIndexById[fromNode.layer] ?? 0) : 0;
  const toLayer = toNode ? (layout.layerIndexById[toNode.layer] ?? 0) : 0;
  const from = layout.nodePositions[edge.from] ?? { x: 0, y: 0 };
  const to = layout.nodePositions[edge.to] ?? { x: 0, y: 0 };
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const vertical = fromLayer !== toLayer || Math.abs(dy) / NODE_HEIGHT > Math.abs(dx) / NODE_WIDTH;
  if (vertical) {
    const downward = fromLayer !== toLayer ? toLayer > fromLayer : dy > 0;
    return downward
      ? { sourceHandle: "bottom-source", targetHandle: "top-target" }
      : { sourceHandle: "top-source", targetHandle: "bottom-target" };
  }
  return dx >= 0
    ? { sourceHandle: "right-source", targetHandle: "left-target" }
    : { sourceHandle: "left-source", targetHandle: "right-target" };
}
