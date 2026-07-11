import { reportRequestSchema } from "@workspace/contracts"
import { Hono } from "hono"

import { type AppEnv, requireUser } from "../context.js"
import { notImplemented } from "../errors.js"

// 목격 등록(고발) → 재판 개시. 증거사진 필수(photoId).
export const reportRoutes = new Hono<AppEnv>()

// POST /api/reports — 고발 → reportResponseSchema
//   (+ case ON_TRIAL 전이, Trial 생성, 방에 🚨 SYSTEM 메시지 + trial:started broadcast)
reportRoutes.post("/reports", async (c) => {
  const uuid = requireUser(c)
  const body = reportRequestSchema.parse(await c.req.json())
  void uuid
  void body
  // TODO(슬라이스 02) $transaction:
  //   assertCanStartTrial(case.status) → case.status=ON_TRIAL → Trial.create(STATEMENT, statementEndsAt)
  //   → Report.create(photoId) → SYSTEM 메시지 저장
  //   then broadcast: emitChatMessage(roomId, sys) + emitTrialStarted(roomId, {...})
  //   → reportResponseSchema
  throw notImplemented("POST /api/reports")
})
