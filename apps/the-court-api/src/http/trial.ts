import { voteRequestSchema } from "@workspace/contracts"
import { Hono } from "hono"

import { type AppEnv, requireUser } from "../context.js"
import { notImplemented } from "../errors.js"

// 재판 — 참여자·투표·집계·최후진술 종료·선고. write=REST → 결과 WS broadcast.
export const trialRoutes = new Hono<AppEnv>()

// GET /api/trials/:trialId/participants — 현행범+목격자 → trialParticipantsResponseSchema
trialRoutes.get("/trials/:trialId/participants", (c) => {
  const trialId = Number(c.req.param("trialId"))
  void trialId
  // TODO(슬라이스 02): 사건 피고 + 방 멤버(피고 제외)=목격자 → trialParticipantsResponseSchema
  //   ENDED 재판도 응답(완료 재판 재열람 지원).
  throw notImplemented("GET /api/trials/:trialId/participants")
})

// POST /api/trials/:trialId/votes — 투표(유죄/무죄) → voteResponseSchema (+ vote:updated broadcast)
trialRoutes.post("/trials/:trialId/votes", async (c) => {
  const uuid = requireUser(c)
  const trialId = Number(c.req.param("trialId"))
  const body = voteRequestSchema.parse(await c.req.json())
  void uuid
  void trialId
  void body
  // TODO(슬라이스 02) $transaction: 본인투표 금지(피고=voter 면 409) → Vote upsert(@@unique 1인1표)
  //   → 집계 → emitVoteUpdated(trialId, {...}) → voteResponseSchema
  throw notImplemented("POST /api/trials/:trialId/votes")
})

// GET /api/trials/:trialId/votes/result — 집계 + 본인 투표상태 → voteResultResponseSchema
trialRoutes.get("/trials/:trialId/votes/result", (c) => {
  const uuid = requireUser(c)
  const trialId = Number(c.req.param("trialId"))
  void uuid
  void trialId
  // TODO(슬라이스 02): 집계 + hasVoted/myVote(voterUuid=요청자) + remainingSeconds(statementEndsAt 파생, 비권위)
  //   → voteResultResponseSchema
  throw notImplemented("GET /api/trials/:trialId/votes/result")
})

// POST /api/trials/:trialId/statement/end — 최후진술 종료 → trialStatusResponseSchema
//   (+ trial:status VOTING broadcast, 방에 SYSTEM 메시지)
trialRoutes.post("/trials/:trialId/statement/end", (c) => {
  const uuid = requireUser(c)
  const trialId = Number(c.req.param("trialId"))
  void uuid
  void trialId
  // TODO(슬라이스 02): assertCanEndStatement → status VOTING → emitTrialStatus → trialStatusResponseSchema
  throw notImplemented("POST /api/trials/:trialId/statement/end")
})

// POST /api/trials/:trialId/end — 선고 ⭐ → trialEndResponseSchema (+ verdict:revealed broadcast)
trialRoutes.post("/trials/:trialId/end", (c) => {
  const uuid = requireUser(c)
  const trialId = Number(c.req.param("trialId"))
  void uuid
  void trialId
  // TODO(슬라이스 02) $transaction:
  //   assertCanEndTrial(VOTING) → computeVerdict(집계) → Trial.status=ENDED, verdict
  //   → caseStatusAfterVerdict(유죄 CLOSED/무죄 DECLARED) → 유죄면 Member.convictionCount++ & title
  //   then emitVerdictRevealed(roomId, trialId, {...}) → trialEndResponseSchema
  throw notImplemented("POST /api/trials/:trialId/end")
})
