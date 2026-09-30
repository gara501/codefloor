import { cpSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const FIXTURE = fileURLToPath(new URL("../test/fixtures/sample-app", import.meta.url));

/** Fresh writable copy of the sample app. */
export function copyFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "cf-fixture-"));
  cpSync(FIXTURE, dir, { recursive: true });
  return dir;
}
