import { resolve } from "node:path"

import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@workspace/app-core": resolve(__dirname, "../../packages/app-core/src/index.ts"),
      "@workspace/contracts": resolve(__dirname, "../../packages/contracts/src/index.ts"),
    },
  },
  test: {
    coverage: {
      exclude: ["src/index.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html"],
    },
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
})
