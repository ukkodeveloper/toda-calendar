import { z } from "zod"

import { userSummarySchema } from "./user.js"

// 메시지 타입 — USER=일반/재판 발언, SYSTEM=시스템 알림(고발·공표 등).
export const messageTypeSchema = z.enum(["USER", "SYSTEM"])

// 첨부 사진 참조.
export const photoRefSchema = z.object({
  photoId: z.number().int(),
  url: z.string(),
})

// GET /rooms/{id}/messages — 채팅/재판 스레드 이력.
//   caseId null = 방 본문 · 값 = 재판 스레드(= 그 caseId).
//   photoId null = 첨부 없음(재판 채팅 사진 지원).
export const messageResponseSchema = z.object({
  messageId: z.number().int(),
  type: messageTypeSchema,
  caseId: z.number().int().nullable(),
  content: z.string(),
  photoId: z.number().int().nullable(),
  photo: photoRefSchema.nullable(), // 조인해서 내려줄 때만
  user: userSummarySchema.nullable(), // SYSTEM 은 null
  createdAt: z.string(),
})

export const messageListResponseSchema = z.array(messageResponseSchema)

export type MessageType = z.infer<typeof messageTypeSchema>
export type PhotoRef = z.infer<typeof photoRefSchema>
export type MessageResponse = z.infer<typeof messageResponseSchema>
export type MessageListResponse = z.infer<typeof messageListResponseSchema>
