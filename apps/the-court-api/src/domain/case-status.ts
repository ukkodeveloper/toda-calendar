import type { CaseStatus, TrialStatus, Verdict } from "@workspace/contracts"

// 사건 4단 UI status = CaseStatus × TrialStatus 파생(저장 enum 아님).
//   등록됨   REGISTERED = DECLARED & 재판 없음
//   재판중   ON_TRIAL   = trialStatus STATEMENT
//   판결     JUDGING    = trialStatus VOTING
//   재판완료 CONCLUDED  = trialStatus ENDED (+ verdict 로 유/무죄)
// 무죄면 caseStatus 가 DECLARED 로 복귀하므로, verdict+trialStatus 로만 "등록됨"과 구분된다.
export type CaseUiStatus = "REGISTERED" | "ON_TRIAL" | "JUDGING" | "CONCLUDED"

export function deriveCaseUiStatus(input: {
  caseStatus: CaseStatus
  trialStatus: TrialStatus | null
  verdict: Verdict | null
}): CaseUiStatus {
  // TODO(슬라이스 02): 파생 구현 + 테스트(무죄복귀 사건이 REGISTERED 와 안 섞이는지).
  void input
  throw new Error("deriveCaseUiStatus: TODO 슬라이스 02")
}
