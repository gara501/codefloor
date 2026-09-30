import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type EdgeTypes,
  MiniMap,
  type Node,
  type NodeMouseHandler,
  type NodeTypes,
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
} from "@xyflow/react";
import { type ReactNode, useEffect } from "react";
import { FlowHopEdge } from "./FlowHopEdge";
import { GroupNode, type GroupNodeType } from "./nodes/GroupNode";
import { LayerLabelNode, type LayerLabelNodeType } from "./nodes/LayerLabelNode";
import { ModuleNode, type ModuleNodeType } from "./nodes/ModuleNode";
import { useReducedMotion } from "./useReducedMotion";

export type DiagramNode = ModuleNodeType | LayerLabelNodeType | GroupNodeType;

const nodeTypes: NodeTypes = { module: ModuleNode, layerLabel: LayerLabelNode, folder: GroupNode };
const edgeTypes: EdgeTypes = { flowHop: FlowHopEdge };

export interface DiagramProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: NodeMouseHandler;
  onPaneClick: () => void;
  /** Node ids to frame; null leaves the camera alone. */
  focusNodeIds: string[] | null;
  overlay?: ReactNode;
}

function CameraFollow({ nodeIds }: { nodeIds: string[] | null }) {
  const { fitView } = useReactFlow();
  const initialized = useNodesInitialized();
  const reduceMotion = useReducedMotion();
  const key = nodeIds?.join(",") ?? "";

  useEffect(() => {
    if (!initialized || !key) return;
    fitView({
      nodes: key.split(",").map((id) => ({ id })),
      duration: reduceMotion ? 0 : 600,
      padding: 0.5,
      maxZoom: 1.25,
    });
  }, [initialized, key, fitView, reduceMotion]);

  return null;
}

export function Diagram({
  nodes,
  edges,
  onNodeClick,
  onPaneClick,
  focusNodeIds,
  overlay,
}: DiagramProps) {
  return (
    <div className="cf-diagram">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        minZoom={0.2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable />
        <CameraFollow nodeIds={focusNodeIds} />
      </ReactFlow>
      {overlay && <div className="cf-overlay cf-fade-in">{overlay}</div>}
    </div>
  );
}
