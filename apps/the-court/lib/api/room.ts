import { http } from "./client"
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  JoinRoomResponse,
  RoomDetailResponse,
  RoomListResponse,
  RoomMemberResponse,
  RoomResponse,
} from "./types"

export const roomApi = {
  list: () => http.get<RoomListResponse[]>("/api/rooms"),

  create: (body: CreateRoomRequest) =>
    http.post<RoomResponse>("/api/rooms", { body }),

  join: (body: JoinRoomRequest) =>
    http.post<JoinRoomResponse>("/api/rooms/join", { body }),

  detail: (roomId: number) =>
    http.get<RoomDetailResponse>(`/api/rooms/${roomId}`),

  members: (roomId: number) =>
    http.get<RoomMemberResponse[]>(`/api/rooms/${roomId}/members`),
}
