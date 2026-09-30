import { Handle, Position } from "@xyflow/react";
import type { CSSProperties } from "react";

// Invisible source+target handles on every side so edges can leave from the side facing the other node.
const STYLE: CSSProperties = {
  width: 1,
  height: 1,
  minWidth: 0,
  minHeight: 0,
  border: "none",
  background: "transparent",
  opacity: 0,
  pointerEvents: "none",
};

const SIDES = [
  ["top", Position.Top],
  ["bottom", Position.Bottom],
  ["left", Position.Left],
  ["right", Position.Right],
] as const;

export function AllHandles() {
  return (
    <>
      {SIDES.flatMap(([side, position]) =>
        (["source", "target"] as const).map((type) => (
          <Handle
            key={`${side}-${type}`}
            id={`${side}-${type}`}
            type={type}
            position={position}
            isConnectable={false}
            style={STYLE}
          />
        )),
      )}
    </>
  );
}
