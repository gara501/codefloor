export type NodeStatus = "built" | "planned";
export type EdgeKind = "imports" | "calls" | "http" | "event" | "reads" | "writes";

export interface Layer {
  id: string;
  label: string;
  description?: string;
}

export interface ArchNode {
  id: string;
  label: string;
  layer: string;
  status: NodeStatus;
  /** Repo-relative paths or globs. */
  files?: string[];
  description: string;
}

export interface ArchEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  kind?: EdgeKind;
  status: NodeStatus;
}

export interface FlowStep {
  node: string;
  label: string;
  detail: string;
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
}

export interface CodefloorDoc {
  $schema?: string;
  name: string;
  description?: string;
  lastReviewed: string;
  layers: Layer[];
  nodes: ArchNode[];
  edges: ArchEdge[];
  flows: Flow[];
  /** nodeId -> content hash, used for incremental updates. */
  meta?: { sources?: Record<string, string> };
}
