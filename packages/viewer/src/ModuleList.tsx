import type { ArchNode, CodefloorDoc } from "@codefloor/schema";
import { useEffect, useRef } from "react";
import { cn } from "./cn";
import { NodeDetailCard } from "./NodeDetailCard";
import { getDegreeById, getNodeConnections, getNodeFlows } from "./selectors";

export interface ModuleListProps {
  doc: CodefloorDoc;
  nodesById: Record<string, ArchNode>;
  selectedNodeId: string | null;
  currentStepNodeId: string | null;
  onSelectNode: (id: string) => void;
  onPlayFlow: (flowId: string, stepIndex: number) => void;
}

/** Modules grouped by layer; a row expands its detail in place. */
export function ModuleList({
  doc,
  nodesById,
  selectedNodeId,
  currentStepNodeId,
  onSelectNode,
  onPlayFlow,
}: ModuleListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const degreeById = getDegreeById(doc);
  const focusId = currentStepNodeId ?? selectedNodeId;

  useEffect(() => {
    if (!focusId) return;
    const row = containerRef.current?.querySelector<HTMLElement>(
      `[data-node-id="${CSS.escape(focusId)}"]`,
    );
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    row?.scrollIntoView?.({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [focusId]);

  return (
    <div ref={containerRef} className="cf-list">
      <div className="cf-list__inner">
        {doc.layers.map((layer) => {
          const layerNodes = doc.nodes.filter((n) => n.layer === layer.id);
          if (layerNodes.length === 0) return null;
          return (
            <section key={layer.id} aria-label={layer.label}>
              <h2 className="cf-eyebrow">{layer.label}</h2>
              <ul className="cf-rows">
                {layerNodes.map((node) => {
                  const expanded = selectedNodeId === node.id;
                  const current = currentStepNodeId === node.id;
                  return (
                    <li key={node.id} data-node-id={node.id}>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => onSelectNode(node.id)}
                        className={cn("cf-row-btn", current && "cf-row-btn--current")}
                      >
                        <span className="cf-row cf-min0">
                          <span
                            aria-hidden="true"
                            className={cn("cf-dot", node.status === "planned" && "cf-dot--planned")}
                          />
                          <span className="cf-strong cf-truncate">{node.label}</span>
                          {node.status === "planned" && (
                            <span className="cf-muted cf-small">planned</span>
                          )}
                        </span>
                        <span className="cf-row cf-min0">
                          {node.files?.[0] && (
                            <span className="cf-mono cf-muted cf-truncate cf-hide-sm">
                              {node.files[0]}
                            </span>
                          )}
                          <span title="Connections" className="cf-badge">
                            {degreeById[node.id] ?? 0}
                            <span className="cf-sr-only"> connections</span>
                          </span>
                        </span>
                      </button>
                      {expanded && (
                        <div className="cf-fade-in">
                          <NodeDetailCard
                            inline
                            node={node}
                            connections={getNodeConnections(node.id, doc, nodesById)}
                            flows={getNodeFlows(node.id, doc)}
                            onSelectNode={onSelectNode}
                            onPlayFlow={onPlayFlow}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
