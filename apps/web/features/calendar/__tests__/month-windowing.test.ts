import assert from "node:assert/strict"
import test from "node:test"

import {
  createInitialMonthRange,
  estimateMonthSectionHeight,
  getMonthRenderWindow,
} from "../utils/date"

test("getMonthRenderWindow centers around the active month when enough range exists", () => {
  const monthStarts = createInitialMonthRange(new Date(2026, 3, 21), 3, 4)

  const window = getMonthRenderWindow(monthStarts, "2026-04-01", 2, 3)

  assert.deepEqual(window, {
    endIndex: 6,
    startIndex: 1,
  })
})

test("getMonthRenderWindow clamps at the start of the loaded range", () => {
  const monthStarts = createInitialMonthRange(new Date(2026, 3, 21), 1, 2)

  const window = getMonthRenderWindow(monthStarts, "2026-03-01", 2, 3)

  assert.deepEqual(window, {
    endIndex: 3,
    startIndex: 0,
  })
})

test("estimateMonthSectionHeight scales with viewport width and week count", () => {
  const compactMonthHeight = estimateMonthSectionHeight(5, 360)
  const spaciousMonthHeight = estimateMonthSectionHeight(6, 768)

  assert.equal(compactMonthHeight >= 396, true)
  assert.equal(spaciousMonthHeight > compactMonthHeight, true)
})
