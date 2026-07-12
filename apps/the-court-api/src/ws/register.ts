import { randomUUID } from "node:crypto"

import {
  chatSendPayloadSchema,
  roomJoinPayloadSchema,
  roomLeavePayloadSchema,
  socketAuthSchema,
  trialJoinPayloadSchema,
  trialLeavePayloadSchema,
  WS_EVENTS,
} from "@workspace/contracts"
import type { ChatAck } from "@workspace/contracts"
import type { Server as IOServer, Socket } from "socket.io"

import { assertCaseInRoom, assertMember } from "../authz.js"
import { createUserMessage } from "../chat.js"
import { prisma } from "../db.js"
import { AppError } from "../errors.js"
import { log } from "../log.js"
import { createTokenBucket, type TokenBucket } from "../rate-limit.js"
import { emitChatMessage } from "./hub.js"
import { roomKey, trialKey } from "./keys.js"

// 소켓별 상태 — 핸드셰이크에서 확정한 신원 + 발신 rate limit 버킷.
interface SocketState {
  uuid: string
  bucket: TokenBucket
}
const stateOf = (socket: Socket) => socket.data as SocketState

// 도메인 에러 → ack 에러 envelope. AppError 는 code/message 그대로, 그 외는 뭉갠다.
function toAckError(err: unknown): { code: string; message: string } {
  if (err instanceof AppError) return { code: err.code, message: err.message }
  return { code: "INTERNAL", message: "메시지 전송에 실패했습니다" }
}

// chat:send 핵심 플로우 — rate limit → zod → 인가 → $transaction(멱등 create) → 커밋 후 emit + ack.
async function handleChatSend(
  socket: Socket,
  raw: unknown,
  ack: unknown
): Promise<void> {
  // opt-in ack: 클라가 콜백을 안 넘기면 무시(후방호환 — echo 만).
  const respond = (a: ChatAck) => {
    if (typeof ack === "function") (ack as (a: ChatAck) => void)(a)
  }
  const { uuid, bucket } = stateOf(socket)

  if (!bucket.tryConsume(Date.now())) {
    respond({
      status: "error",
      code: "RATE_LIMITED",
      message: "너무 빠르게 보냈습니다. 잠시 후 다시 시도하세요",
    })
    return
  }

  const parsed = chatSendPayloadSchema.safeParse(raw)
  if (!parsed.success) {
    respond({
      status: "error",
      code: "INVALID_PAYLOAD",
      message: "메시지 형식이 올바르지 않습니다",
    })
    return
  }
  const p = parsed.data

  try {
    await assertMember(p.roomId, uuid)
    if (p.caseId !== undefined) await assertCaseInRoom(p.caseId, p.roomId)

    // 멱등키: 클라가 안 주면 서버 생성(멱등 혜택만 상실, 안 깨짐).
    const clientMsgId = p.clientMsgId ?? randomUUID()
    const message = await prisma.$transaction((tx) =>
      createUserMessage(tx, {
        roomId: p.roomId,
        caseId: p.caseId ?? null,
        userUuid: uuid,
        photoId: p.photoId ?? null,
        content: p.content ?? "",
        clientMsgId,
      })
    )
    // 커밋 후 전파(write → broadcast) + 발신자에게 저장·seq 확인.
    emitChatMessage(p.roomId, message)
    respond({ status: "ok", message })
    log.info("chat_send", {
      socketId: socket.id,
      uuid,
      roomId: p.roomId,
      caseId: p.caseId ?? null,
      seq: message.seq,
      messageId: message.messageId,
      clientMsgId,
    })
  } catch (err) {
    const { code, message } = toAckError(err)
    respond({ status: "error", code, message })
    log.error("chat_send_failed", {
      socketId: socket.id,
      uuid,
      roomId: p.roomId,
      code,
      err: String(err),
    })
  }
}

// Socket.IO 이벤트 배선. 인증(auth:{uuid}) 핸드셰이크 + room/trial join + chat:send.
export function registerSocket(io: IOServer): void {
  // 핸드셰이크 인증 — io(url, { auth:{ uuid } }). uuid 실존 확인(REST requireExistingUser 대칭).
  io.use((socket, next) => {
    const parsed = socketAuthSchema.safeParse(socket.handshake.auth)
    if (!parsed.success) {
      next(new Error("AUTH_REQUIRED"))
      return
    }
    void prisma.user
      .findUnique({
        where: { uuid: parsed.data.uuid },
        select: { uuid: true },
      })
      .then((user) => {
        if (!user) {
          next(new Error("USER_NOT_FOUND"))
          return
        }
        const state: SocketState = {
          uuid: parsed.data.uuid,
          // 5 msg / 2s 지속률(refill 1 토큰 / 400ms).
          bucket: createTokenBucket(5, 400),
        }
        socket.data = state
        next()
      })
      .catch((err: unknown) => {
        log.error("ws_handshake_failed", { err: String(err) })
        next(new Error("HANDSHAKE_ERROR"))
      })
  })

  io.on("connection", (socket: Socket) => {
    // 방 구독 — 멤버만. 재연결 시 클라가 현재 상태 기반으로 재조인한다.
    socket.on(WS_EVENTS.ROOM_JOIN, (raw: unknown) => {
      const p = roomJoinPayloadSchema.safeParse(raw)
      if (!p.success) return
      void assertMember(p.data.roomId, stateOf(socket).uuid)
        .then(() => socket.join(roomKey(p.data.roomId)))
        .catch(() =>
          log.warn("room_join_denied", {
            socketId: socket.id,
            roomId: p.data.roomId,
          })
        )
    })
    socket.on(WS_EVENTS.ROOM_LEAVE, (raw: unknown) => {
      const p = roomLeavePayloadSchema.safeParse(raw)
      if (p.success) socket.leave(roomKey(p.data.roomId))
    })

    // 재판 스레드 구독 — 재판의 방 멤버만. trialId → case.roomId 해소 후 assertMember.
    socket.on(WS_EVENTS.TRIAL_JOIN, (raw: unknown) => {
      const p = trialJoinPayloadSchema.safeParse(raw)
      if (!p.success) return
      void (async () => {
        const trial = await prisma.trial.findUnique({
          where: { id: p.data.trialId },
          select: { case: { select: { roomId: true } } },
        })
        if (!trial) return
        try {
          await assertMember(trial.case.roomId, stateOf(socket).uuid)
          socket.join(trialKey(p.data.trialId))
        } catch {
          log.warn("trial_join_denied", {
            socketId: socket.id,
            trialId: p.data.trialId,
          })
        }
      })()
    })
    socket.on(WS_EVENTS.TRIAL_LEAVE, (raw: unknown) => {
      const p = trialLeavePayloadSchema.safeParse(raw)
      if (p.success) socket.leave(trialKey(p.data.trialId))
    })

    // 채팅 발신 — ack 는 opt-in 콜백(마지막 인자).
    socket.on(
      WS_EVENTS.CHAT_SEND,
      (raw: unknown, ack: unknown) => void handleChatSend(socket, raw, ack)
    )
  })
}
