import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Codefloor } from "./Codefloor";
import { demo } from "./testDemo";

const createBooking = demo.flows.find((f) => f.id === "create-booking");
const steps = createBooking?.steps.length ?? 0;

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("Codefloor", () => {
  it("renders the title and one region per layer", () => {
    render(<Codefloor data={demo} />);
    expect(screen.getByRole("heading", { level: 1, name: demo.name })).toBeInTheDocument();
    for (const layer of demo.layers) {
      expect(screen.getByRole("region", { name: layer.label })).toBeInTheDocument();
    }
  });

  it("expands a module row with its details", async () => {
    render(<Codefloor data={demo} />);
    const row = screen.getByRole("button", { name: /^Booking service/ });
    await userEvent.click(row);
    expect(row).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Flows through this module")).toBeInTheDocument();
  });

  it("walks a flow with the keyboard and closes it with Escape", async () => {
    const user = userEvent.setup();
    render(<Codefloor data={demo} />);
    await user.click(screen.getByText("Flows"));
    await user.click(screen.getByRole("button", { name: "Create booking" }));
    expect(screen.getByText(`Step 1 of ${steps}`)).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText(`Step 2 of ${steps}`)).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByText(/Step \d+ of/)).not.toBeInTheDocument();
  });

  it("shows validation issues instead of crashing on bad data", () => {
    render(<Codefloor data={{ nodes: 3 }} />);
    const alert = screen.getByRole("alert");
    expect(within(alert).getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("handles a document without flows or edges", async () => {
    const user = userEvent.setup();
    render(<Codefloor data={{ ...demo, flows: [], edges: [] }} />);
    await user.click(screen.getByText("Flows"));
    expect(screen.getByText("No flows defined")).toBeInTheDocument();
  });

  it("restores the selection from the URL when urlState is on", () => {
    window.history.replaceState(null, "", "/?node=postgres");
    render(<Codefloor data={demo} urlState />);
    expect(screen.getByRole("button", { name: /^Postgres/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("writes the selection to the URL when urlState is on", async () => {
    render(<Codefloor data={demo} urlState />);
    await userEvent.click(screen.getByRole("button", { name: /^Redis/ }));
    expect(window.location.search).toBe("?node=redis-cache");
  });

  it("draws modules in the minimap", async () => {
    const { container } = render(<Codefloor data={demo} />);
    await userEvent.click(screen.getByRole("button", { name: "Diagram" }));
    expect(container.querySelectorAll(".react-flow__minimap-node").length).toBe(demo.nodes.length);
  });

  it("switches to the diagram view", async () => {
    const { container } = render(<Codefloor data={demo} />);
    await userEvent.click(screen.getByRole("button", { name: "Diagram" }));
    expect(container.querySelector(".react-flow")).not.toBeNull();
  });
});

describe("Codefloor embedding", () => {
  it("keeps the host page's own query params", async () => {
    window.history.replaceState(null, "", "/?tab=arch");
    render(<Codefloor data={demo} urlState />);
    await userEvent.click(screen.getByRole("button", { name: /^Redis/ }));
    expect(window.location.search).toBe("?tab=arch&node=redis-cache");
  });

  it("ignores shortcuts while focus is outside the explorer", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">host</button>
        <Codefloor data={demo} />
      </>,
    );
    const row = screen.getByRole("button", { name: /^Postgres/ });
    await user.click(row);
    screen.getByRole("button", { name: "host" }).focus();
    await user.keyboard("{Escape}");
    expect(row).toHaveAttribute("aria-expanded", "true");
  });
});
