import { createUserRequestSchema } from "@workspace/contracts"
import { Hono } from "hono"

import type { AppEnv } from "../context.js"
import { notImplemented } from "../errors.js"

// 유저 — 로그인 없음. 서버가 uuid 발급, 클라 localStorage 저장.
export const userRoutes = new Hono<AppEnv>()

// POST /api/users — 유저 생성 → userResponseSchema
userRoutes.post("/users", async (c) => {
  const body = createUserRequestSchema.parse(await c.req.json())
  void body
  // TODO(슬라이스 02): prisma.user.create → userResponseSchema
  throw notImplemented("POST /api/users")
})

// GET /api/users/nickname — 랜덤 닉네임(형용사+명사) → nicknameResponseSchema
userRoutes.get("/users/nickname", (c) => {
  void c
  // TODO(슬라이스 02): 닉네임 생성기 → nicknameResponseSchema
  throw notImplemented("GET /api/users/nickname")
})

// GET /api/users/:uuid — 조회 → userResponseSchema
userRoutes.get("/users/:uuid", (c) => {
  const uuid = c.req.param("uuid")
  void uuid
  // TODO(슬라이스 02): prisma.user.findUnique → userResponseSchema (없으면 404 USER_NOT_FOUND)
  throw notImplemented("GET /api/users/:uuid")
})
