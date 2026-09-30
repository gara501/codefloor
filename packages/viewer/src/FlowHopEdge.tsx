import { BaseEdge, type Edge, type EdgeProps, getSmoothStepPath } from "@xyflow/react";
import { useReducedMotion } from "./useReducedMotion";

export type FlowHopState = "done" | "active" | "upcoming";

export interface FlowHopEdgeData {
  [key: string]: unknown;
  state: FlowHopState;
}

export type FlowHopEdgeType = Edge<FlowHopEdgeData, "flowHop">;

// One hop of the active flow, drawn even without a matching document edge.
export function FlowHopEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<FlowHopEdgeType>) {
  const reduceMotion = useReducedMotion();
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const state = data?.state ?? "upcoming";
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: "var(--cf-primary)",
          strokeWidth: state === "active" ? 2.5 : 1.5,
          strokeOpacity: state === "upcoming" ? 0.3 : 1,
          strokeDasharray: state === "upcoming" ? "4 4" : undefined,
        }}
      />
      {state === "active" && !reduceMotion && (
        <circle r={4} fill="var(--cf-primary)">
          <animateMotion dur="1.4s" repeatCount="indefinite" path={path} />
        </circle>
      )}
    </>
  );
}
