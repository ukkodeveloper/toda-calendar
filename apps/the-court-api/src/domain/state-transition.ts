import type { CaseStatus, TrialStatus, Verdict } from "@workspace/contracts"

// 상태전이 가드 — 순수 함수. 유스케이스 $transaction 안에서 호출해 불변식을 지킨다.
// 상태머신(PRD 2.7): DECLARED → ON_TRIAL(STATEMENT) → VOTING → ENDED.

// 고발 → 재판 개시. DECLARED 인 사건만 가능.
export function assertCanStartTrial(caseStatus: CaseStatus): void {
  // TODO(슬라이스 02): DECLARED 아니면 conflict. (활성재판 1개 불변식은 DB partial unique 가 최종 방어)
  void caseStatus
  throw new Error("assertCanStartTrial: TODO 슬라이스 02")
}

// 최후진술 종료 → 평결. STATEMENT 에서만.
export function assertCanEndStatement(trialStatus: TrialStatus): void {
  // TODO(슬라이스 02): STATEMENT 아니면 conflict.
  void trialStatus
  throw new Error("assertCanEndStatement: TODO 슬라이스 02")
}

// 평결 마감 → 선고. VOTING 에서만(최후진술 없이 바로 종료도 가능하나 그때도 VOTING 경유).
export function assertCanEndTrial(trialStatus: TrialStatus): void {
  // TODO(슬라이스 02): VOTING 아니면 conflict.
  void trialStatus
  throw new Error("assertCanEndTrial: TODO 슬라이스 02")
}

// 선고 결과 → 사건 status. 유죄 CLOSED / 무죄 DECLARED 복귀(재고발 가능).
export function caseStatusAfterVerdict(verdict: Verdict): CaseStatus {
  // TODO(슬라이스 02): GUILTY→CLOSED, NOT_GUILTY→DECLARED.
  void verdict
  throw new Error("caseStatusAfterVerdict: TODO 슬라이스 02")
}
