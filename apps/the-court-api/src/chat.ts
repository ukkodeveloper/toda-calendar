import type { MessageResponse, UserTitle } from "@workspace/contracts"
import type { Prisma, PrismaClient } from "@prisma/client"

import { prisma } from "./db.js"
import { toMessageResponse } from "./mappers.js"

type DbClient = PrismaClient | Prisma.TransactionClient

// (roomId, userUuid) → 방별 칭호. 메시지 작성자 title 은 방 스코프(Member)에서 온다.
export async function getMemberTitle(
  roomId: number,
  userUuid: string
): Promise<UserTitle | null> {
  const m = await prisma.member.findUnique({
    where: { roomId_userUuid: { roomId, userUuid } },
    select: { title: true },
  })
  return m?.title ?? null
}

// USER 메시지 저장 → MessageResponse. 방별 칭호를 붙여 돌려준다.
export async function createUserMessage(input: {
  roomId: number
  caseId: number | null
  userUuid: string
  photoId: number | null
  content: string
}): Promise<MessageResponse> {
  const msg = await prisma.message.create({
    data: {
      roomId: input.roomId,
      caseId: input.caseId,
      userUuid: input.userUuid,
      photoId: input.photoId,
      type: "USER",
      content: input.content,
    },
    include: { user: true, photo: true },
  })
  // 작성자 본인은 방금 보낸 메시지를 이미 읽은 상태 → 자기 방에서 "안 읽음"으로 뜨지 않게 갱신.
  await prisma.member.updateMany({
    where: { roomId: input.roomId, userUuid: input.userUuid },
    data: { lastReadAt: msg.createdAt },
  })
  const title = await getMemberTitle(input.roomId, input.userUuid)
  return toMessageResponse(msg, title)
}

// SYSTEM 메시지 저장 → MessageResponse. 트랜잭션 안에서 쓰려면 tx 클라이언트를 넘긴다.
export async function createSystemMessage(
  client: DbClient,
  roomId: number,
  caseId: number | null,
  content: string
): Promise<MessageResponse> {
  const msg = await client.message.create({
    data: {
      roomId,
      caseId,
      userUuid: null,
      photoId: null,
      type: "SYSTEM",
      content,
    },
    include: { user: true, photo: true },
  })
  return toMessageResponse(msg, null)
}
