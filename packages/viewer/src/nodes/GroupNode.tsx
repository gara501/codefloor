import type { Node, NodeProps } from "@xyflow/react";
import { cn } from "../cn";

export interface GroupNodeData {
  [key: string]: unknown;
  label: string;
  count: number;
  width: number;
  height: number;
  isDimmed: boolean;
}

export type GroupNodeType = Node<GroupNodeData, "folder">;

export function GroupNode({ data }: NodeProps<GroupNodeType>) {
  return (
    <div
      style={{ width: data.width, height: data.height }}
      className={cn("cf-group", data.isDimmed && "cf-dimmed")}
    >
      <p className="cf-group__label">
        {data.label}
        <span className="cf-badge">{data.count}</span>
      </p>
    </div>
  );
}
