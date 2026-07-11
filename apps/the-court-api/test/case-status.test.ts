import { describe, expect, it } from "vitest"

import { deriveCaseUiStatus } from "../src/domain/case-status.js"

describe("deriveCaseUiStatus — 4단 파생(등록됨/재판중/판결/재판완료)", () => {
  it("재판 없음(DECLARED, trial null) → 등록됨", () => {
    expect(
      deriveCaseUiStatus({
        caseStatus: "DECLARED",
        trialStatus: null,
        verdict: null,
      })
    ).toBe("REGISTERED")
  })

  it("최후진술(ON_TRIAL, STATEMENT) → 재판중", () => {
    expect(
      deriveCaseUiStatus({
        caseStatus: "ON_TRIAL",
        trialStatus: "STATEMENT",
        verdict: null,
      })
    ).toBe("ON_TRIAL")
  })

  it("평결(ON_TRIAL, VOTING) → 판결", () => {
    expect(
      deriveCaseUiStatus({
        caseStatus: "ON_TRIAL",
        trialStatus: "VOTING",
        verdict: null,
      })
    ).toBe("JUDGING")
  })

  it("유죄 종결(CLOSED, ENDED, GUILTY) → 재판완료", () => {
    expect(
      deriveCaseUiStatus({
        caseStatus: "CLOSED",
        trialStatus: "ENDED",
        verdict: "GUILTY",
      })
    ).toBe("CONCLUDED")
  })

  // 핵심 경계: 무죄면 caseStatus 는 DECLARED 로 복귀하지만 최신 Trial 은 ENDED.
  // → "재판완료(무죄)"로 잡혀야 하고, 순수 "등록됨"과 섞이면 안 된다.
  it("무죄 복귀(DECLARED, ENDED, NOT_GUILTY) → 재판완료 (등록됨 아님)", () => {
    const result = deriveCaseUiStatus({
      caseStatus: "DECLARED",
      trialStatus: "ENDED",
      verdict: "NOT_GUILTY",
    })
    expect(result).toBe("CONCLUDED")
    expect(result).not.toBe("REGISTERED")
  })

  // 무죄 복귀 후 재고발 → 새 Trial(STATEMENT)이 최신 → 다시 재판중.
  it("무죄 후 재고발(ON_TRIAL, STATEMENT) → 재판중", () => {
    expect(
      deriveCaseUiStatus({
        caseStatus: "ON_TRIAL",
        trialStatus: "STATEMENT",
        verdict: null,
      })
    ).toBe("ON_TRIAL")
  })
})
