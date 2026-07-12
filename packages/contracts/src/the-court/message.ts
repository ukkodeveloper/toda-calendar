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
//   seq = 대화별 서버할당 단조 순서·커서 키(gapless). 클라는 방/스레드별 max(seq)를 커서로 보관.
//   clientMsgId = 발신 클라가 만든 멱등키(낙관적 버블 reconcile용). SYSTEM·구클라 발신은 null.
export const messageResponseSchema = z.object({
  messageId: z.number().int(),
  seq: z.number().int(),
  type: messageTypeSchema,
  caseId: z.number().int().nullable(),
  content: z.string(),
  photoId: z.number().int().nullable(),
  photo: photoRefSchema.nullable(), // 조인해서 내려줄 때만
  user: userSummarySchema.nullable(), // SYSTEM 은 null
  clientMsgId: z.string().nullable(),
  createdAt: z.string(),
})

export const messageListResponseSchema = z.array(messageResponseSchema)

// 커서 페이지네이션 래퍼(미래용) — 서버는 배열도 계속 지원하고, 필요 시 이 shape 로도 응답 가능.
//   latestSeq = 이 페이지에서 관측된 대화 최대 seq(커서 전진). hasMore = 다음 페이지 존재.
export const messagePageSchema = z.object({
  messages: messageListResponseSchema,
  latestSeq: z.number().int(),
  hasMore: z.boolean(),
})

export type MessageType = z.infer<typeof messageTypeSchema>
export type PhotoRef = z.infer<typeof photoRefSchema>
export type MessageResponse = z.infer<typeof messageResponseSchema>
export type MessageListResponse = z.infer<typeof messageListResponseSchema>
export type MessagePage = z.infer<typeof messagePageSchema>
