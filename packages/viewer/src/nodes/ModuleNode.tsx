import type { Node, NodeProps } from "@xyflow/react";
import { cn } from "../cn";
import { AllHandles } from "./handles";

export interface ModuleNodeData {
  [key: string]: unknown;
  label: string;
  status: "built" | "planned";
  description: string;
  isSelected: boolean;
  isCurrentStep: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
}

export type ModuleNodeType = Node<ModuleNodeData, "module">;

export function ModuleNode({ data }: NodeProps<ModuleNodeType>) {
  return (
    <>
      <AllHandles />
      <button
        type="button"
        aria-pressed={data.isSelected}
        title={data.description}
        className={cn(
          "cf-node",
          data.status === "planned" && "cf-node--planned",
          (data.isSelected || data.isCurrentStep) && "cf-node--active",
          data.isCurrentStep && "cf-node--current",
          data.isHighlighted && "cf-node--highlighted",
          data.isDimmed && "cf-dimmed",
        )}
      >
        <span className="cf-node__label">{data.label}</span>
        {data.status === "planned" && <span className="cf-node__status">planned</span>}
      </button>
    </>
  );
}
