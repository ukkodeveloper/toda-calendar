import { Hono } from "hono"
import { cors } from "hono/cors"
import { ZodError } from "zod"

import { type AppEnv, userContext } from "./context.js"
import {
  CORS_ALLOWED_HEADERS,
  CORS_ALLOWED_METHODS,
  makeOriginChecker,
} from "./cors.js"
import type { AppEnvConfig } from "./env.js"
import { AppError } from "./errors.js"
import { caseRoutes } from "./http/case.js"
import { healthRoutes } from "./http/health.js"
import { photoRoutes } from "./http/photo.js"
import { reportRoutes } from "./http/report.js"
import { roomRoutes } from "./http/room.js"
import { trialRoutes } from "./http/trial.js"
import { userRoutes } from "./http/user.js"

// Hono 앱 조립 — CORS → X-User-Uuid 컨텍스트 → 라우트 → 에러 매핑.
export function buildApp(config: AppEnvConfig): Hono<AppEnv> {
  const app = new Hono<AppEnv>()
  const isAllowed = makeOriginChecker(config.cors)

  app.use(
    "*",
    cors({
      origin: (origin) => (isAllowed(origin) ? origin : null),
      allowHeaders: CORS_ALLOWED_HEADERS,
      allowMethods: CORS_ALLOWED_METHODS,
    })
  )
  app.use("*", userContext)

  // 도메인 에러 → HTTP 매핑은 여기(바깥 계층)에서만.
  app.onError((err, c) => {
    if (err instanceof ZodError) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "요청 검증에 실패했습니다",
            details: err.issues,
          },
        },
        422
      )
    }
    if (err instanceof AppError) {
      return c.json(
        {
          error: {
            code: err.code,
            message: err.message,
            ...(err.details !== undefined ? { details: err.details } : {}),
          },
        },
        err.statusCode as 400
      )
    }
    console.error(err)
    return c.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "서버 오류" } },
      500
    )
  })

  // 헬스체크는 루트, 나머지는 /api.
  app.route("/", healthRoutes)
  app.route("/api", userRoutes)
  app.route("/api", roomRoutes)
  app.route("/api", caseRoutes)
  app.route("/api", reportRoutes)
  app.route("/api", trialRoutes)
  app.route("/api", photoRoutes)

  return app
}
