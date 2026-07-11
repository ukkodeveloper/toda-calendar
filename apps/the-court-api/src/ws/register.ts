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

import { roomKey, trialKey } from "./keys.js"

// Socket.IO 이벤트 배선. 인증(auth:{uuid}) 핸드셰이크 + room/trial join + chat:send 스텁.
// 실제 chat:send 처리(DB 저장 → broadcast)는 슬라이스 02.
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

    // 채팅 발신 — 경계에서 검증만. 저장·전파는 슬라이스 02.
    socket.on(WS_EVENTS.CHAT_SEND, (raw: unknown) => {
      const p = chatSendPayloadSchema.safeParse(raw)
      if (!p.success) return
      const _uuid = socket.data.uuid as string
      // TODO(슬라이스 02): write→broadcast.
      //   1) prisma.message.create({ roomId, caseId?, userUuid:_uuid, photoId?, content })
      //   2) emitChatMessage(roomId, saved)  ← hub.ts (DB 저장 후에만 전파)
      void _uuid
      void p.data
    })
  })
}
