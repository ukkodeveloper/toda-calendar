import { z } from "zod"

import { caseStatusSchema, trialStatusSchema, verdictSchema } from "./enums.js"

// 사건 목록·상세에 얹히는 피고 요약.
export const defendantRefSchema = z.object({
  uuid: z.string(),
  nickname: z.string(),
})

// POST /rooms/{id}/cases — 공표. 날짜 2개(시작일·마감일), "기간"=둘 사이.
export const createCaseRequestSchema = z.object({
  title: z.string().trim().min(1).max(80),
  content: z.string().trim().min(1).max(500),
  startDate: z.string(), // ISO-8601
  deadline: z.string(), // ISO-8601
})

export const caseCreateResponseSchema = z.object({
  caseId: z.number().int(),
  status: caseStatusSchema,
  createdAt: z.string(),
})

// GET /rooms/{id}/cases[?status] · /cases/all — 4단 UI 파생용 필드 포함.
// 4단 status = 파생(저장 X):
//   등록됨   = caseStatus DECLARED & trialStatus null
//   재판중   = trialStatus STATEMENT | VOTING
//   판결     = trialStatus VOTING
//   재판완료 = trialStatus ENDED (+ verdict 로 유/무죄)
export const caseSummarySchema = z.object({
  caseId: z.number().int(),
  title: z.string(),
  caseStatus: caseStatusSchema,
  trialStatus: trialStatusSchema.nullable(), // 재판 없으면 null
  verdict: verdictSchema.nullable(), // ENDED 일 때만
  defendant: defendantRefSchema,
  startDate: z.string(),
  deadline: z.string(),
  trialId: z.number().int().nullable(), // 재판 진입용
})

export const caseSummaryListSchema = z.array(caseSummarySchema)

// GET /cases/{id} — 개별 사건 세부.
export const caseDetailResponseSchema = z.object({
  caseId: z.number().int(),
  title: z.string(),
  content: z.string(),
  caseStatus: caseStatusSchema,
  defendant: defendantRefSchema,
  startDate: z.string(),
  deadline: z.string(),
  trialStatus: trialStatusSchema.nullable(),
  trialId: z.number().int().nullable(),
  verdict: verdictSchema.nullable(),
})

// GET /cases/{id}/trial — 최신(현재) 재판.
export const caseTrialResponseSchema = z.object({
  trialId: z.number().int(),
  caseId: z.number().int(),
  status: trialStatusSchema,
})

// GET /rooms/{id}/cases?status=DECLARED — 고발 대상 선택용(가벼운 목록).
export const witnessTargetCaseSchema = z.object({
  caseId: z.number().int(),
  title: z.string(),
  defendant: defendantRefSchema,
})

export const witnessTargetListSchema = z.array(witnessTargetCaseSchema)

export type DefendantRef = z.infer<typeof defendantRefSchema>
export type CreateCaseRequest = z.infer<typeof createCaseRequestSchema>
export type CaseCreateResponse = z.infer<typeof caseCreateResponseSchema>
export type CaseSummary = z.infer<typeof caseSummarySchema>
export type CaseSummaryList = z.infer<typeof caseSummaryListSchema>
export type CaseDetailResponse = z.infer<typeof caseDetailResponseSchema>
export type CaseTrialResponse = z.infer<typeof caseTrialResponseSchema>
export type WitnessTargetCase = z.infer<typeof witnessTargetCaseSchema>
export type WitnessTargetList = z.infer<typeof witnessTargetListSchema>
