import type { ReportResponse } from "@workspace/contracts"
import { reportRequestSchema } from "@workspace/contracts"
import { Hono } from "hono"

import { type AppEnv, requireExistingUser } from "../context.js"
import { createSystemMessage } from "../chat.js"
import { prisma } from "../db.js"
import { assertCanStartTrial } from "../domain/state-transition.js"
import { conflict, notFound, userNotFound } from "../errors.js"
import { STATEMENT_WINDOW_MS } from "../mappers.js"
import {
  isUniqueViolation,
  isUserForeignKeyViolation,
} from "../prisma-errors.js"
import { emitChatMessage, emitTrialStarted } from "../ws/hub.js"

// 목격 등록(고발) → 재판 개시. 증거사진 필수(photoId).
export const reportRoutes = new Hono<AppEnv>()

// POST /api/reports — 고발(단일 트랜잭션: 사건 ON_TRIAL + Trial + Report + 시스템메시지) → broadcast.
reportRoutes.post("/reports", async (c) => {
  const uuid = await requireExistingUser(c)
  const body = reportRequestSchema.parse(await c.req.json())

  const target = await prisma.case.findUnique({
    where: { id: body.caseId },
    include: { defendant: { select: { nickname: true } } },
  })
  if (!target) throw notFound("CASE_NOT_FOUND", "사건을 찾을 수 없습니다")
  assertCanStartTrial(target.status) // DECLARED 만 — 재고발은 활성재판 없을 때만

  const statementEndsAt = new Date(Date.now() + STATEMENT_WINDOW_MS)

  try {
    const { report, trial, sys } = await prisma.$transaction(async (tx) => {
      await tx.case.update({
        where: { id: body.caseId },
        data: { status: "ON_TRIAL" },
      })
      const trial = await tx.trial.create({
        data: { caseId: body.caseId, status: "STATEMENT", statementEndsAt },
      })
      const report = await tx.report.create({
        data: {
          caseId: body.caseId,
          reporterUuid: uuid,
          photoId: body.photoId,
          content: body.content ?? null,
        },
      })
      // 고발은 방 본문(ROOM) 공지 — caseId=null. 카톡식 "🚨 고발" 을 방 전원이 본문에서(decision §3).
      // 딥링크(재판 보기)는 trial:started(caseId·trialId) 도메인 이벤트가 담당.
      const sys = await createSystemMessage(
        tx,
        target.roomId,
        null,
        `🚨 ${target.defendant.nickname}님이 고발당했습니다`
      )
      return { report, trial, sys }
    })

    // 커밋 성공 후 전파(write → broadcast).
    emitChatMessage(target.roomId, sys)
    emitTrialStarted(target.roomId, {
      caseId: body.caseId,
      trialId: trial.id,
      caseStatus: "ON_TRIAL",
      trialStatus: "STATEMENT",
    })

    return c.json(
      {
        reportId: report.id,
        caseId: body.caseId,
        trialId: trial.id,
        caseStatus: "ON_TRIAL",
        trialStatus: "STATEMENT",
      } satisfies ReportResponse,
      201
    )
  } catch (e) {
    // 동시 고발 race — trial_one_active_per_case partial unique 위반(23505)을 409 로.
    if (isUniqueViolation(e, "trial_one_active")) {
      throw conflict("TRIAL_ALREADY_ACTIVE", "이미 재판이 진행 중입니다")
    }
    if (isUserForeignKeyViolation(e)) throw userNotFound() // 존재확인~write 사이 삭제 race 방어
    throw e
  }
})
