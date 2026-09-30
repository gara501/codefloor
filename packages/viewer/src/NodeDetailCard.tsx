import type { ArchNode } from "@codefloor/schema";
import { cn } from "./cn";
import type { NodeConnection, NodeFlow } from "./selectors";

export interface NodeDetailCardProps {
  node: ArchNode;
  connections: NodeConnection[];
  flows: NodeFlow[];
  onSelectNode: (id: string) => void;
  onPlayFlow: (flowId: string, stepIndex: number) => void;
  onClose?: () => void;
  inline?: boolean;
}

export function NodeDetailCard({
  node,
  connections,
  flows,
  onSelectNode,
  onPlayFlow,
  onClose,
  inline = false,
}: NodeDetailCardProps) {
  return (
    <div className={cn("cf-card", inline && "cf-card--inline")}>
      <div className="cf-row cf-row--between">
        <p className="cf-strong">{node.label}</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="cf-icon-btn"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        )}
      </div>
      {node.files && node.files.length > 0 && (
        <p className="cf-mono cf-muted">{node.files.join(", ")}</p>
      )}
      <p className="cf-muted cf-mt">{node.description}</p>
      {connections.length > 0 && (
        <dl className="cf-section cf-connections">
          {connections.map((c) => (
            <div key={c.edgeId} className="cf-row cf-wrap">
              <dt className="cf-muted">
                {c.direction === "out" ? "→" : "←"} {c.label}
              </dt>
              <dd>
                <button type="button" onClick={() => onSelectNode(c.otherId)} className="cf-link">
                  {c.otherLabel}
                </button>
                {c.status === "planned" && <span className="cf-muted"> (planned)</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {flows.length > 0 && (
        <div className="cf-section">
          <p className="cf-muted">Flows through this module</p>
          <div className="cf-row cf-wrap cf-mt">
            {flows.map((f) => (
              <button
                key={f.flowId}
                type="button"
                onClick={() => onPlayFlow(f.flowId, f.stepIndex)}
                className="cf-chip"
              >
                <span aria-hidden="true">▶ </span>
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
