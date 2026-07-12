import type {
  CaseCreateResponse,
  CaseStatus,
  CaseSummary,
  CaseTrialResponse,
} from "@workspace/contracts"
import { createCaseRequestSchema } from "@workspace/contracts"
import { Hono } from "hono"

import { type AppEnv, requireUser } from "../context.js"
import { prisma } from "../db.js"
import { conflict, notFound, userNotFound } from "../errors.js"
import { emitChatMessage } from "../ws/hub.js"
import { createSystemMessage } from "../chat.js"
import { toCaseDetail, toCaseSummary } from "../mappers.js"
import {
  isUniqueViolation,
  isUserForeignKeyViolation,
} from "../prisma-errors.js"

// 사건 — 공표·목록·상세. 4단 UI status 는 CaseSummary 필드에서 클라가 파생.
export const caseRoutes = new Hono<AppEnv>()

const latestTrial = { orderBy: { id: "desc" }, take: 1 } as const
const withDefendantAndTrial = {
  trials: latestTrial,
  defendant: { select: { nickname: true } },
} as const

// GET /api/rooms/:roomId/cases[?status] — status 지정 시 해당 status, 미지정 시 진행중(CLOSED 제외).
caseRoutes.get("/rooms/:roomId/cases", async (c) => {
  const roomId = Number(c.req.param("roomId"))
  const status = c.req.query("status") as CaseStatus | undefined

  const cases = await prisma.case.findMany({
    where: { roomId, ...(status ? { status } : { status: { not: "CLOSED" } }) },
    include: withDefendantAndTrial,
    orderBy: { id: "desc" },
  })
  const result: CaseSummary[] = cases.map((cs) =>
    toCaseSummary(cs, cs.defendant.nickname)
  )
  return c.json(result)
})

// GET /api/rooms/:roomId/cases/all — 전체(종료 포함).
caseRoutes.get("/rooms/:roomId/cases/all", async (c) => {
  const roomId = Number(c.req.param("roomId"))
  const cases = await prisma.case.findMany({
    where: { roomId },
    include: withDefendantAndTrial,
    orderBy: { id: "desc" },
  })
  const result: CaseSummary[] = cases.map((cs) =>
    toCaseSummary(cs, cs.defendant.nickname)
  )
  return c.json(result)
})

// POST /api/rooms/:roomId/cases — 공표(1방1인1활성사건 = partial unique 최종방어).
caseRoutes.post("/rooms/:roomId/cases", async (c) => {
  const uuid = requireUser(c)
  const roomId = Number(c.req.param("roomId"))
  const body = createCaseRequestSchema.parse(await c.req.json())

  // 공표는 defendant(User) FK 를 쓴다 — 존재확인으로 stale uuid 를 401 로 끊고, nickname 도 여기서.
  const user = await prisma.user.findUnique({
    where: { uuid },
    select: { nickname: true },
  })
  if (!user) throw userNotFound()

  try {
    const { created, sys } = await prisma.$transaction(async (tx) => {
      const created = await tx.case.create({
        data: {
          roomId,
          defendantUuid: uuid,
          title: body.title,
          content: body.content,
          startDate: new Date(body.startDate),
          deadline: new Date(body.deadline),
        },
      })
      // 공표는 방 본문(ROOM) 공지 — caseId=null. 방 전원이 본문에서 본다(decision §3).
      const sys = await createSystemMessage(
        tx,
        roomId,
        null,
        `📢 ${user.nickname}님이 '${body.title}' 공약을 공표했습니다`
      )
      return { created, sys }
    })

    // 커밋 성공 후 전파(write → broadcast).
    emitChatMessage(roomId, sys)

    return c.json(
      {
        caseId: created.id,
        status: created.status,
        createdAt: created.createdAt.toISOString(),
      } satisfies CaseCreateResponse,
      201
    )
  } catch (e) {
    if (isUniqueViolation(e, "case_one_active")) {
      throw conflict(
        "CASE_ALREADY_ACTIVE",
        "이미 진행 중인 활성 사건이 있습니다"
      )
    }
    if (isUserForeignKeyViolation(e)) throw userNotFound() // 존재확인~write 사이 삭제 race 방어
    throw e
  }
})

// GET /api/cases/:caseId — 개별 사건 세부.
caseRoutes.get("/cases/:caseId", async (c) => {
  const caseId = Number(c.req.param("caseId"))
  const cs = await prisma.case.findUnique({
    where: { id: caseId },
    include: withDefendantAndTrial,
  })
  if (!cs) throw notFound("CASE_NOT_FOUND", "사건을 찾을 수 없습니다")
  return c.json(toCaseDetail(cs, cs.defendant.nickname))
})

// GET /api/cases/:caseId/trial — 최신(현재) 재판.
caseRoutes.get("/cases/:caseId/trial", async (c) => {
  const caseId = Number(c.req.param("caseId"))
  const trial = await prisma.trial.findFirst({
    where: { caseId },
    orderBy: { id: "desc" },
  })
  if (!trial) throw notFound("TRIAL_NOT_FOUND", "재판이 아직 없습니다")
  return c.json({
    trialId: trial.id,
    caseId,
    status: trial.status,
  } satisfies CaseTrialResponse)
})
