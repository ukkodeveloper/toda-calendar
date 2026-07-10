/**
 * STOMP-over-WebSocket 클라이언트 (Spring Boot 표준 패턴).
 *
 * 서버 측 엔드포인트 경로는 백엔드 WebSocketConfig를 보고 맞춰라:
 *   - WS 연결:       /api/config 에서 런타임으로 취득 (API_ORIGIN 기반)
 *   - 구독 (서버→클): /topic/rooms/{roomId}
 *                    /topic/trials/{trialId}
 *   - 발행 (클→서버): /app/rooms/{roomId}/chat
 *
 * 외부 패키지 없이 STOMP 프레임을 직접 파싱한다.
 * 프로덕션에서 reconnect/heartbeat가 많이 필요하면 @stomp/stompjs 도입을 고려.
 */

import { loadAuth } from "@/lib/auth"
import type {
  SocketChatPayload,
  SocketMessage,
  SocketMessageType,
  SocketTrialEndPayload,
  SocketTrialStatusPayload,
  SocketVotePayload,
} from "./types"

// WS는 /ws 경로로 same-origin 연결 — Next.js rewrite가 API_ORIGIN/ws 로 프록시.
// 이렇게 해야 dev tunnel 브라우저 인증 문제를 우회할 수 있다.
function resolveWsUrl(): string {
  if (typeof window === "undefined") return "ws://localhost:8080/ws"
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${protocol}//${window.location.host}/ws`
}

// ─── STOMP 프레임 파서 ────────────────────────────────────────────────────────

interface StompFrame {
  command: string
  headers: Record<string, string>
  body: string
}

function parseFrame(raw: string): StompFrame {
  const nullIdx = raw.indexOf("\0")
  const text = nullIdx >= 0 ? raw.slice(0, nullIdx) : raw
  const lines = text.split("\n")
  const command = (lines[0] ?? "").trim()
  const headers: Record<string, string> = {}
  let bodyStart = 1

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim()
    if (line === "") {
      bodyStart = i + 1
      break
    }
    const sep = line.indexOf(":")
    if (sep > 0) {
      headers[line.slice(0, sep).trim()] = line.slice(sep + 1).trim()
    }
  }

  return { command, headers, body: lines.slice(bodyStart).join("\n").trim() }
}

function buildFrame(
  command: string,
  headers: Record<string, string>,
  body = ""
): string {
  const headerLines = Object.entries(headers)
    .map(([k, v]) => `${k}:${v}`)
    .join("\n")
  return `${command}\n${headerLines}\n\n${body}\0`
}

// ─── 구독 핸들러 타입 ─────────────────────────────────────────────────────────

type PayloadMap = {
  CHAT: SocketChatPayload
  TRIAL_STARTED: SocketTrialStatusPayload
  TRIAL_STATUS: SocketTrialStatusPayload
  VOTE_UPDATED: SocketVotePayload
  TRIAL_ENDED: SocketTrialEndPayload
}

type Handler<T extends SocketMessageType> = (payload: PayloadMap[T]) => void

// ─── RoomSocket ───────────────────────────────────────────────────────────────

export class RoomSocket {
  private ws: WebSocket | null = null
  private subscriptionId = 0
  private handlers = new Map<string, Set<(...args: unknown[]) => void>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private closed = false

  constructor(private readonly roomId: number) {}

  connect(): Promise<void> {
    const wsUrl = resolveWsUrl()
    return new Promise((resolve, reject) => {
      const auth = loadAuth()
      const url = auth?.uuid ? `${wsUrl}?uuid=${auth.uuid}` : wsUrl

      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        // STOMP CONNECT
        this.ws!.send(
          buildFrame("CONNECT", {
            "accept-version": "1.2",
            "heart-beat": "0,0",
            ...(auth?.uuid ? { login: auth.uuid } : {}),
          })
        )
      }

      this.ws.onmessage = (e) => {
        const frame = parseFrame(e.data as string)

        if (frame.command === "CONNECTED") {
          this.subscribe(`/topic/rooms/${this.roomId}`)
          resolve()
          return
        }

        if (frame.command === "MESSAGE") {
          try {
            const msg = JSON.parse(frame.body) as SocketMessage
            this.emit(msg.type, msg.payload)
          } catch {
            // 파싱 실패는 무시
          }
        }

        if (frame.command === "ERROR") {
          reject(new Error(frame.body || "STOMP ERROR"))
        }
      }

      this.ws.onerror = () => reject(new Error("WebSocket 연결 실패"))

      this.ws.onclose = () => {
        if (!this.closed) this.scheduleReconnect()
      }
    })
  }

  private subscribe(destination: string) {
    const id = `sub-${this.subscriptionId++}`
    this.ws?.send(buildFrame("SUBSCRIBE", { id, destination }))
  }

  /** 채팅 메시지 전송. 서버 `/app/rooms/{roomId}/chat` 로 발행. */
  sendChat(content: string) {
    const auth = loadAuth()
    this.ws?.send(
      buildFrame(
        "SEND",
        { destination: `/app/rooms/${this.roomId}/chat` },
        JSON.stringify({ content, userUuid: auth?.uuid })
      )
    )
  }

  on<T extends SocketMessageType>(type: T, handler: Handler<T>): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(handler as (...args: unknown[]) => void)
    return () =>
      this.handlers.get(type)?.delete(handler as (...args: unknown[]) => void)
  }

  private emit(type: string, payload: unknown) {
    this.handlers.get(type)?.forEach((h) => h(payload))
  }

  private scheduleReconnect() {
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {})
    }, 3000)
  }

  disconnect() {
    this.closed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(buildFrame("DISCONNECT", {}))
    }
    this.ws?.close()
    this.ws = null
  }
}

