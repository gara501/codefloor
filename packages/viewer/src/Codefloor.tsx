import { type ArchNode, type CodefloorDoc, validate } from "@codefloor/schema";
import { type Edge, MarkerType, type NodeMouseHandler } from "@xyflow/react";
import { useEffect, useEffectEvent, useMemo, useRef } from "react";
import "./codefloor.css";
import { cn } from "./cn";
import { Diagram, type DiagramNode } from "./Diagram";
import { FlowBar } from "./FlowBar";
import type { FlowHopEdgeType, FlowHopState } from "./FlowHopEdge";
import { layoutArchitecture, pickEdgeHandles } from "./layout";
import { ModuleList } from "./ModuleList";
import { ModuleSearch } from "./ModuleSearch";
import { NodeDetailCard } from "./NodeDetailCard";
import type { Selection, ViewMode } from "./selection";
import { getNodeConnections, getNodeFlows } from "./selectors";
import { useSelectionState } from "./useSelectionState";
import { ValidationErrors } from "./ValidationErrors";

export interface CodefloorProps {
  /** A codefloor/v1 document; validated before rendering. */
  data: unknown;
  theme?: "light" | "dark" | "system";
  /** Mirror view and selection to the URL query string. */
  urlState?: boolean;
  className?: string;
  /** Defaults to the document name. */
  title?: string;
}

