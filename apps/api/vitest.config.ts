import { defineConfig } from "vitest/config"

export default defineConfig({
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
