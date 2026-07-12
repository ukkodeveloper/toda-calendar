import { describe, expect, it } from "vitest"

import { parseMessagesQuery } from "../src/cursor.js"

describe("parseMessagesQuery", () => {
  it("빈 쿼리 → 커서 없음, limit 기본값", () => {
    expect(parseMessagesQuery({})).toEqual({
      afterSeq: undefined,
      afterId: undefined,
      caseId: undefined,
      limit: 200,
    })
  })

  it("afterSeq 우선 — 신규 커서가 있으면 레거시 after 는 무시", () => {
    const q = parseMessagesQuery({ afterSeq: "10", after: "999" })
    expect(q.afterSeq).toBe(10)
    expect(q.afterId).toBeUndefined()
  })

  it("레거시 after 는 afterSeq 없을 때만 해석", () => {
    const q = parseMessagesQuery({ after: "42" })
    expect(q.afterSeq).toBeUndefined()
    expect(q.afterId).toBe(42)
  })

  it("caseId 파싱", () => {
    expect(parseMessagesQuery({ caseId: "7" }).caseId).toBe(7)
  })

  it("limit 은 maxLimit 로 상한", () => {
    expect(parseMessagesQuery({ limit: "5000" }).limit).toBe(200)
    expect(parseMessagesQuery({ limit: "50" }).limit).toBe(50)
  })

  it("NaN·음수·0 은 검증 에러(throw)", () => {
    expect(() => parseMessagesQuery({ afterSeq: "abc" })).toThrow()
    expect(() => parseMessagesQuery({ after: "-1" })).toThrow()
    expect(() => parseMessagesQuery({ limit: "0" })).toThrow()
    expect(() => parseMessagesQuery({ caseId: "1.5" })).toThrow()
  })
})
