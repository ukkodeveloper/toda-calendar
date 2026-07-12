import type { MessageResponse, UserTitle } from "@workspace/contracts"
import type { Prisma, PrismaClient } from "@prisma/client"
import { Prisma as PrismaNS } from "@prisma/client"

import { toMessageResponse } from "./mappers.js"

type DbClient = PrismaClient | Prisma.TransactionClient

type ConvRef = { id: number; lastSeq: bigint }

// (roomId, userUuid) → 방별 칭호. 메시지 작성자 title 은 방 스코프(Member)에서 온다.
export async function getMemberTitle(
  client: DbClient,
  roomId: number,
  userUuid: string
): Promise<UserTitle | null> {
  const m = await client.member.findUnique({
    where: { roomId_userUuid: { roomId, userUuid } },
    select: { title: true },
  })
  return m?.title ?? null
}

// (roomId, caseId) → Conversation. caseId null=방 본문(ROOM), 값=재판 스레드(TRIAL).
// race-safe: INSERT … ON CONFLICT DO NOTHING(타겟 없음 → 부분 유니크 3종 어느 것에 걸려도 무예외)
//   → 트랜잭션을 오염시키지 않는다(P2002 catch-and-retry 는 tx 안에서 aborted 상태를 유발).
//   충돌(0행)이면 커밋된 승자를 SELECT 로 회수. 동시 첫 발신 경합에서도 정확히 1개로 수렴.
export async function resolveConversation(
  client: DbClient,
  roomId: number,
  caseId: number | null
): Promise<ConvRef> {
  const kind = caseId == null ? "ROOM" : "TRIAL"
  const inserted = await client.$queryRaw<ConvRef[]>(PrismaNS.sql`
    INSERT INTO "Conversation" ("roomId", "caseId", "kind")
    VALUES (${roomId}, ${caseId}, ${kind}::"ConversationKind")
    ON CONFLICT DO NOTHING
    RETURNING "id", "lastSeq"
  `)
  if (inserted[0]) return inserted[0]

  const found = await client.$queryRaw<ConvRef[]>(
    caseId == null
      ? PrismaNS.sql`SELECT "id", "lastSeq" FROM "Conversation" WHERE "roomId" = ${roomId} AND "caseId" IS NULL LIMIT 1`
      : PrismaNS.sql`SELECT "id", "lastSeq" FROM "Conversation" WHERE "caseId" = ${caseId} LIMIT 1`
  )
  if (!found[0]) {
    throw new Error(
      `resolveConversation: no conversation for room=${roomId} case=${caseId}`
    )
  }
  return found[0]
}

// 읽기 전용 조회(생성 안 함) — GET messages·POST read 용. 없으면 null.
export async function findConversation(
  client: DbClient,
  roomId: number,
  caseId: number | null
): Promise<ConvRef | null> {
  const rows = await client.$queryRaw<ConvRef[]>(
    caseId == null
      ? PrismaNS.sql`SELECT "id", "lastSeq" FROM "Conversation" WHERE "roomId" = ${roomId} AND "caseId" IS NULL LIMIT 1`
      : PrismaNS.sql`SELECT "id", "lastSeq" FROM "Conversation" WHERE "caseId" = ${caseId} LIMIT 1`
  )
  return rows[0] ?? null
}

// 읽음 워터마크 전진(단조) — GREATEST 로 되돌림 방지. 발신 시 sender·읽음 API 공용.
export async function advanceRead(
  client: DbClient,
  conversationId: number,
  userUuid: string,
  seq: bigint
): Promise<void> {
  await client.$executeRaw(PrismaNS.sql`
    INSERT INTO "ConversationRead" ("conversationId", "userUuid", "lastReadSeq", "updatedAt")
    VALUES (${conversationId}, ${userUuid}, ${seq}, now())
    ON CONFLICT ("conversationId", "userUuid")
    DO UPDATE SET
      "lastReadSeq" = GREATEST(EXCLUDED."lastReadSeq", "ConversationRead"."lastReadSeq"),
      "updatedAt" = now()
  `)
}

type SeqInsert = {
  convId: number
  roomId: number
  caseId: number | null
  userUuid: string | null
  photoId: number | null
  clientMsgId: string | null
  type: "USER" | "SYSTEM"
  content: string
}

