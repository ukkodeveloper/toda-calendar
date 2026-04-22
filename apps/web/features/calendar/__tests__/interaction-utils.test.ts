import test from "node:test"
import assert from "node:assert/strict"

import {
  calendarInteractionUi,
  exceedsTapSlop,
  isActivationKey,
} from "../utils/interactions"

test("exceedsTapSlop ignores small pointer drift", () => {
  assert.equal(
    exceedsTapSlop(
      { x: 100, y: 100 },
      { x: 104, y: 106 },
      calendarInteractionUi.tapSlop
    ),
    false
  )
})

test("exceedsTapSlop flags large movement", () => {
  assert.equal(
    exceedsTapSlop(
      { x: 100, y: 100 },
      { x: 112, y: 112 },
      calendarInteractionUi.tapSlop
    ),
    true
  )
})

test("isActivationKey recognizes keyboard press keys", () => {
  assert.equal(isActivationKey("Enter"), true)
  assert.equal(isActivationKey(" "), true)
  assert.equal(isActivationKey("Space"), false)
  assert.equal(isActivationKey("Escape"), false)
})
