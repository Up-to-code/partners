import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    include: ["scripts/*.test.mjs", "lib/**/*.test.ts", "convex/**/*.test.ts", "utilities/**/*.test.ts", "validation/**/*.test.ts"],
    environment: "node",
  },
});
