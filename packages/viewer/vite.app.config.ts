import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Standalone app that loads ./codefloor.json next to index.html.
export default defineConfig({
  root: fileURLToPath(new URL("./app", import.meta.url)),
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@codefloor/schema": fileURLToPath(new URL("../schema/src/index.ts", import.meta.url)),
    },
  },
  build: { outDir: fileURLToPath(new URL("./dist-app", import.meta.url)), emptyOutDir: true },
});
