import type { CaseStatus, TrialStatus, Verdict } from "@workspace/contracts"

// 사건 4단 UI status = CaseStatus × 최신 Trial(status/verdict) 파생(저장 enum 아님).
//   등록됨   REGISTERED = 재판 없음(trialStatus null)
//   재판중   ON_TRIAL   = 최신 trialStatus STATEMENT
//   판결     JUDGING    = 최신 trialStatus VOTING
//   재판완료 CONCLUDED  = 최신 trialStatus ENDED (+ verdict 로 유/무죄)
// 핵심: 무죄면 caseStatus 가 DECLARED 로 복귀하지만 최신 Trial 은 ENDED 로 남으므로
//   trialStatus 로 판정하면 "재판완료(무죄)"가 순수 "등록됨"과 안 섞인다.
//   (재고발되면 새 Trial 이 STATEMENT 로 생겨 최신이 바뀌고 → ON_TRIAL 로 넘어간다.)
export type CaseUiStatus = "REGISTERED" | "ON_TRIAL" | "JUDGING" | "CONCLUDED"

export function deriveCaseUiStatus(input: {
  caseStatus: CaseStatus
  trialStatus: TrialStatus | null
  verdict: Verdict | null
}): CaseUiStatus {
  switch (input.trialStatus) {
    case null:
      return "REGISTERED"
    case "STATEMENT":
      return "ON_TRIAL"
    case "VOTING":
      return "JUDGING"
    case "ENDED":
      return "CONCLUDED"
  }
}
