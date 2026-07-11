import { Hono } from "hono"

import type { AppEnv } from "../context.js"

// GET /health — Railway 헬스체크.
export const healthRoutes = new Hono<AppEnv>()

healthRoutes.get("/health", (c) => c.json({ status: "ok" }))
