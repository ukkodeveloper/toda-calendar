import { z } from "zod"

// 사건(Case) 생애 status — 저장 enum. 4단 UI(등록됨/재판중/판결/재판완료)는 파생.
export const caseStatusSchema = z.enum(["DECLARED", "ON_TRIAL", "CLOSED"])

// 재판(Trial) 진행 status.
export const trialStatusSchema = z.enum(["STATEMENT", "VOTING", "ENDED"])

// 평결 결과.
export const verdictSchema = z.enum(["GUILTY", "NOT_GUILTY"])

// 방별 칭호.
export const userTitleSchema = z.enum([
  "CITIZEN",
  "MODEL_CITIZEN",
  "EX_CONVICT",
])

export type CaseStatus = z.infer<typeof caseStatusSchema>
export type TrialStatus = z.infer<typeof trialStatusSchema>
export type Verdict = z.infer<typeof verdictSchema>
export type UserTitle = z.infer<typeof userTitleSchema>
