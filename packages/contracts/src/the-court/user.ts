import { z } from "zod"

import { userTitleSchema } from "./enums.js"

// POST /users — 유저 생성(서버가 uuid 발급).
export const createUserRequestSchema = z.object({
  nickname: z.string().trim().min(1).max(40),
  color: z.string().trim().min(1).max(20), // hex 등
})

export const userResponseSchema = z.object({
  uuid: z.string(),
  nickname: z.string(),
  color: z.string(),
})

// GET /users/nickname — 랜덤 닉네임(형용사+명사) 미리보기.
export const nicknameResponseSchema = z.object({
  nickname: z.string(),
  color: z.string(),
})

// 메시지·참여자에 얹히는 작성자 요약 — title 은 "방별" 칭호.
export const userSummarySchema = z.object({
  uuid: z.string(),
  nickname: z.string(),
  title: userTitleSchema,
  color: z.string(),
})

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>
export type UserResponse = z.infer<typeof userResponseSchema>
export type NicknameResponse = z.infer<typeof nicknameResponseSchema>
export type UserSummary = z.infer<typeof userSummarySchema>
