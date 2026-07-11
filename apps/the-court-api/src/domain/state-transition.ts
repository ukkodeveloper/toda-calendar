import type { CaseStatus, TrialStatus, Verdict } from "@workspace/contracts"

import { conflict } from "../errors.js"

// 상태전이 가드 — 순수 함수. 유스케이스 $transaction 안에서 호출해 불변식을 지킨다.
// 상태머신(PRD 2.7): DECLARED → ON_TRIAL(STATEMENT) → VOTING → ENDED.
// 불법 전이는 conflict(409) 로 throw → 바깥(app.onError)에서 HTTP 매핑.

// 고발 → 재판 개시. DECLARED 인 사건만 가능.
//   (사건당 활성재판 1개 불변식은 DB partial unique 가 최종 방어 — 여긴 앞단 가드.)
export function assertCanStartTrial(caseStatus: CaseStatus): void {
  if (caseStatus !== "DECLARED") {
    throw conflict(
      "CASE_NOT_DECLARED",
      `고발은 등록됨(DECLARED) 사건만 가능합니다 (현재: ${caseStatus})`
    )
  }
}

// 최후진술 종료 → 평결. STATEMENT 에서만.
export function assertCanEndStatement(trialStatus: TrialStatus): void {
  if (trialStatus !== "STATEMENT") {
    throw conflict(
      "TRIAL_NOT_IN_STATEMENT",
      `최후진술 종료는 최후진술(STATEMENT) 단계에서만 가능합니다 (현재: ${trialStatus})`
    )
  }
}

// 평결 마감 → 선고. VOTING 에서만(최후진술 없이 바로 종료해도 VOTING 을 경유한다).
export function assertCanEndTrial(trialStatus: TrialStatus): void {
  if (trialStatus !== "VOTING") {
    throw conflict(
      "TRIAL_NOT_IN_VOTING",
      `선고는 평결(VOTING) 단계에서만 가능합니다 (현재: ${trialStatus})`
    )
  }
}

// 선고 결과 → 사건 status. 유죄 CLOSED / 무죄 DECLARED 복귀(재고발 가능).
export function caseStatusAfterVerdict(verdict: Verdict): CaseStatus {
  return verdict === "GUILTY" ? "CLOSED" : "DECLARED"
}
