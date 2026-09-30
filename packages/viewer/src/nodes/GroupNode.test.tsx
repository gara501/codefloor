import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { expect, it } from "vitest";
import { GroupNode } from "./GroupNode";

type Props = ComponentProps<typeof GroupNode>;
const props = (label: string) =>
  ({ data: { label, count: 3, width: 100, height: 80, isDimmed: false } }) as unknown as Props;

it("labels folder groups", () => {
  render(<GroupNode {...props("features")} />);
  expect(screen.getByText("features")).toBeInTheDocument();
});

it("leaves the catch-all group unlabeled", () => {
  const { container } = render(<GroupNode {...props("other")} />);
  expect(container.textContent).toBe("");
});