export function Codefloor({
  data,
  theme = "system",
  urlState = false,
  className,
  title,
}: CodefloorProps) {
  const result = useMemo(() => validate(data), [data]);
  return (
    <div className={cn("cf-root", className)} data-cf-theme={theme}>
      {result.ok ? (
        <Explorer doc={data as CodefloorDoc} urlState={urlState} title={title} />
      ) : (
        <ValidationErrors issues={result.errors} />
      )}
    </div>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

function Explorer({
  doc,
  urlState,
  title,
}: {
  doc: CodefloorDoc;
  urlState: boolean;
  title?: string;
}) {
  const layout = useMemo(() => layoutArchitecture(doc), [doc]);
  const nodesById = useMemo(() => {
    const byId: Record<string, ArchNode> = {};
    for (const node of doc.nodes) byId[node.id] = node;
    return byId;
  }, [doc]);
  const { view, selection, write } = useSelectionState(doc, urlState);
  const flowsRef = useRef<HTMLDetailsElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const activeFlow =
    selection?.kind === "flow" ? (doc.flows.find((f) => f.id === selection.flowId) ?? null) : null;
  const stepIndex = selection?.kind === "flow" ? selection.stepIndex : 0;
  const currentStepNodeId = activeFlow?.steps[stepIndex]?.node ?? null;
  const selectedNodeId = selection?.kind === "node" ? selection.id : null;
  const selectedNode = selectedNodeId ? nodesById[selectedNodeId] : undefined;

  const highlightedNodeIds = useMemo(() => {
    if (selectedNodeId) {
      const ids = new Set<string>([selectedNodeId]);
      for (const e of doc.edges) {
        if (e.from === selectedNodeId) ids.add(e.to);
        if (e.to === selectedNodeId) ids.add(e.from);
      }
      return ids;
    }
    return activeFlow ? new Set(activeFlow.steps.map((s) => s.node)) : null;
  }, [doc, selectedNodeId, activeFlow]);

  // During a flow every document edge dims; the path is drawn by hop edges.
  const highlightedEdgeIds = useMemo(() => {
    if (selectedNodeId) {
      return new Set(
        doc.edges
          .filter((e) => e.from === selectedNodeId || e.to === selectedNodeId)
          .map((e) => e.id),
      );
    }
    return activeFlow ? new Set<string>() : null;
  }, [doc, selectedNodeId, activeFlow]);

  const focusNodeIds = useMemo(() => {
    if (selectedNodeId && highlightedNodeIds) return [...highlightedNodeIds];
    if (activeFlow && currentStepNodeId) {
      const prev = activeFlow.steps[stepIndex - 1]?.node;
      return prev && prev !== currentStepNodeId ? [prev, currentStepNodeId] : [currentStepNodeId];
    }
    return null;
  }, [selectedNodeId, highlightedNodeIds, activeFlow, currentStepNodeId, stepIndex]);

  const flowNodes = useMemo<DiagramNode[]>(() => {
    const modules: DiagramNode[] = doc.nodes.map((node) => {
      const isHighlighted = highlightedNodeIds?.has(node.id) ?? false;
      return {
        id: node.id,
        type: "module",
        position: layout.nodePositions[node.id] ?? { x: 0, y: 0 },
        draggable: false,
        connectable: false,
        data: {
          label: node.label,
          status: node.status,
          description: node.description,
          isSelected: selectedNodeId === node.id,
          isCurrentStep: currentStepNodeId === node.id,
          isHighlighted,
          isDimmed: highlightedNodeIds !== null && !isHighlighted,
        },
      };
    });
    const labels: DiagramNode[] = doc.layers.map((layer) => ({
      id: `layer-label-${layer.id}`,
      type: "layerLabel",
      position: layout.layerLabelPositions[layer.id] ?? { x: 0, y: 0 },
      draggable: false,
      selectable: false,
      connectable: false,
      data: { label: layer.label },
    }));
    const groups: DiagramNode[] = layout.groups.map((group) => {
      const rect = layout.groupRects[group.id] ?? { x: 0, y: 0, width: 0, height: 0 };
      return {
        id: `group-${group.id}`,
        type: "folder",
        position: { x: rect.x, y: rect.y },
        draggable: false,
        selectable: false,
        connectable: false,
        focusable: false,
        zIndex: -1,
        style: { pointerEvents: "none" },
        data: {
          label: group.label,
          count: group.nodeIds.length,
          width: rect.width,
          height: rect.height,
          isDimmed:
            highlightedNodeIds !== null && !group.nodeIds.some((id) => highlightedNodeIds.has(id)),
        },
      };
    });
    return [...groups, ...labels, ...modules];
  }, [doc, layout, selectedNodeId, currentStepNodeId, highlightedNodeIds]);

  const edges = useMemo<Edge[]>(() => {
    const docEdges: Edge[] = doc.edges.map((edge) => {
      const handles = pickEdgeHandles(layout, edge, nodesById);
      const isHighlighted = highlightedEdgeIds?.has(edge.id) ?? false;
      const isDimmed = highlightedEdgeIds !== null && !isHighlighted;
      const color =
        edge.status === "planned"
          ? isHighlighted
            ? "var(--cf-primary)"
            : "var(--cf-border-strong)"
          : isHighlighted
            ? "var(--cf-primary)"
            : "var(--cf-edge)";
      return {
        id: edge.id,
        source: edge.from,
        target: edge.to,
        ...handles,
        type: "smoothstep",
        animated: isHighlighted,
        label: isHighlighted ? (edge.label ?? edge.kind) : undefined,
        labelStyle: { fill: "var(--cf-fg)", fontSize: 10 },
        labelBgStyle: { fill: "var(--cf-card)", fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
        style: {
          stroke: color,
          strokeWidth: isHighlighted ? 2 : 1,
          strokeOpacity: isDimmed ? 0.15 : 1,
          strokeDasharray: edge.status === "planned" ? "4 3" : undefined,
        },
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color },
      };
    });
    if (!activeFlow) return docEdges;
    const hops: FlowHopEdgeType[] = [];
    activeFlow.steps.forEach((step, i) => {
      const next = activeFlow.steps[i + 1];
      if (!next || next.node === step.node) return;
      const state: FlowHopState =
        i < stepIndex - 1 ? "done" : i === stepIndex - 1 ? "active" : "upcoming";
      hops.push({
        id: `flow-hop-${i}`,
        type: "flowHop",
        source: step.node,
        target: next.node,
        ...pickEdgeHandles(layout, { from: step.node, to: next.node }, nodesById),
        zIndex: 1,
        data: { state },
      });
    });
    return [...docEdges, ...hops];
  }, [doc, layout, nodesById, highlightedEdgeIds, activeFlow, stepIndex]);

  const setView = (next: ViewMode) => write(next, selection, true);
  const toggleNode = (id: string) =>
    write(view, selectedNodeId === id ? null : { kind: "node", id });
  const focusNode = (id: string) => {
    if (selectedNodeId !== id) write(view, { kind: "node", id });
  };
  const selectFlow = (flowId: string, startIndex = 0) => {
    write(view, { kind: "flow", flowId, stepIndex: startIndex });
    if (flowsRef.current) flowsRef.current.open = false;
  };
  const goToStep = (index: number) => {
    if (!activeFlow) return;
    const clamped = Math.min(Math.max(index, 0), activeFlow.steps.length - 1);
    if (clamped !== stepIndex)
      write(view, { kind: "flow", flowId: activeFlow.id, stepIndex: clamped }, true);
  };
  const clearSelection = () => {
    if (selection) write(view, null as Selection);
  };

  // ←/→ step a flow, Esc clears, "/" focuses search.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey) return;
    if (event.key === "/") {
      event.preventDefault();
      searchRef.current?.focus();
    } else if (event.key === "Escape") clearSelection();
    else if (activeFlow && event.key === "ArrowRight") goToStep(stepIndex + 1);
    else if (activeFlow && event.key === "ArrowLeft") goToStep(stepIndex - 1);
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // Stop propagation so the pane click underneath doesn't clear the selection.
  const onNodeClick: NodeMouseHandler = (event, node) => {
    event.stopPropagation();
    if (node.type === "module") toggleNode(node.id);
  };

  return (
    <div className="cf-shell">
      <header className="cf-header">
        <div className="cf-min0">
          <h1 className="cf-title">{title ?? doc.name}</h1>
          <p className="cf-muted cf-small cf-measure">
            {doc.description ??
              "Click a module to see what it connects to, or pick a flow to walk it step by step."}{" "}
            Last reviewed {doc.lastReviewed}.
          </p>
          <div className="cf-row cf-small cf-muted cf-mt">
            <span className="cf-row">
              <span aria-hidden="true" className="cf-dot" /> Built
            </span>
            <span className="cf-row">
              <span aria-hidden="true" className="cf-dot cf-dot--planned" /> Planned
            </span>
          </div>
        </div>
        <div className="cf-row cf-wrap">
          <ModuleSearch ref={searchRef} nodes={doc.nodes} onSelect={focusNode} />
          <fieldset className="cf-segmented">
            <legend className="cf-sr-only">View</legend>
            {(
              [
                ["list", "List"],
                ["diagram", "Diagram"],
              ] as const
            ).map(([v, label]) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                {label}
              </button>
            ))}
          </fieldset>
          <details ref={flowsRef} className="cf-relative">
            <summary className="cf-btn">{activeFlow ? activeFlow.name : "Flows"}</summary>
            <div className="cf-popover cf-popover--flows">
              {doc.flows.length === 0 ? (
                <p className="cf-muted cf-small">No flows defined</p>
              ) : (
                <>
                  <p className="cf-muted cf-small">Walk a path step by step.</p>
                  {doc.flows.map((flow) => (
                    <button
                      key={flow.id}
                      type="button"
                      aria-pressed={activeFlow?.id === flow.id}
                      aria-label={flow.name}
                      onClick={() => selectFlow(flow.id)}
                      className="cf-option"
                    >
                      <span className="cf-row cf-row--between cf-strong">
                        {flow.name}
                        <span className="cf-muted cf-small">{flow.steps.length} steps</span>
                      </span>
                      <span className="cf-muted cf-small cf-clamp">{flow.description}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </details>
        </div>
      </header>

      <div className="cf-body">
        <div key={view} className="cf-fill cf-fade-in">
          {view === "list" ? (
            <ModuleList
              doc={doc}
              nodesById={nodesById}
              selectedNodeId={selectedNodeId}
              currentStepNodeId={currentStepNodeId}
              onSelectNode={toggleNode}
              onPlayFlow={selectFlow}
            />
          ) : (
            <Diagram
              nodes={flowNodes}
              edges={edges}
              onNodeClick={onNodeClick}
              onPaneClick={clearSelection}
              focusNodeIds={focusNodeIds}
              overlay={
                selectedNode && (
                  <NodeDetailCard
                    node={selectedNode}
                    connections={getNodeConnections(selectedNode.id, doc, nodesById)}
                    flows={getNodeFlows(selectedNode.id, doc)}
                    onSelectNode={focusNode}
                    onPlayFlow={selectFlow}
                    onClose={clearSelection}
                  />
                )
              }
            />
          )}
        </div>
        {activeFlow && (
          <FlowBar
            flow={activeFlow}
            stepIndex={stepIndex}
            nodesById={nodesById}
            onStep={goToStep}
            onClose={clearSelection}
          />
        )}
      </div>
    </div>
  );
}