// seq bump + insert 단일 CTE. Conversation 행 락이 대화 단위로 직렬화 →
//   낮은 seq 가 먼저 커밋 → 키셋(seq > cursor)이 절대 건너뛰지 않음(gapless).
// clientMsgId 있는 USER 는 message_idempotency partial unique 에 ON CONFLICT DO NOTHING
//   → 동시 중복 경합 시 INSERT 0행(호출부가 기존 행 회수). SYSTEM(null)은 충돌 불가.
async function bumpSeqInsert(
  client: DbClient,
  p: SeqInsert
): Promise<{ id: bigint } | null> {
  const rows = await client.$queryRaw<{ id: bigint }[]>(PrismaNS.sql`
    WITH bumped AS (
      UPDATE "Conversation"
         SET "lastSeq" = "lastSeq" + 1, "lastMessageAt" = now()
       WHERE "id" = ${p.convId}
      RETURNING "lastSeq"
    )
    INSERT INTO "Message"
      ("conversationId", "roomId", "caseId", "seq", "userUuid", "photoId", "clientMsgId", "type", "content")
    SELECT ${p.convId}, ${p.roomId}, ${p.caseId}, b."lastSeq", ${p.userUuid}, ${p.photoId}, ${p.clientMsgId}, ${p.type}::"MessageType", ${p.content}
    FROM bumped b
    ON CONFLICT ("conversationId", "userUuid", "clientMsgId") WHERE "clientMsgId" IS NOT NULL
      DO NOTHING
    RETURNING "id"
  `)
  return rows[0] ?? null
}

const withRefs = { user: true, photo: true } as const

// USER 메시지 저장 → MessageResponse. 호출부(ws/register)가 $transaction 으로 감싸고
// 커밋 후 emit + ack 한다. clientMsgId 는 발신 클라 or 서버 생성값(항상 non-null).
export async function createUserMessage(
  client: DbClient,
  input: {
    roomId: number
    caseId: number | null
    userUuid: string
    photoId: number | null
    content: string
    clientMsgId: string
  }
): Promise<MessageResponse> {
  const conv = await resolveConversation(client, input.roomId, input.caseId)

  // 멱등 fast path: 이미 커밋된 같은 clientMsgId 가 있으면 seq 소비 없이 그 행을 재사용.
  // (흔한 재시도 = 커밋 후 재발신 → 여기서 처리, seq 안 태움.)
  const prior = await client.message.findFirst({
    where: {
      conversationId: conv.id,
      userUuid: input.userUuid,
      clientMsgId: input.clientMsgId,
    },
    select: { id: true },
  })

  let id: bigint
  if (prior) {
    id = prior.id
  } else {
    const inserted = await bumpSeqInsert(client, {
      convId: conv.id,
      roomId: input.roomId,
      caseId: input.caseId,
      userUuid: input.userUuid,
      photoId: input.photoId,
      clientMsgId: input.clientMsgId,
      type: "USER",
      content: input.content,
    })
    if (inserted) {
      id = inserted.id
    } else {
      // 드문 동시 중복 경합: INSERT 가 ON CONFLICT 로 0행 → 승자 행 회수(seq 1개 갭 허용).
      const raced = await client.message.findFirst({
        where: {
          conversationId: conv.id,
          userUuid: input.userUuid,
          clientMsgId: input.clientMsgId,
        },
        select: { id: true },
      })
      if (!raced) throw new Error("idempotent insert produced no row")
      id = raced.id
    }
  }

  const msg = await client.message.findUniqueOrThrow({
    where: { id },
    include: withRefs,
  })
  // 작성자 본인은 방금 보낸 메시지를 이미 읽은 상태 → 그 대화 워터마크 전진(단조).
  await advanceRead(client, conv.id, input.userUuid, msg.seq)
  const title = await getMemberTitle(client, input.roomId, input.userUuid)
  return toMessageResponse(msg, title)
}

// SYSTEM 메시지 저장 → MessageResponse. 호출부의 tx 를 넘겨 도메인 write 와 원자로 묶는다.
// caseId null → ROOM(방 본문 공지), 값 → TRIAL(스레드 절차 공지). 귀속은 호출부가 결정(decision §3).
export async function createSystemMessage(
  client: DbClient,
  roomId: number,
  caseId: number | null,
  content: string
): Promise<MessageResponse> {
  const conv = await resolveConversation(client, roomId, caseId)
  const inserted = await bumpSeqInsert(client, {
    convId: conv.id,
    roomId,
    caseId,
    userUuid: null,
    photoId: null,
    clientMsgId: null,
    type: "SYSTEM",
    content,
  })
  if (!inserted) throw new Error("system message insert produced no row")
  const msg = await client.message.findUniqueOrThrow({
    where: { id: inserted.id },
    include: withRefs,
  })
  return toMessageResponse(msg, null)
}
