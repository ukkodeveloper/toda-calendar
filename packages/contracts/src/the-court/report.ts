import { z } from "zod"

import { caseStatusSchema, trialStatusSchema } from "./enums.js"

// POST /reports — 목격 등록(고발) → 재판 개시. 증거사진 필수(photoId).
export const reportRequestSchema = z.object({
  caseId: z.number().int(),
  photoId: z.number().int(),
  content: z.string().trim().max(500).optional(),
})

export const reportResponseSchema = z.object({
  reportId: z.number().int(),
  caseId: z.number().int(),
  trialId: z.number().int(),
  caseStatus: caseStatusSchema, // ON_TRIAL
  trialStatus: trialStatusSchema, // STATEMENT
})

export type ReportRequest = z.infer<typeof reportRequestSchema>
export type ReportResponse = z.infer<typeof reportResponseSchema>
