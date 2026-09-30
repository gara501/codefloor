import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Library build: ESM + extracted codefloor.css; runtime deps stay external.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    lib: { entry: "src/index.ts", formats: ["es"], fileName: "index", cssFileName: "codefloor" },
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^@xyflow\/react($|\/)/, "@codefloor/schema"],
    },
  },
});
