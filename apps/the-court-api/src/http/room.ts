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
  roomReadPayloadSchema,
} from "@workspace/contracts"
import type { Prisma } from "@prisma/client"
import { Hono } from "hono"
import { z } from "zod"

import { assertMember } from "../authz.js"
import { advanceRead, findConversation } from "../chat.js"
import { type AppEnv, requireExistingUser, requireUser } from "../context.js"
import { parseMessagesQuery } from "../cursor.js"
import { prisma } from "../db.js"
import { generateRoomCode } from "../domain/generate.js"
import { conflict, notFound, userNotFound } from "../errors.js"
import { toMessageResponse } from "../mappers.js"
import {
  isUniqueViolation,
  isUserForeignKeyViolation,
} from "../prisma-errors.js"

// path 파라미터 정수 강제 — NaN·음수·0 은 422 로 끊는다.
const roomIdParam = z.coerce.number().int().positive()

// 방 생성·참여·조회 + 메시지 이력.
export const roomRoutes = new Hono<AppEnv>()

// GET /api/rooms — 내가 참여중인 방(title + N명).
//   정렬·안읽음은 ROOM(방 본문) Conversation 의 lastMessageAt·lastSeq 비정규로 판정
//   → 방별 `messages take 1` 서브쿼리(N+1) 제거. 안읽음은 내 ConversationRead 워터마크와 비교.
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
          // 방 본문(ROOM) 대화 0..1 — seq 카운터·정렬 비정규.
          conversations: {
            where: { caseId: null },
            select: { id: true, lastSeq: true, lastMessageAt: true },
          },
        },
      },
    },
    orderBy: { id: "desc" },
  })

  // 내 읽음 워터마크 배치 조회(N+1 회피) — conversationId → lastReadSeq.
  const convIds = memberships
    .map((m) => m.room.conversations[0]?.id)
    .filter((id): id is number => id != null)
  const reads = convIds.length
    ? await prisma.conversationRead.findMany({
        where: { userUuid: uuid, conversationId: { in: convIds } },
        select: { conversationId: true, lastReadSeq: true },
      })
    : []
  const readSeqByConv = new Map(
    reads.map((r) => [r.conversationId, r.lastReadSeq])
  )

  const rooms: RoomListItem[] = memberships.map((m) => {
    const conv = m.room.conversations[0] ?? null
    const lastReadSeq = conv ? (readSeqByConv.get(conv.id) ?? 0n) : 0n
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
      lastMessageAt: conv?.lastMessageAt?.toISOString() ?? null,
      hasUnread: conv ? conv.lastSeq > lastReadSeq : false,
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

// POST /api/rooms/:roomId/read — 읽음 워터마크 전진(ConversationRead).
//   body {seq?, caseId?} 전부 optional. caseId 있으면 그 스레드, 없으면 방 본문.
//   seq 없으면 대화 현재 lastSeq 까지(기존 "지금" 의미). 대화 없으면 no-op(읽을 게 없음).
roomRoutes.post("/rooms/:roomId/read", async (c) => {
  const uuid = requireUser(c)
  const roomId = roomIdParam.parse(c.req.param("roomId"))
  await assertMember(roomId, uuid)
  const body = roomReadPayloadSchema.parse(await c.req.json().catch(() => ({})))

  const conv = await findConversation(prisma, roomId, body.caseId ?? null)
  if (conv) {
    const target = body.seq !== undefined ? BigInt(body.seq) : conv.lastSeq
    await advanceRead(prisma, conv.id, uuid, target)
  }
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

// GET /api/rooms/:roomId/messages?afterSeq={seq}&after={id}&caseId={id}&limit={n}
//   afterSeq → 신규 커서(대화별 seq, gapless). 재연결 백필의 SoT.
//   after    → 레거시 커서(message id). afterSeq 없을 때만 해석(후방호환).
//   caseId   → 재판 스레드 이력(값=스레드). 미지정 → 방 본문(ROOM) 대화.
//   limit    → 페이지 상한(기본·최대 200).
//   응답은 배열 유지(각 메시지에 seq·clientMsgId) — 클라가 max(seq)로 커서·page fullness 로 hasMore 파생.
//   seq 는 대화별이라 방 전체를 한 커서로 못 훑는다 → 본문·각 스레드를 별도 커서로 백필(FE 조율).
roomRoutes.get("/rooms/:roomId/messages", async (c) => {
  const uuid = requireUser(c)
  const roomId = roomIdParam.parse(c.req.param("roomId"))
  await assertMember(roomId, uuid)

  const q = parseMessagesQuery({
    afterSeq: c.req.query("afterSeq"),
    after: c.req.query("after"),
    caseId: c.req.query("caseId"),
    limit: c.req.query("limit"),
  })

  const conv = await findConversation(prisma, roomId, q.caseId ?? null)
  if (!conv) return c.json([] satisfies MessageResponse[])

  const where: Prisma.MessageWhereInput = { conversationId: conv.id }
  if (q.afterSeq !== undefined) where.seq = { gt: BigInt(q.afterSeq) }
  else if (q.afterId !== undefined) where.id = { gt: BigInt(q.afterId) }

  const messages = await prisma.message.findMany({
    where,
    include: { user: true, photo: true },
    orderBy: { seq: "asc" },
    take: q.limit,
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
