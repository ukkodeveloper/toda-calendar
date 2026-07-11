import {
  chatSendPayloadSchema,
  roomJoinPayloadSchema,
  roomLeavePayloadSchema,
  socketAuthSchema,
  trialJoinPayloadSchema,
  trialLeavePayloadSchema,
  WS_EVENTS,
} from "@workspace/contracts"
import type { Server as IOServer, Socket } from "socket.io"

import { createUserMessage } from "../chat.js"
import { emitChatMessage } from "./hub.js"
import { roomKey, trialKey } from "./keys.js"

// Socket.IO 이벤트 배선. 인증(auth:{uuid}) 핸드셰이크 + room/trial join + chat:send.
// chat:send 는 항상 write→broadcast: DB 저장 성공 후에만 room 채널로 전파(유령 메시지 방지).
export function registerSocket(io: IOServer): void {
  // 핸드셰이크 인증 — io(url, { auth:{ uuid } }). REST 의 X-User-Uuid 와 값 동일.
  io.use((socket, next) => {
    const parsed = socketAuthSchema.safeParse(socket.handshake.auth)
    if (!parsed.success) {
      next(new Error("AUTH_REQUIRED"))
      return
    }
    socket.data.uuid = parsed.data.uuid
    next()
  })

  io.on("connection", (socket: Socket) => {
    // 방 구독 — 재연결 시 클라가 현재 상태 기반으로 재조인한다.
    socket.on(WS_EVENTS.ROOM_JOIN, (raw: unknown) => {
      const p = roomJoinPayloadSchema.safeParse(raw)
      if (p.success) socket.join(roomKey(p.data.roomId))
    })
    socket.on(WS_EVENTS.ROOM_LEAVE, (raw: unknown) => {
      const p = roomLeavePayloadSchema.safeParse(raw)
      if (p.success) socket.leave(roomKey(p.data.roomId))
    })

    // 재판 스레드 구독.
    socket.on(WS_EVENTS.TRIAL_JOIN, (raw: unknown) => {
      const p = trialJoinPayloadSchema.safeParse(raw)
      if (p.success) socket.join(trialKey(p.data.trialId))
    })
    socket.on(WS_EVENTS.TRIAL_LEAVE, (raw: unknown) => {
      const p = trialLeavePayloadSchema.safeParse(raw)
      if (p.success) socket.leave(trialKey(p.data.trialId))
    })

    // 채팅 발신 — 경계 검증 → DB 저장 → room 채널 broadcast.
    //   caseId 있으면 재판 스레드 메시지(같은 room 채널로 흐르고 클라가 caseId 로 스레드 필터).
    socket.on(WS_EVENTS.CHAT_SEND, (raw: unknown) => {
      const p = chatSendPayloadSchema.safeParse(raw)
      if (!p.success) return
      const uuid = socket.data.uuid as string
      void (async () => {
        try {
          const message = await createUserMessage({
            roomId: p.data.roomId,
            caseId: p.data.caseId ?? null,
            userUuid: uuid,
            photoId: p.data.photoId ?? null,
            content: p.data.content ?? "",
          })
          emitChatMessage(p.data.roomId, message)
        } catch (err) {
          console.error("[ws] chat:send 실패", err)
        }
      })()
    })
  })
}
