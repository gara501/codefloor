import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@codefloor/schema": fileURLToPath(new URL("../schema/src/index.ts", import.meta.url)),
    },
  },
  test: { name: "viewer", environment: "jsdom", setupFiles: ["./src/test-setup.ts"] },
});
