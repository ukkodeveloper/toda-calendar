import { z } from "zod"

import {
  caseStatusSchema,
  trialStatusSchema,
  userTitleSchema,
  verdictSchema,
} from "./enums.js"
import { messageResponseSchema } from "./message.js"

// Socket.IO 이벤트 이름 상수 — 프론트·백 공용(오타 방지 SoT).
export const WS_EVENTS = {
  // 클라 → 서버
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  CHAT_SEND: "chat:send",
  TRIAL_JOIN: "trial:join",
  TRIAL_LEAVE: "trial:leave",
  // 서버 → 클라
  CHAT_MESSAGE: "chat:message",
  TRIAL_STARTED: "trial:started",
  TRIAL_STATUS: "trial:status",
  VOTE_UPDATED: "vote:updated",
  VERDICT_REVEALED: "verdict:revealed",
} as const

// 핸드셰이크 인증 — io(url, { auth: { uuid } }).
export const socketAuthSchema = z.object({
  uuid: z.string(),
})

// ─── 클라 → 서버 ────────────────────────────────────────────────────────────

export const roomJoinPayloadSchema = z.object({ roomId: z.number().int() })
export const roomLeavePayloadSchema = z.object({ roomId: z.number().int() })
export const trialJoinPayloadSchema = z.object({ trialId: z.number().int() })
export const trialLeavePayloadSchema = z.object({ trialId: z.number().int() })

// content 또는 photoId 중 하나는 있어야 함(빈 발언 금지).
export const chatSendPayloadSchema = z
  .object({
    roomId: z.number().int(),
    content: z.string().trim().max(2000).optional(),
    caseId: z.number().int().optional(), // 있으면 재판 스레드 발언
    photoId: z.number().int().optional(),
  })
  .refine((v) => Boolean(v.content) || v.photoId !== undefined, {
    message: "content 또는 photoId 중 하나는 필요합니다",
  })

// ─── 서버 → 클라 ────────────────────────────────────────────────────────────

// chat:message — 방/재판 스레드 브로드캐스트(메시지 조회와 동일 shape 재사용).
export const chatMessageEventSchema = messageResponseSchema

export const trialStartedEventSchema = z.object({
  caseId: z.number().int(),
  trialId: z.number().int(),
  caseStatus: caseStatusSchema, // ON_TRIAL
  trialStatus: trialStatusSchema, // STATEMENT
})

export const trialStatusEventSchema = z.object({
  trialId: z.number().int(),
  status: trialStatusSchema,
})

export const voteUpdatedEventSchema = z.object({
  trialId: z.number().int(),
  guiltyCount: z.number().int().nonnegative(),
  notGuiltyCount: z.number().int().nonnegative(),
  votedCount: z.number().int().nonnegative(),
  totalVoters: z.number().int().nonnegative(),
})

// verdict:revealed ⭐ — 선고 리빌(전 폰 동시 broadcast, 데모 클라이맥스).
export const verdictRevealedEventSchema = z.object({
  trialId: z.number().int(),
  verdict: verdictSchema,
  guiltyCount: z.number().int().nonnegative(),
  notGuiltyCount: z.number().int().nonnegative(),
  defendant: z.object({
    uuid: z.string(),
    nickname: z.string(),
    newTitle: userTitleSchema,
    convictionCount: z.number().int().nonnegative(),
  }),
  caseStatus: caseStatusSchema, // 유죄 CLOSED / 무죄 DECLARED
})

export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS]
export type SocketAuth = z.infer<typeof socketAuthSchema>
export type RoomJoinPayload = z.infer<typeof roomJoinPayloadSchema>
export type RoomLeavePayload = z.infer<typeof roomLeavePayloadSchema>
export type TrialJoinPayload = z.infer<typeof trialJoinPayloadSchema>
export type TrialLeavePayload = z.infer<typeof trialLeavePayloadSchema>
export type ChatSendPayload = z.infer<typeof chatSendPayloadSchema>
export type ChatMessageEvent = z.infer<typeof chatMessageEventSchema>
export type TrialStartedEvent = z.infer<typeof trialStartedEventSchema>
export type TrialStatusEvent = z.infer<typeof trialStatusEventSchema>
export type VoteUpdatedEvent = z.infer<typeof voteUpdatedEventSchema>
export type VerdictRevealedEvent = z.infer<typeof verdictRevealedEventSchema>
