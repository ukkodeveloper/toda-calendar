import {
  createRoomRequestSchema,
  joinRoomRequestSchema,
} from "@workspace/contracts"
import { Hono } from "hono"

import { type AppEnv, requireUser } from "../context.js"
import { notImplemented } from "../errors.js"

// 방 생성·참여·조회 + 메시지 이력.
export const roomRoutes = new Hono<AppEnv>()

// GET /api/rooms — 내가 참여중인 방(title + N명) → roomListResponseSchema
roomRoutes.get("/rooms", (c) => {
  const uuid = requireUser(c)
  void uuid
  // TODO(슬라이스 02): Member @@index([userUuid]) 로 내 방 조회 → roomListResponseSchema
  throw notImplemented("GET /api/rooms")
})

// POST /api/rooms — 방 생성(참여코드 발급) → roomResponseSchema
roomRoutes.post("/rooms", async (c) => {
  const uuid = requireUser(c)
  const body = createRoomRequestSchema.parse(await c.req.json())
  void uuid
  void body
  // TODO(슬라이스 02): prisma.room.create(code 생성) + 생성자 Member 등록 → roomResponseSchema
  throw notImplemented("POST /api/rooms")
})

// POST /api/rooms/join — 참여코드로 입장 → joinRoomResponseSchema
roomRoutes.post("/rooms/join", async (c) => {
  const uuid = requireUser(c)
  const body = joinRoomRequestSchema.parse(await c.req.json())
  void uuid
  void body
  // TODO(슬라이스 02): Room.code 조회(없으면 404) → Member upsert(@@unique) → joinRoomResponseSchema
  throw notImplemented("POST /api/rooms/join")
})

// GET /api/rooms/:roomId — 방 상세 → roomDetailResponseSchema
roomRoutes.get("/rooms/:roomId", (c) => {
  const uuid = requireUser(c)
  const roomId = Number(c.req.param("roomId"))
  void uuid
  void roomId
  // TODO(슬라이스 02): 방 + 내 칭호 → roomDetailResponseSchema
  throw notImplemented("GET /api/rooms/:roomId")
})

// GET /api/rooms/:roomId/members — 멤버(전과 N범/모범시민) → roomMembersResponseSchema
roomRoutes.get("/rooms/:roomId/members", (c) => {
  const roomId = Number(c.req.param("roomId"))
  void roomId
  // TODO(슬라이스 02): 방 멤버 목록 → roomMembersResponseSchema
  throw notImplemented("GET /api/rooms/:roomId/members")
})

// GET /api/rooms/:roomId/messages?after={id}&caseId={id}
//   after  → 초기 로드·재연결 백필(커서)
//   caseId → 재판 스레드 이력(값=스레드, 미지정=방 본문+시스템 포함 전체)
//   → messageListResponseSchema
roomRoutes.get("/rooms/:roomId/messages", (c) => {
  const roomId = Number(c.req.param("roomId"))
  const after = c.req.query("after")
  const caseId = c.req.query("caseId")
  void roomId
  void after
  void caseId
  // TODO(슬라이스 02): Message @@index([roomId,caseId,createdAt]) 시간순 + user/photo 조인 → messageListResponseSchema
  throw notImplemented("GET /api/rooms/:roomId/messages")
})
