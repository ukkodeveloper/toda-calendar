// 인메모리 목 — 백엔드 없이도 컴파일되게. 실제 채팅은 mock-chat 의 MOCK_CHAT_ITEMS 로 렌더된다.
import type { MessageResponse } from "./types"

const delay = (ms = 150) => new Promise<void>((r) => setTimeout(r, ms))

export const chatApi = {
  messages: async (_roomId: number): Promise<MessageResponse[]> => {
    await delay()
    return []
  },
}
