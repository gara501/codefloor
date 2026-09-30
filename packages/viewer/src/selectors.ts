import type { ArchEdge, ArchNode, CodefloorDoc } from "@codefloor/schema";

export interface NodeConnection {
  edgeId: string;
  direction: "in" | "out";
  label: string;
  status: ArchEdge["status"];
  otherId: string;
  otherLabel: string;
}

export interface NodeFlow {
  flowId: string;
  name: string;
  /** First step at this node. */
  stepIndex: number;
}

export function getDegreeById(doc: CodefloorDoc): Record<string, number> {
  const degree: Record<string, number> = {};
  for (const edge of doc.edges) {
    degree[edge.from] = (degree[edge.from] ?? 0) + 1;
    degree[edge.to] = (degree[edge.to] ?? 0) + 1;
  }
  return degree;
}

export function getNodeFlows(nodeId: string, doc: CodefloorDoc): NodeFlow[] {
  return doc.flows.flatMap((flow) => {
    const stepIndex = flow.steps.findIndex((step) => step.node === nodeId);
    return stepIndex === -1 ? [] : [{ flowId: flow.id, name: flow.name, stepIndex }];
  });
}

export function getNodeConnections(
  nodeId: string,
  doc: CodefloorDoc,
  nodesById: Record<string, ArchNode>,
): NodeConnection[] {
  return doc.edges
    .filter((edge) => edge.from === nodeId || edge.to === nodeId)
    .map((edge) => {
      const out = edge.from === nodeId;
      const otherId = out ? edge.to : edge.from;
      return {
        edgeId: edge.id,
        direction: out ? "out" : "in",
        label: edge.label ?? edge.kind ?? "",
        status: edge.status,
        otherId,
        otherLabel: nodesById[otherId]?.label ?? otherId,
      };
    });
}
