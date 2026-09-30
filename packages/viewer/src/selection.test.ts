import { expect, it } from "vitest";
import { readSelection, readView, toParams } from "./selection";
import { demo } from "./testDemo";

const q = (s: string) => new URLSearchParams(s);
const lastStep = (demo.flows.find((f) => f.id === "create-booking")?.steps.length ?? 0) - 1;

it("clamps an out-of-range step", () => {
  expect(readSelection(q("flow=create-booking&step=99"), demo)).toEqual({
    kind: "flow",
    flowId: "create-booking",
    stepIndex: lastStep,
  });
});

it("ignores unknown flows and nodes", () => {
  expect(readSelection(q("flow=ghost&node=ghost"), demo)).toBeNull();
});

it("treats a non-numeric step as the first", () => {
  expect(readSelection(q("step=abc&flow=create-booking"), demo)).toMatchObject({ stepIndex: 0 });
});

it("reads a node selection", () => {
  expect(readSelection(q("node=postgres"), demo)).toEqual({ kind: "node", id: "postgres" });
});

it("defaults to list view", () => {
  expect(readView(q(""))).toBe("list");
  expect(readView(q("view=diagram"))).toBe("diagram");
});

it("serializes view and flow selection", () => {
  expect(toParams("diagram", { kind: "flow", flowId: "x", stepIndex: 2 }).toString()).toBe(
    "view=diagram&flow=x&step=3",
  );
});
