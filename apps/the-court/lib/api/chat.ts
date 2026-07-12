// 채팅 이력 — 실 REST. 초기 로드·재연결 백필(after 커서)·재판 스레드(caseId).
import { http } from "./client"
import type { MessageListResponse } from "./types"

type MessagesQuery = {
  afterSeq?: number // 커서(이 대화 seq 이후만) — 재연결 gapless 백필. after 보다 우선.
  after?: number // 레거시 id 커서(afterSeq 없을 때만). 신규는 afterSeq 사용.
  caseId?: number // 재판 스레드 이력(값=그 caseId). 미지정 = 방 본문(ROOM).
  limit?: number // 페이지 상한(기본 서버 200)
}

export const chatApi = {
  // GET /api/rooms/:id/messages?afterSeq=&caseId=&limit=
  //   seq 는 대화별(방 본문 / 각 스레드) — 커서도 대화별로 따로 보관해야 한다.
  messages: (
    roomId: number,
    query: MessagesQuery = {}
  ): Promise<MessageListResponse> => {
    const params = new URLSearchParams()
    if (query.afterSeq !== undefined)
      params.set("afterSeq", String(query.afterSeq))
    else if (query.after !== undefined) params.set("after", String(query.after))
    if (query.caseId !== undefined) params.set("caseId", String(query.caseId))
    if (query.limit !== undefined) params.set("limit", String(query.limit))
    const qs = params.toString()
    return http.get<MessageListResponse>(
      `/api/rooms/${roomId}/messages${qs ? `?${qs}` : ""}`
    )
  },
}
