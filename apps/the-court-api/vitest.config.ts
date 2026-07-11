import { resolve } from "node:path"

import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      // 소스 직접 참조 — 테스트에 dist 빌드 불필요.
      "@workspace/contracts": resolve(
        __dirname,
        "../../packages/contracts/src/index.ts"
      ),
      "@workspace/app-core": resolve(
        __dirname,
        "../../packages/app-core/src/index.ts"
      ),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
})
