import type { Context, MiddlewareHandler } from "hono"

import { prisma } from "./db.js"
import { unauthorized, userNotFound } from "./errors.js"

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

// User 를 FK 로 쓰는 authed write 에서 신원 강제 + DB 존재까지 확인.
// 헤더만 있고 실존 유저가 아니면(stale uuid) FK 위반(P2003)→500 이 되기 전에 401 로 끊는다.
// GET(읽기 전용)엔 불필요 — requireUser 로 충분.
export async function requireExistingUser(c: Context<AppEnv>): Promise<string> {
  const uuid = requireUser(c)
  const user = await prisma.user.findUnique({
    where: { uuid },
    select: { uuid: true },
  })
  if (!user) throw userNotFound()
  return uuid
}
