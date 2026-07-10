// Mock room API — mirrors `GET/POST /api/rooms` in domain/api.md.
// No backend yet; in-memory seed + fake latency so the home screen is demoable.
// When the real API lands, swap these bodies for fetch() calls (same shapes).

export interface Room {
  roomId: number
  title: string
  participantCount: number
  participationCode: string
}

// GET /api/rooms → 참여중인 방 목록
let rooms: Room[] = [
  {
    roomId: 12,
    title: "우리 다이어트 모임",
    participantCount: 5,
    participationCode: "QWERTZ",
  },
  {
    roomId: 20,
    title: "금연 챌린지",
    participantCount: 3,
    participationCode: "ABCDEF",
  },
  {
    roomId: 31,
    title: "새벽 기상 스터디",
    participantCount: 8,
    participationCode: "ZXCVBN",
  },
]

let nextRoomId = 100

const delay = (ms = 260) => new Promise((r) => setTimeout(r, ms))

// A→Z 6자리 참여코드 (POST /api/rooms 응답의 participationCode 모사)
function makeCode(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

/** GET /api/rooms */
export async function getRooms(): Promise<Room[]> {
  await delay()
  return [...rooms]
}

/** POST /api/rooms — 방 생성. participationCode가 Room에 포함되어 반환. */
export async function createRoom(title: string): Promise<Room> {
  await delay()
  const room: Room = {
    roomId: nextRoomId++,
    title: title.trim(),
    participantCount: 1,
    participationCode: makeCode(),
  }
  rooms = [room, ...rooms]
  return room
}

/** POST /api/rooms/join — 참여코드로 입장. */
export async function joinRoom(participationCode: string): Promise<Room> {
  await delay()
  const code = participationCode.toUpperCase()
  const room: Room = {
    roomId: nextRoomId++,
    title: `참여한 방 (${code})`,
    participantCount: Math.floor(Math.random() * 6) + 2,
    participationCode: code,
  }
  rooms = [room, ...rooms]
  return room
}
