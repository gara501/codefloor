import { expect, it } from "vitest";
import { loadDoc } from "./loadDoc";

const respond = (status: number, body: string) => async () => new Response(body, { status });

it("returns the parsed document", async () => {
  expect(await loadDoc(respond(200, '{"name":"x"}'))).toEqual({ ok: true, doc: { name: "x" } });
});

it("explains a missing file", async () => {
  const r = await loadDoc(respond(404, "nope"));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.message).toContain("codefloor.json not found");
});

it("explains invalid JSON", async () => {
  const r = await loadDoc(respond(200, "{oops"));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.message).toContain("not valid JSON");
});
