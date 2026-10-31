import path from "node:path";
import { defineConfig, defaultExclude } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: { exclude: [...defaultExclude, "e2e/**"] },
});
