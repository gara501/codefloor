import type { ArchNode, Flow } from "@codefloor/schema";
import { cn } from "./cn";

export interface FlowBarProps {
  flow: Flow;
  stepIndex: number;
  nodesById: Record<string, ArchNode>;
  onStep: (index: number) => void;
  onClose: () => void;
}

export function FlowBar({ flow, stepIndex, nodesById, onStep, onClose }: FlowBarProps) {
  const step = flow.steps[stepIndex];
  if (!step) return null;
  const last = flow.steps.length - 1;
  return (
    <div className="cf-flowbar">
      <div className="cf-card cf-flowbar__card cf-slide-up">
        <div className="cf-row cf-row--between">
          <div className="cf-min0">
            <p className="cf-strong cf-truncate">{flow.name}</p>
            <p className="cf-muted cf-small">
              Step {stepIndex + 1} of {flow.steps.length}
              <span className="cf-hide-sm"> · ← → to step</span>
            </p>
          </div>
          <div className="cf-row">
            <button
              type="button"
              className="cf-btn"
              onClick={() => onStep(stepIndex - 1)}
              disabled={stepIndex === 0}
            >
              Previous
            </button>
            <button
              type="button"
              className="cf-btn"
              onClick={() => onStep(stepIndex + 1)}
              disabled={stepIndex === last}
            >
              Next
            </button>
            <button type="button" className="cf-icon-btn" onClick={onClose} aria-label="Close flow">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>
        <div className="cf-track">
          <div className="cf-track__line" />
          <div
            className="cf-track__fill"
            style={{ width: `calc((100% - 1.25rem) * ${stepIndex / Math.max(last, 1)})` }}
          />
          {flow.steps.map((s, index) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: static list; steps may repeat a node
              key={`${flow.id}-${index}-${s.node}`}
              type="button"
              aria-current={index === stepIndex ? "step" : undefined}
              aria-label={`Step ${index + 1}: ${s.label}`}
              onClick={() => onStep(index)}
              className={cn(
                "cf-step-dot",
                index === stepIndex && "cf-step-dot--current",
                index < stepIndex && "cf-step-dot--done",
              )}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <div key={stepIndex} className="cf-fade-in">
          <p className="cf-mt">{step.label}</p>
          <p className="cf-muted cf-small">{step.detail}</p>
          <p className="cf-mono cf-primary">{nodesById[step.node]?.label ?? step.node}</p>
        </div>
      </div>
    </div>
  );
}
