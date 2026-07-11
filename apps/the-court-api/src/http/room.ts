import type {
  MessageResponse,
  RoomDetailResponse,
  RoomListItem,
  RoomMember,
  RoomResponse,
  UserTitle,
} from "@workspace/contracts"
import {
  createRoomRequestSchema,
  joinRoomRequestSchema,
} from "@workspace/contracts"
import type { Prisma } from "@prisma/client"
import { Hono } from "hono"

import { type AppEnv, requireExistingUser, requireUser } from "../context.js"
import { prisma } from "../db.js"
import { generateRoomCode } from "../domain/generate.js"
import { conflict, notFound, userNotFound } from "../errors.js"
import { toMessageResponse } from "../mappers.js"
import {
  isUniqueViolation,
  isUserForeignKeyViolation,
} from "../prisma-errors.js"

// 방 생성·참여·조회 + 메시지 이력.
export const roomRoutes = new Hono<AppEnv>()

// GET /api/rooms — 내가 참여중인 방(title + N명).
roomRoutes.get("/rooms", async (c) => {
  const uuid = requireUser(c)
  const memberships = await prisma.member.findMany({
    where: { userUuid: uuid },
    include: {
      room: {
        include: {
          _count: { select: { members: true } },
          members: {
            take: 3,
            orderBy: { id: "asc" },
            include: {
              user: { select: { uuid: true, nickname: true, color: true } },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          },
        },
      },
    },
    orderBy: { id: "desc" },
  })
  const rooms: RoomListItem[] = memberships.map((m) => {
    const last = m.room.messages[0]?.createdAt
    return {
      roomId: m.roomId,
      title: m.room.title,
      code: m.room.code,
      participantCount: m.room._count.members,
      members: m.room.members.map((mm) => ({
        uuid: mm.user.uuid,
        nickname: mm.user.nickname,
        color: mm.user.color,
      })),
      lastMessageAt: last?.toISOString() ?? null,
      hasUnread: !!last && (!m.lastReadAt || last > m.lastReadAt),
    }
  })
  // 채팅 목록 UX: 최신 활동 순(lastMessageAt desc, null=무메시지는 뒤로).
  // 동률/무메시지는 orderBy id desc 로 이미 최근 가입 순 → 안정 정렬로 tie-break 유지.
  rooms.sort((a, b) => {
    if (a.lastMessageAt === b.lastMessageAt) return 0
    if (a.lastMessageAt === null) return 1
    if (b.lastMessageAt === null) return -1
    return a.lastMessageAt < b.lastMessageAt ? 1 : -1
  })
  return c.json(rooms)
})

// POST /api/rooms/:roomId/read — 방을 열 때 읽음 처리(내 lastReadAt 갱신).
// 멤버가 아니면 0건 업데이트(무해). 소유권 확인은 updateMany where 절이 겸한다.
roomRoutes.post("/rooms/:roomId/read", async (c) => {
  const uuid = requireUser(c)
  const roomId = Number(c.req.param("roomId"))
  await prisma.member.updateMany({
    where: { roomId, userUuid: uuid },
    data: { lastReadAt: new Date() },
  })
  return c.json({ ok: true })
})

// POST /api/rooms — 방 생성(참여코드 발급) + 생성자 자동 참여.
roomRoutes.post("/rooms", async (c) => {
  const uuid = await requireExistingUser(c)
  const body = createRoomRequestSchema.parse(await c.req.json())

  // 참여코드 유니크 충돌 시 재시도(원자적: 방+생성자 멤버 중첩 생성).
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const room = await prisma.room.create({
        data: {
          title: body.title,
          code: generateRoomCode(),
          members: { create: { userUuid: uuid } },
        },
      })
      return c.json(
        {
          roomId: room.id,
          title: room.title,
          participationCode: room.code,
          createdAt: room.createdAt.toISOString(),
        } satisfies RoomResponse,
        201
      )
    } catch (e) {
      if (isUniqueViolation(e, "code")) continue
      if (isUserForeignKeyViolation(e)) throw userNotFound() // 존재확인~write 사이 삭제 race 방어
      throw e
    }
  }
  throw conflict(
    "ROOM_CODE_EXHAUSTED",
    "참여코드 생성에 실패했습니다. 다시 시도하세요"
  )
})

