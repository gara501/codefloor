import type { Node, NodeProps } from "@xyflow/react";

export interface LayerLabelNodeData {
  [key: string]: unknown;
  label: string;
}

export type LayerLabelNodeType = Node<LayerLabelNodeData, "layerLabel">;

export function LayerLabelNode({ data }: NodeProps<LayerLabelNodeType>) {
  return <p className="cf-layer-label">{data.label}</p>;
}
