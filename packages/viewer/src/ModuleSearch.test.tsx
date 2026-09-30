import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ModuleSearch } from "./ModuleSearch";
import { demo } from "./testDemo";

it("filters by label and picks the active result with Enter", async () => {
  const onSelect = vi.fn();
  render(<ModuleSearch nodes={demo.nodes} onSelect={onSelect} />);
  await userEvent.type(screen.getByRole("combobox", { name: "Search modules" }), "pay");
  const options = screen.getAllByRole("option").map((o) => o.textContent);
  expect(options).toEqual([
    expect.stringContaining("Payments service"),
    expect.stringContaining("Payment provider"),
  ]);
  await userEvent.keyboard("{Enter}");
  expect(onSelect).toHaveBeenCalledWith("payments-service");
});
