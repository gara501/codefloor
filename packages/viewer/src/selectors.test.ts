import { expect, it } from "vitest";
import { getDegreeById, getNodeConnections, getNodeFlows } from "./selectors";
import { demo } from "./testDemo";

const byId = Object.fromEntries(demo.nodes.map((n) => [n.id, n]));

it("counts edges touching a node", () => {
  expect(getDegreeById(demo)["email-provider"]).toBe(1);
});

it("lists flows through a node with the first step index", () => {
  expect(getNodeFlows("auth-service", demo)).toEqual([
    { flowId: "create-booking", name: "Create booking", stepIndex: 2 },
  ]);
});

it("describes connections from the node's point of view", () => {
  const c = getNodeConnections("email-provider", demo, byId);
  expect(c).toEqual([
    {
      edgeId: "notifications-service->email-provider",
      direction: "in",
      label: "send email",
      status: "built",
      otherId: "notifications-service",
      otherLabel: "Notifications service",
    },
  ]);
});

it("falls back to the edge kind when there is no label", () => {
  const doc = {
    ...demo,
    edges: [
      {
        id: "e",
        from: "web-app",
        to: "api-gateway",
        kind: "http" as const,
        status: "built" as const,
      },
    ],
  };
  expect(getNodeConnections("web-app", doc, byId)[0]?.label).toBe("http");
});
