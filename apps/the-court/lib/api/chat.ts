import { http } from "./client"
import type { MessageResponse } from "./types"

export const chatApi = {
  messages: (roomId: number) =>
    http.get<MessageResponse[]>(`/api/rooms/${roomId}/messages`),
}
