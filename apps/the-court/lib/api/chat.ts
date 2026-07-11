// 채팅 이력 — 실 REST. 초기 로드·재연결 백필(after 커서)·재판 스레드(caseId).
import { http } from "./client"
import type { MessageListResponse } from "./types"

type MessagesQuery = {
  after?: number // 커서(이 id 이후만) — 재연결 백필
  caseId?: number // 재판 스레드 이력(값=그 caseId)
}

export const chatApi = {
  // GET /api/rooms/:id/messages?after=&caseId=
  messages: (
    roomId: number,
    query: MessagesQuery = {}
  ): Promise<MessageListResponse> => {
    const params = new URLSearchParams()
    if (query.after !== undefined) params.set("after", String(query.after))
    if (query.caseId !== undefined) params.set("caseId", String(query.caseId))
    const qs = params.toString()
    return http.get<MessageListResponse>(
      `/api/rooms/${roomId}/messages${qs ? `?${qs}` : ""}`
    )
  },
}
