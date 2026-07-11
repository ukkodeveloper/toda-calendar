// 인메모리 목 — 백엔드 없이 홈(방 생성/참여/목록)이 돌게. shape 은 domain/api.md 유지.
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  JoinRoomResponse,
  RoomDetailResponse,
  RoomListResponse,
  RoomMemberResponse,
  RoomResponse,
} from "./types"

const delay = (ms = 240) => new Promise<void>((r) => setTimeout(r, ms))

// A→Z 6자리 참여코드
function makeCode(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

let rooms: RoomListResponse[] = [
  {
    roomId: 12,
    title: "우리 다이어트 모임",
    participationCode: "QWERTZ",
    participantCount: 5,
  },
  {
    roomId: 20,
    title: "금연 챌린지",
    participationCode: "ABCDEF",
    participantCount: 3,
  },
  {
    roomId: 31,
    title: "새벽 기상 스터디",
    participationCode: "ZXCVBN",
    participantCount: 8,
  },
]

let nextRoomId = 100

export const roomApi = {
  list: async (): Promise<RoomListResponse[]> => {
    await delay()
    return [...rooms]
  },

  create: async (body: CreateRoomRequest): Promise<RoomResponse> => {
    await delay()
    const room: RoomListResponse = {
      roomId: nextRoomId++,
      title: body.title.trim(),
      participationCode: makeCode(),
      participantCount: 1,
    }
    rooms = [room, ...rooms]
    return {
      roomId: room.roomId,
      title: room.title,
      participationCode: room.participationCode,
      createdAt: new Date().toISOString(),
    }
  },

  join: async (body: JoinRoomRequest): Promise<JoinRoomResponse> => {
    await delay()
    const code = body.participationCode.toUpperCase()
    const existing = rooms.find((r) => r.participationCode === code)
    if (existing) {
      existing.participantCount += 1
      return {
        roomId: existing.roomId,
        title: existing.title,
        myTitle: "CITIZEN",
      }
    }
    const room: RoomListResponse = {
      roomId: nextRoomId++,
      title: `참여한 방 (${code})`,
      participationCode: code,
      participantCount: Math.floor(Math.random() * 6) + 2,
    }
    rooms = [room, ...rooms]
    return { roomId: room.roomId, title: room.title, myTitle: "CITIZEN" }
  },

  detail: async (roomId: number): Promise<RoomDetailResponse> => {
    await delay()
    const room = rooms.find((r) => r.roomId === roomId)
    return {
      roomId,
      title: room?.title ?? "채팅방",
      participantCount: room?.participantCount ?? 1,
      myTitle: "CITIZEN",
    }
  },

  members: async (): Promise<RoomMemberResponse[]> => {
    await delay()
    return []
  },
}
