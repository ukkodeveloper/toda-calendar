// Socket.IO 클라이언트 래퍼. 백엔드 the-court-api 의 실시간 이벤트를 구독한다.
//
// 인증: io(NEXT_PUBLIC_WS_URL, { auth: { uuid } }) — REST 의 X-User-Uuid 와 값 동일.
// 채널: room:join(roomId) / trial:join(trialId). 재연결 시 자동 재조인.
// 백필: 재연결하면 그동안 놓친 메시지를 onReconnect 콜백에서 REST messages?after= 로 메운다.
"use client"

import { useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"

import {
  WS_EVENTS,
  type ChatMessageEvent,
  type ChatSendPayload,
  type TrialStartedEvent,
  type TrialStatusEvent,
  type VerdictRevealedEvent,
  type VoteUpdatedEvent,
} from "@workspace/contracts"

import { loadAuth } from "@/lib/auth"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080"

// ─── 세션 싱글턴 소켓 ──────────────────────────────────────────────────────────
// 룸/재판 훅이 하나의 연결을 공유한다(멀티플렉싱). uuid 가 바뀌면 재연결.

let sharedSocket: Socket | null = null
let sharedUuid: string | null = null

function ensureSocket(): Socket | null {
  const uuid = loadAuth()?.uuid ?? null
  if (!uuid) return null

  if (sharedSocket && sharedUuid === uuid) return sharedSocket

  // uuid 변경 → 기존 연결 폐기.
  if (sharedSocket) {
    sharedSocket.disconnect()
    sharedSocket = null
  }

  sharedUuid = uuid
  sharedSocket = io(WS_URL, {
    auth: { uuid },
    transports: ["websocket", "polling"],
    // 재연결은 socket.io 기본 백오프에 맡긴다.
  })
  return sharedSocket
}

// chat:send 직접 발신 — join/leave 를 건드리지 않는다(공유 소켓의 room 멤버십 보존).
// 재판 시트가 스레드 발언(caseId 포함)을 보낼 때 사용. 서버가 저장 후 room 으로 echo.
export function sendChatMessage(payload: ChatSendPayload): void {
  const socket = ensureSocket()
  socket?.emit(WS_EVENTS.CHAT_SEND, payload)
}

// ─── 방 스트림 훅 ──────────────────────────────────────────────────────────────

export type RoomStreamHandlers = {
  onChatMessage?: (m: ChatMessageEvent) => void
  onTrialStarted?: (e: TrialStartedEvent) => void
  onVerdictRevealed?: (e: VerdictRevealedEvent) => void
  // 재연결로 room 을 다시 조인한 직후 — REST messages?after= 로 놓친 메시지 백필.
  onReconnect?: () => void
}

export type RoomStreamApi = {
  // chat:send — content 또는 photoId 중 하나는 필수(빈 발언 금지).
  sendChat: (input: Omit<ChatSendPayload, "roomId">) => void
}

export function useRoomStream(
  roomId: number | null,
  handlers: RoomStreamHandlers
): RoomStreamApi {
  const handlersRef = useRef(handlers)
  // 최신 핸들러를 매 렌더 후 반영(구독은 roomId 로만 재설정).
  useEffect(() => {
    handlersRef.current = handlers
  })
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (roomId === null || Number.isNaN(roomId)) return
    const socket = ensureSocket()
    if (!socket) return
    socketRef.current = socket

    const join = () => socket.emit(WS_EVENTS.ROOM_JOIN, { roomId })

    // 최초 연결이 아닌 재연결에서만 백필 콜백을 쏜다(초기 로드는 호출부가 REST 로 이미 함).
    let hasConnected = socket.connected
    const onConnect = () => {
      join()
      if (hasConnected) handlersRef.current.onReconnect?.()
      hasConnected = true
    }

    const onChat = (m: ChatMessageEvent) =>
      handlersRef.current.onChatMessage?.(m)
    const onStarted = (e: TrialStartedEvent) =>
      handlersRef.current.onTrialStarted?.(e)
    const onVerdict = (e: VerdictRevealedEvent) =>
      handlersRef.current.onVerdictRevealed?.(e)

    socket.on("connect", onConnect)
    socket.on(WS_EVENTS.CHAT_MESSAGE, onChat)
    socket.on(WS_EVENTS.TRIAL_STARTED, onStarted)
    socket.on(WS_EVENTS.VERDICT_REVEALED, onVerdict)

    // 이미 연결돼 있으면 즉시 조인.
    if (socket.connected) join()

    return () => {
      socket.emit(WS_EVENTS.ROOM_LEAVE, { roomId })
      socket.off("connect", onConnect)
      socket.off(WS_EVENTS.CHAT_MESSAGE, onChat)
      socket.off(WS_EVENTS.TRIAL_STARTED, onStarted)
      socket.off(WS_EVENTS.VERDICT_REVEALED, onVerdict)
    }
  }, [roomId])

  return {
    sendChat: (input) => {
      if (roomId === null) return
      socketRef.current?.emit(WS_EVENTS.CHAT_SEND, { roomId, ...input })
    },
  }
}

// ─── 재판 스트림 훅 ────────────────────────────────────────────────────────────

export type TrialStreamHandlers = {
  onChatMessage?: (m: ChatMessageEvent) => void
  onTrialStatus?: (e: TrialStatusEvent) => void
  onVoteUpdated?: (e: VoteUpdatedEvent) => void
  onVerdictRevealed?: (e: VerdictRevealedEvent) => void
  onReconnect?: () => void
}

export function useTrialStream(
  trialId: number | null,
  handlers: TrialStreamHandlers
): void {
  const handlersRef = useRef(handlers)
  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (trialId === null || Number.isNaN(trialId)) return
    const socket = ensureSocket()
    if (!socket) return

    const join = () => socket.emit(WS_EVENTS.TRIAL_JOIN, { trialId })

    let hasConnected = socket.connected
    const onConnect = () => {
      join()
      if (hasConnected) handlersRef.current.onReconnect?.()
      hasConnected = true
    }

    const onChat = (m: ChatMessageEvent) =>
      handlersRef.current.onChatMessage?.(m)
    const onStatus = (e: TrialStatusEvent) =>
      handlersRef.current.onTrialStatus?.(e)
    const onVote = (e: VoteUpdatedEvent) =>
      handlersRef.current.onVoteUpdated?.(e)
    const onVerdict = (e: VerdictRevealedEvent) =>
      handlersRef.current.onVerdictRevealed?.(e)

    socket.on("connect", onConnect)
    socket.on(WS_EVENTS.CHAT_MESSAGE, onChat)
    socket.on(WS_EVENTS.TRIAL_STATUS, onStatus)
    socket.on(WS_EVENTS.VOTE_UPDATED, onVote)
    socket.on(WS_EVENTS.VERDICT_REVEALED, onVerdict)

    if (socket.connected) join()

    return () => {
      socket.emit(WS_EVENTS.TRIAL_LEAVE, { trialId })
      socket.off("connect", onConnect)
      socket.off(WS_EVENTS.CHAT_MESSAGE, onChat)
      socket.off(WS_EVENTS.TRIAL_STATUS, onStatus)
      socket.off(WS_EVENTS.VOTE_UPDATED, onVote)
      socket.off(WS_EVENTS.VERDICT_REVEALED, onVerdict)
    }
  }, [trialId])
}
