import type { Context, MiddlewareHandler } from "hono"

import { unauthorized } from "./errors.js"

// 요청 컨텍스트에 userUuid 를 일급으로. 인증 없음 — 헤더 식별만(데모).
export type AppEnv = {
  Variables: {
    userUuid: string | null
  }
}

// 모든 요청에서 X-User-Uuid 를 읽어 컨텍스트에 싣는다(없으면 null).
export const userContext: MiddlewareHandler<AppEnv> = async (c, next) => {
  const uuid = c.req.header("X-User-Uuid")?.trim()
  c.set("userUuid", uuid && uuid.length > 0 ? uuid : null)
  await next()
}

// 보호 경로에서 신원 강제. 소유권 확인(이 유저가 이 리소스?)은 각 유스케이스에서 별도.
export function requireUser(c: Context<AppEnv>): string {
  const uuid = c.get("userUuid")
  if (!uuid) throw unauthorized()
  return uuid
}
