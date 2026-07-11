import { describe, expect, it } from "vitest"

import { computeVerdict } from "../src/domain/verdict.js"

describe("computeVerdict — 과반 초과=유죄, 동점·0표·과반미달=무죄", () => {
  it("과반 초과(3:1) → 유죄", () => {
    expect(computeVerdict({ guiltyCount: 3, notGuiltyCount: 1 })).toBe("GUILTY")
  })

  it("과반 경계(2:1, guilty가 notGuilty보다 1 많음) → 유죄", () => {
    expect(computeVerdict({ guiltyCount: 2, notGuiltyCount: 1 })).toBe("GUILTY")
  })

  it("최소 유죄(1:0) → 유죄", () => {
    expect(computeVerdict({ guiltyCount: 1, notGuiltyCount: 0 })).toBe("GUILTY")
  })

  it("동점(2:2) → 무죄(기본)", () => {
    expect(computeVerdict({ guiltyCount: 2, notGuiltyCount: 2 })).toBe(
      "NOT_GUILTY"
    )
  })

  it("동점 최소(1:1) → 무죄", () => {
    expect(computeVerdict({ guiltyCount: 1, notGuiltyCount: 1 })).toBe(
      "NOT_GUILTY"
    )
  })

  it("0표(0:0) → 무죄", () => {
    expect(computeVerdict({ guiltyCount: 0, notGuiltyCount: 0 })).toBe(
      "NOT_GUILTY"
    )
  })

  it("과반 미달(1:3) → 무죄", () => {
    expect(computeVerdict({ guiltyCount: 1, notGuiltyCount: 3 })).toBe(
      "NOT_GUILTY"
    )
  })
})
