import type { NicknameResponse, UserResponse } from "@workspace/contracts"
import { createUserRequestSchema } from "@workspace/contracts"
import { Hono } from "hono"

import type { AppEnv } from "../context.js"
import { prisma } from "../db.js"
import { generateNickname, randomColor } from "../domain/generate.js"
import { notFound } from "../errors.js"

// 유저 — 로그인 없음. 서버가 uuid 발급, 클라 localStorage 저장.
export const userRoutes = new Hono<AppEnv>()

// POST /api/users — 유저 생성.
userRoutes.post("/users", async (c) => {
  const body = createUserRequestSchema.parse(await c.req.json())
  const user = await prisma.user.create({
    data: { nickname: body.nickname, color: body.color },
  })
  return c.json(
    {
      uuid: user.uuid,
      nickname: user.nickname,
      color: user.color,
    } satisfies UserResponse,
    201
  )
})

// GET /api/users/nickname — 랜덤 닉네임(형용사+명사) 미리보기.
userRoutes.get("/users/nickname", (c) => {
  return c.json({
    nickname: generateNickname(),
    color: randomColor(),
  } satisfies NicknameResponse)
})

// GET /api/users/:uuid — 조회.
userRoutes.get("/users/:uuid", async (c) => {
  const uuid = c.req.param("uuid")
  const user = await prisma.user.findUnique({ where: { uuid } })
  if (!user) throw notFound("USER_NOT_FOUND", "유저를 찾을 수 없습니다")
  return c.json({
    uuid: user.uuid,
    nickname: user.nickname,
    color: user.color,
  } satisfies UserResponse)
})
