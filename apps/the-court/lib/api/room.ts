// 방 — 실 REST. 목록/생성/참여/상세/멤버.
import { http } from "./client"
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  JoinRoomResponse,
  RoomDetailResponse,
  RoomListResponse,
  RoomMembersResponse,
  RoomResponse,
} from "./types"

export const roomApi = {
  // GET /api/rooms — 내가 참여중인 방(title + N명). 코드는 미포함(생성 응답에만).
  list: (): Promise<RoomListResponse> =>
    http.get<RoomListResponse>("/api/rooms"),

  create: (body: CreateRoomRequest): Promise<RoomResponse> =>
    http.post<RoomResponse>("/api/rooms", { body }),

  join: (body: JoinRoomRequest): Promise<JoinRoomResponse> =>
    http.post<JoinRoomResponse>("/api/rooms/join", { body }),

  detail: (roomId: number): Promise<RoomDetailResponse> =>
    http.get<RoomDetailResponse>(`/api/rooms/${roomId}`),

  members: (roomId: number): Promise<RoomMembersResponse> =>
    http.get<RoomMembersResponse>(`/api/rooms/${roomId}/members`),
}
