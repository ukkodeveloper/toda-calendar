import { describe, expect, it } from "vitest"

import { createTokenBucket } from "../src/rate-limit.js"

describe("createTokenBucket", () => {
  it("허용: capacity 만큼 즉시 연속 소비", () => {
    const b = createTokenBucket(5, 400, 0)
    for (let i = 0; i < 5; i++) expect(b.tryConsume(0)).toBe(true)
  })

  it("차단: capacity 초과분은 같은 순간에 거부", () => {
    const b = createTokenBucket(5, 400, 0)
    for (let i = 0; i < 5; i++) b.tryConsume(0)
    expect(b.tryConsume(0)).toBe(false)
  })

  it("보충: refillMs 경과마다 토큰 1개 회복", () => {
    const b = createTokenBucket(5, 400, 0)
    for (let i = 0; i < 5; i++) b.tryConsume(0)
    expect(b.tryConsume(0)).toBe(false)
    // 400ms 뒤 토큰 1개 회복 → 1회 허용, 그 다음은 다시 거부.
    expect(b.tryConsume(400)).toBe(true)
    expect(b.tryConsume(400)).toBe(false)
  })

  it("상한: 오래 쉬어도 capacity 를 넘겨 쌓이지 않음", () => {
    const b = createTokenBucket(5, 400, 0)
    for (let i = 0; i < 5; i++) b.tryConsume(0)
    // 아주 긴 유휴(100초) 뒤에도 최대 5개까지만.
    for (let i = 0; i < 5; i++) expect(b.tryConsume(100_000)).toBe(true)
    expect(b.tryConsume(100_000)).toBe(false)
  })
})
