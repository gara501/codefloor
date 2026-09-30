import type { CodefloorDoc } from "@codefloor/schema";

export type ViewMode = "list" | "diagram";

export type Selection =
  | { kind: "node"; id: string }
  | { kind: "flow"; flowId: string; stepIndex: number }
  | null;

export function readView(params: URLSearchParams): ViewMode {
  return params.get("view") === "diagram" ? "diagram" : "list";
}

export function readSelection(params: URLSearchParams, doc: CodefloorDoc): Selection {
  const flow = doc.flows.find((f) => f.id === params.get("flow"));
  if (flow && flow.steps.length > 0) {
    const step = Number.parseInt(params.get("step") ?? "1", 10);
    const stepIndex = Number.isNaN(step)
      ? 0
      : Math.min(Math.max(step - 1, 0), flow.steps.length - 1);
    return { kind: "flow", flowId: flow.id, stepIndex };
  }
  const nodeId = params.get("node");
  return nodeId && doc.nodes.some((n) => n.id === nodeId) ? { kind: "node", id: nodeId } : null;
}

export function toParams(view: ViewMode, selection: Selection): URLSearchParams {
  const params = new URLSearchParams();
  if (view === "diagram") params.set("view", "diagram");
  if (selection?.kind === "node") params.set("node", selection.id);
  if (selection?.kind === "flow") {
    params.set("flow", selection.flowId);
    params.set("step", String(selection.stepIndex + 1));
  }
  return params;
}
