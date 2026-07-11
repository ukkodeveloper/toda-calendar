import type {
  ChatMessageEvent,
  TrialStartedEvent,
  TrialStatusEvent,
  VerdictRevealedEvent,
  VoteUpdatedEvent,
} from "@workspace/contracts"
import { WS_EVENTS } from "@workspace/contracts"
import type { Server as IOServer } from "socket.io"

import { roomKey, trialKey } from "./keys.js"

// 전파 버스 — write=REST 후 서버가 여기로 broadcast(항상 DB write → then broadcast).
// io 참조를 모듈 싱글턴으로 보관해 REST 핸들러가 브로드캐스트할 수 있게 하는 유일한 이음매.
// 확장(앱서버 2대+) 시 이 지점에 @socket.io/redis-adapter 를 붙이면 write 경로는 안 바뀐다.
let io: IOServer | null = null

export function setSocketServer(server: IOServer): void {
  io = server
}

// ─── 타입 안전 브로드캐스트 헬퍼(계약 페이로드로만 emit) ──────────────────────

export function emitChatMessage(
  roomId: number,
  payload: ChatMessageEvent
): void {
  io?.to(roomKey(roomId)).emit(WS_EVENTS.CHAT_MESSAGE, payload)
}

export function emitTrialStarted(
  roomId: number,
  payload: TrialStartedEvent
): void {
  io?.to(roomKey(roomId)).emit(WS_EVENTS.TRIAL_STARTED, payload)
}

export function emitTrialStatus(
  trialId: number,
  payload: TrialStatusEvent
): void {
  io?.to(trialKey(trialId)).emit(WS_EVENTS.TRIAL_STATUS, payload)
}

export function emitVoteUpdated(
  trialId: number,
  payload: VoteUpdatedEvent
): void {
  io?.to(trialKey(trialId)).emit(WS_EVENTS.VOTE_UPDATED, payload)
}

// 선고 리빌 ⭐ — 방+재판 두 채널로 동시 broadcast(전 폰 동시 리빌, 데모 클라이맥스).
export function emitVerdictRevealed(
  roomId: number,
  trialId: number,
  payload: VerdictRevealedEvent
): void {
  io?.to(roomKey(roomId))
    .to(trialKey(trialId))
    .emit(WS_EVENTS.VERDICT_REVEALED, payload)
}
