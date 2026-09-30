import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";
import { expect, it } from "vitest";
import type { CodefloorDoc } from "./types.js";
import { validate } from "./validate.js";

const read = (rel: string) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8"));
const demo: CodefloorDoc = read("../../../examples/booking-platform/codefloor.json");
const schema = read("../schema.json");

it("demo passes validate() with no warnings", () => {
  expect(validate(demo)).toEqual({ ok: true, errors: [], warnings: [] });
});

it("demo passes the published JSON Schema", () => {
  const check = new Ajv2020({ allErrors: true }).compile(schema);
  expect(check(demo), JSON.stringify(check.errors)).toBe(true);
});

it("every demo flow has at least four steps", () => {
  for (const flow of demo.flows) expect(flow.steps.length).toBeGreaterThanOrEqual(4);
});
