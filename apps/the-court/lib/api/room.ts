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

  // POST /api/rooms/{id}/read — 읽음 워터마크 전진(안읽음 해제). fire-and-forget.
  //   seq 주면 그 seq 까지, 없으면 대화 현재 lastSeq 까지. caseId 주면 그 스레드 읽음.
  read: (
    roomId: number,
    opts?: { seq?: number; caseId?: number }
  ): Promise<{ ok: boolean }> =>
    http.post<{ ok: boolean }>(
      `/api/rooms/${roomId}/read`,
      opts ? { body: opts } : undefined
    ),
}