// POST /api/rooms/join — 참여코드로 입장(이미 멤버면 그대로).
roomRoutes.post("/rooms/join", async (c) => {
  const uuid = await requireExistingUser(c)
  const body = joinRoomRequestSchema.parse(await c.req.json())
  const room = await prisma.room.findUnique({
    where: { code: body.participationCode },
  })
  if (!room)
    throw notFound("ROOM_NOT_FOUND", "참여코드에 해당하는 방이 없습니다")

  const member = await prisma.member.upsert({
    where: { roomId_userUuid: { roomId: room.id, userUuid: uuid } },
    create: { roomId: room.id, userUuid: uuid },
    update: {},
  })
  return c.json({ roomId: room.id, title: room.title, myTitle: member.title })
})

// GET /api/rooms/:roomId — 방 상세.
roomRoutes.get("/rooms/:roomId", async (c) => {
  const uuid = requireUser(c)
  const roomId = Number(c.req.param("roomId"))
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { _count: { select: { members: true } } },
  })
  if (!room) throw notFound("ROOM_NOT_FOUND", "방을 찾을 수 없습니다")
  const me = await prisma.member.findUnique({
    where: { roomId_userUuid: { roomId, userUuid: uuid } },
    select: { title: true },
  })
  return c.json({
    roomId: room.id,
    title: room.title,
    code: room.code,
    participantCount: room._count.members,
    myTitle: me?.title ?? "CITIZEN",
  } satisfies RoomDetailResponse)
})

// GET /api/rooms/:roomId/members — 멤버(전과 N범/모범시민 뱃지).
roomRoutes.get("/rooms/:roomId/members", async (c) => {
  const roomId = Number(c.req.param("roomId"))
  const members = await prisma.member.findMany({
    where: { roomId },
    include: { user: true },
    orderBy: { id: "asc" },
  })
  const result: RoomMember[] = members.map((m) => ({
    uuid: m.userUuid,
    nickname: m.user.nickname,
    title: m.title,
    color: m.user.color,
    convictionCount: m.convictionCount,
  }))
  return c.json(result)
})

// GET /api/rooms/:roomId/messages?after={id}&caseId={id}
//   after  → 커서(초기 로드·재연결 백필)
//   caseId → 재판 스레드 이력(값=스레드). 미지정 → 방 전체(클라가 body/thread 구분).
roomRoutes.get("/rooms/:roomId/messages", async (c) => {
  const roomId = Number(c.req.param("roomId"))
  const afterRaw = c.req.query("after")
  const caseIdRaw = c.req.query("caseId")

  const where: Prisma.MessageWhereInput = { roomId }
  if (afterRaw !== undefined) where.id = { gt: Number(afterRaw) }
  if (caseIdRaw !== undefined) where.caseId = Number(caseIdRaw)

  const messages = await prisma.message.findMany({
    where,
    include: { user: true, photo: true },
    orderBy: { id: "asc" },
  })

  // 방별 칭호 배치 조회(N+1 회피) — userUuid → title.
  const titleByUuid = new Map<string, UserTitle>()
  const roomMembers = await prisma.member.findMany({
    where: { roomId },
    select: { userUuid: true, title: true },
  })
  for (const m of roomMembers) titleByUuid.set(m.userUuid, m.title)

  const result: MessageResponse[] = messages.map((m) =>
    toMessageResponse(
      m,
      m.userUuid ? (titleByUuid.get(m.userUuid) ?? null) : null
    )
  )
  return c.json(result)
})