// ─── TrialSocket ──────────────────────────────────────────────────────────────

export class TrialSocket {
  private ws: WebSocket | null = null
  private subscriptionId = 0
  private handlers = new Map<string, Set<(...args: unknown[]) => void>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private closed = false

  constructor(private readonly trialId: number) {}

  connect(): Promise<void> {
    const wsUrl = resolveWsUrl()
    return new Promise((resolve, reject) => {
      const auth = loadAuth()
      const url = auth?.uuid ? `${wsUrl}?uuid=${auth.uuid}` : wsUrl

      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.ws!.send(
          buildFrame("CONNECT", {
            "accept-version": "1.2",
            "heart-beat": "0,0",
            ...(auth?.uuid ? { login: auth.uuid } : {}),
          })
        )
      }

      this.ws.onmessage = (e) => {
        const frame = parseFrame(e.data as string)

        if (frame.command === "CONNECTED") {
          this.subscribe(`/topic/trials/${this.trialId}`)
          resolve()
          return
        }

        if (frame.command === "MESSAGE") {
          try {
            const msg = JSON.parse(frame.body) as SocketMessage
            this.emit(msg.type, msg.payload)
          } catch {
            // 파싱 실패는 무시
          }
        }

        if (frame.command === "ERROR") {
          reject(new Error(frame.body || "STOMP ERROR"))
        }
      }

      this.ws.onerror = () => reject(new Error("WebSocket 연결 실패"))

      this.ws.onclose = () => {
        if (!this.closed) this.scheduleReconnect()
      }
    })
  }

  private subscribe(destination: string) {
    const id = `sub-${this.subscriptionId++}`
    this.ws?.send(buildFrame("SUBSCRIBE", { id, destination }))
  }

  /** 재판 채팅 전송. 서버 /app/trials/{trialId}/chat 로 발행. */
  sendTrialChat(content: string) {
    const auth = loadAuth()
    this.ws?.send(
      buildFrame(
        "SEND",
        { destination: "/app/trials/" + this.trialId + "/chat" },
        JSON.stringify({ content, userUuid: auth?.uuid })
      )
    )
  }

  on<T extends SocketMessageType>(type: T, handler: Handler<T>): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(handler as (...args: unknown[]) => void)
    return () =>
      this.handlers.get(type)?.delete(handler as (...args: unknown[]) => void)
  }

  private emit(type: string, payload: unknown) {
    this.handlers.get(type)?.forEach((h) => h(payload))
  }

  private scheduleReconnect() {
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {})
    }, 3000)
  }

  disconnect() {
    this.closed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(buildFrame("DISCONNECT", {}))
    }
    this.ws?.close()
    this.ws = null
  }
}

// ─── React 훅 ─────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react"

/** 방 채팅 소켓. 컴포넌트 마운트 시 연결, 언마운트 시 해제. */
export function useRoomSocket(
  roomId: number | null,
  handlers: Partial<{ [T in SocketMessageType]: Handler<T> }>
) {
  const socketRef = useRef<RoomSocket | null>(null)

  useEffect(() => {
    if (roomId === null) return

    const socket = new RoomSocket(roomId)
    socketRef.current = socket

    const unsubscribers: (() => void)[] = []

    socket
      .connect()
      .then(() => {
        for (const [type, handler] of Object.entries(handlers)) {
          if (handler) {
            unsubscribers.push(
              socket.on(
                type as SocketMessageType,
                handler as Handler<SocketMessageType>
              )
            )
          }
        }
      })
      .catch(console.error)

    return () => {
      unsubscribers.forEach((unsub) => unsub())
      socket.disconnect()
      socketRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  return socketRef
}

/** 재판 소켓. 컴포넌트 마운트 시 연결, 언마운트 시 해제. */
export function useTrialSocket(
  trialId: number | null,
  handlers: Partial<{ [T in SocketMessageType]: Handler<T> }>
) {
  const socketRef = useRef<TrialSocket | null>(null)

  useEffect(() => {
    if (trialId === null) return

    const socket = new TrialSocket(trialId)
    socketRef.current = socket

    const unsubscribers: (() => void)[] = []

    socket
      .connect()
      .then(() => {
        for (const [type, handler] of Object.entries(handlers)) {
          if (handler) {
            unsubscribers.push(
              socket.on(
                type as SocketMessageType,
                handler as Handler<SocketMessageType>
              )
            )
          }
        }
      })
      .catch(console.error)

    return () => {
      unsubscribers.forEach((unsub) => unsub())
      socket.disconnect()
      socketRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trialId])

  return socketRef
}
