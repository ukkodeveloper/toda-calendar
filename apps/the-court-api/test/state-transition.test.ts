import { describe, expect, it } from "vitest"

import { AppError } from "../src/errors.js"
import {
  assertCanEndStatement,
  assertCanEndTrial,
  assertCanStartTrial,
  caseStatusAfterVerdict,
} from "../src/domain/state-transition.js"

describe("assertCanStartTrial — DECLARED 만 고발 가능", () => {
  it("DECLARED → 통과", () => {
    expect(() => assertCanStartTrial("DECLARED")).not.toThrow()
  })

  it("ON_TRIAL → conflict(409)", () => {
    expect(() => assertCanStartTrial("ON_TRIAL")).toThrow(AppError)
    try {
      assertCanStartTrial("ON_TRIAL")
    } catch (e) {
      expect((e as AppError).statusCode).toBe(409)
      expect((e as AppError).code).toBe("CASE_NOT_DECLARED")
    }
  })

  it("CLOSED → conflict", () => {
    expect(() => assertCanStartTrial("CLOSED")).toThrow(AppError)
  })
})

describe("assertCanEndStatement — STATEMENT 에서만", () => {
  it("STATEMENT → 통과", () => {
    expect(() => assertCanEndStatement("STATEMENT")).not.toThrow()
  })

  it("VOTING → conflict", () => {
    expect(() => assertCanEndStatement("VOTING")).toThrow(AppError)
  })

  it("ENDED → conflict", () => {
    expect(() => assertCanEndStatement("ENDED")).toThrow(AppError)
  })
})

describe("assertCanEndTrial — VOTING 에서만", () => {
  it("VOTING → 통과", () => {
    expect(() => assertCanEndTrial("VOTING")).not.toThrow()
  })

  it("STATEMENT → conflict", () => {
    expect(() => assertCanEndTrial("STATEMENT")).toThrow(AppError)
  })

  it("ENDED → conflict(중복 선고 방지)", () => {
    expect(() => assertCanEndTrial("ENDED")).toThrow(AppError)
  })
})

describe("caseStatusAfterVerdict — 유죄 CLOSED / 무죄 DECLARED 복귀", () => {
  it("GUILTY → CLOSED", () => {
    expect(caseStatusAfterVerdict("GUILTY")).toBe("CLOSED")
  })

  it("NOT_GUILTY → DECLARED(재고발 가능)", () => {
    expect(caseStatusAfterVerdict("NOT_GUILTY")).toBe("DECLARED")
  })
})
