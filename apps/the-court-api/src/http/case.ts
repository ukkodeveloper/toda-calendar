import { createCaseRequestSchema } from "@workspace/contracts"
import { Hono } from "hono"

import { type AppEnv, requireUser } from "../context.js"
import { notImplemented } from "../errors.js"

// 사건 — 공표·목록·상세. 4단 UI status 는 CaseSummary 필드에서 클라가 파생.
export const caseRoutes = new Hono<AppEnv>()

// GET /api/rooms/:roomId/cases[?status] — 사건 목록
//   status=DECLARED → 고발 대상 선택(가벼운 witnessTargetList)
//   미지정          → 진행중 전체(caseSummaryList)
//   → caseSummaryListSchema (또는 status 필터 시 witnessTargetListSchema)
caseRoutes.get("/rooms/:roomId/cases", (c) => {
  const roomId = Number(c.req.param("roomId"))
  const status = c.req.query("status")
  void roomId
  void status
  // TODO(슬라이스 02): Case @@index([roomId,status]) + 최신 Trial 조인(trialStatus·verdict·trialId) → caseSummaryListSchema
  throw notImplemented("GET /api/rooms/:roomId/cases")
})

// GET /api/rooms/:roomId/cases/all — 전체 사건(종료 포함) → caseSummaryListSchema
caseRoutes.get("/rooms/:roomId/cases/all", (c) => {
  const roomId = Number(c.req.param("roomId"))
  void roomId
  // TODO(슬라이스 02): 전체 사건 + 최신 Trial 파생 → caseSummaryListSchema
  throw notImplemented("GET /api/rooms/:roomId/cases/all")
})

// POST /api/rooms/:roomId/cases — 공표 → caseCreateResponseSchema (+ 방에 SYSTEM 메시지 broadcast)
caseRoutes.post("/rooms/:roomId/cases", async (c) => {
  const uuid = requireUser(c)
  const roomId = Number(c.req.param("roomId"))
  const body = createCaseRequestSchema.parse(await c.req.json())
  void uuid
  void roomId
  void body
  // TODO(슬라이스 02): 1방1인1활성사건(partial unique 최종방어, 위반 409) → prisma.case.create
  //   → SYSTEM 메시지 저장 → emitChatMessage(roomId, ...) → caseCreateResponseSchema
  throw notImplemented("POST /api/rooms/:roomId/cases")
})

// GET /api/cases/:caseId — 개별 사건 세부 → caseDetailResponseSchema
caseRoutes.get("/cases/:caseId", (c) => {
  const caseId = Number(c.req.param("caseId"))
  void caseId
  // TODO(슬라이스 02): 사건 + 최신 Trial → caseDetailResponseSchema
  throw notImplemented("GET /api/cases/:caseId")
})

// GET /api/cases/:caseId/trial — 최신(현재) 재판 → caseTrialResponseSchema
caseRoutes.get("/cases/:caseId/trial", (c) => {
  const caseId = Number(c.req.param("caseId"))
  void caseId
  // TODO(슬라이스 02): Trial @@index([caseId]) 최신 1건 → caseTrialResponseSchema (없으면 404)
  throw notImplemented("GET /api/cases/:caseId/trial")
})
