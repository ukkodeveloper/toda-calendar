import { z } from "zod"

import {
  caseStatusSchema,
  trialStatusSchema,
  userTitleSchema,
  verdictSchema,
} from "./enums.js"

// GET /trials/{id}/participants — 현행범(피고) + 목격자(배심원).
export const participantSchema = z.object({
  uuid: z.string(),
  nickname: z.string(),
  isDefendant: z.boolean(),
})

export const trialParticipantsResponseSchema = z.object({
  trialId: z.number().int(),
  caseId: z.number().int(),
  status: trialStatusSchema,
  defendant: participantSchema,
  witnesses: z.array(participantSchema),
  statementEndsAt: z.string(), // 표시용 타이머 origin (비권위)
})

// POST /trials/{id}/votes — 유죄/무죄. 본인 투표 불가(핸들러 검증).
export const voteRequestSchema = z.object({
  guilty: z.boolean(),
})

export const voteResponseSchema = z.object({
  trialId: z.number().int(),
  guilty: z.boolean(),
  votedCount: z.number().int().nonnegative(),
  totalVoters: z.number().int().nonnegative(),
})

// GET /trials/{id}/votes/result — 집계 + 본인 투표 상태.
export const voteResultResponseSchema = z.object({
  trialId: z.number().int(),
  status: trialStatusSchema,
  guiltyCount: z.number().int().nonnegative(),
  notGuiltyCount: z.number().int().nonnegative(),
  votedCount: z.number().int().nonnegative(),
  totalVoters: z.number().int().nonnegative(),
  verdict: verdictSchema.nullable(), // 종료 전이면 null
  hasVoted: z.boolean(),
  myVote: z.boolean().nullable(), // 안 했으면 null
  remainingSeconds: z.number().int(), // 표시용(비권위)
})

// POST /trials/{id}/statement/end — 최후진술 종료 → VOTING.
export const trialStatusResponseSchema = z.object({
  trialId: z.number().int(),
  status: trialStatusSchema,
})

// POST /trials/{id}/end — 선고. 피고 칭호 변경 포함.
export const defendantSummarySchema = z.object({
  uuid: z.string(),
  nickname: z.string(),
  newTitle: userTitleSchema,
  convictionCount: z.number().int().nonnegative(),
})

export const trialEndResponseSchema = z.object({
  trialId: z.number().int(),
  status: trialStatusSchema, // ENDED
  verdict: verdictSchema,
  guiltyCount: z.number().int().nonnegative(),
  notGuiltyCount: z.number().int().nonnegative(),
  defendant: defendantSummarySchema,
  caseStatus: caseStatusSchema, // 유죄 CLOSED / 무죄 DECLARED 복귀
})

export type Participant = z.infer<typeof participantSchema>
export type TrialParticipantsResponse = z.infer<
  typeof trialParticipantsResponseSchema
>
export type VoteRequest = z.infer<typeof voteRequestSchema>
export type VoteResponse = z.infer<typeof voteResponseSchema>
export type VoteResultResponse = z.infer<typeof voteResultResponseSchema>
export type TrialStatusResponse = z.infer<typeof trialStatusResponseSchema>
export type DefendantSummary = z.infer<typeof defendantSummarySchema>
export type TrialEndResponse = z.infer<typeof trialEndResponseSchema>
