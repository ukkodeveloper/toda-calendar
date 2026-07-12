import { Hono } from "hono"

import type { AppEnv } from "../context.js"
import { prisma } from "../db.js"

// GET /health — Railway 헬스체크(readiness). DB 핑(SELECT 1)까지 확인해
// DB 미연결 상태를 살아있다고 오판하지 않는다. 실패 시 503.
export const healthRoutes = new Hono<AppEnv>()

healthRoutes.get("/health", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return c.json({ status: "ok" })
  } catch {
    return c.json({ status: "degraded", db: "down" }, 503)
  }
})
