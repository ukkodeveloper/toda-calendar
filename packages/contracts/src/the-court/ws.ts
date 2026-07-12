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
  READ_UPDATED: "read:updated", // 예약 — 미래 읽음영수증 브로드캐스트(v1 미발신)
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
// clientMsgId = 멱등키(발신 클라가 UUID 생성). optional — 없으면 서버가 생성(멱등 혜택만 상실).
export const chatSendPayloadSchema = z
  .object({
    roomId: z.number().int(),
    content: z.string().trim().max(2000).optional(),
    caseId: z.number().int().optional(), // 있으면 재판 스레드 발언
    photoId: z.number().int().optional(),
    clientMsgId: z.string().uuid().optional(),
  })
  .refine((v) => Boolean(v.content) || v.photoId !== undefined, {
    message: "content 또는 photoId 중 하나는 필요합니다",
  })

// chat:send 의 ack 콜백 응답 — 서버가 저장·seq 확정 결과를 발신자에게 확인해 준다.
//   ok  → message(seq·clientMsgId 포함)로 낙관적 pending 을 확정 치환.
//   error → code/message 로 "전송 실패, 재시도" 표면화.
// 클라가 ack 콜백을 안 넘기면 서버는 무시하고 broadcast(echo)만 한다(후방호환).
export const chatAckSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ok"), message: messageResponseSchema }),
  z.object({
    status: z.literal("error"),
    code: z.string(),
    message: z.string(),
  }),
])

// POST /rooms/:roomId/read 바디 — 읽음 워터마크 전진. 둘 다 optional.
//   seq 없으면 대화 현재 lastSeq 까지 읽음(기존 "지금" 의미). caseId 있으면 그 스레드 읽음.
export const roomReadPayloadSchema = z.object({
  seq: z.number().int().optional(),
  caseId: z.number().int().optional(),
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
export type ChatAck = z.infer<typeof chatAckSchema>
export type RoomReadPayload = z.infer<typeof roomReadPayloadSchema>
export type ChatMessageEvent = z.infer<typeof chatMessageEventSchema>
export type TrialStartedEvent = z.infer<typeof trialStartedEventSchema>
export type TrialStatusEvent = z.infer<typeof trialStatusEventSchema>
export type VoteUpdatedEvent = z.infer<typeof voteUpdatedEventSchema>
export type VerdictRevealedEvent = z.infer<typeof verdictRevealedEventSchema>
