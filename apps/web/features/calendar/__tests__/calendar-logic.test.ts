import test from "node:test"
import assert from "node:assert/strict"

import {
  calendarReducer,
  createInitialCalendarState,
} from "../model/calendar-state"
import type { CalendarDayRecord } from "../model/types"
import { parseCalendarSeed } from "../data/parse-calendar-seed"
import {
  buildMonthSection,
  createInitialMonthRange,
  expandMonthRange,
  parseIsoDate,
  toIsoDate,
} from "../utils/date"
import {
  createDefaultPreviewFilter,
  cyclePreviewMode,
  resolvePreviewModeAfterFilter,
  resolveVisiblePreviewType,
} from "../utils/preview"

const sampleRecord: CalendarDayRecord = {
  date: "2026-04-21",
  currentPreviewType: "photo",
  photo: {
    type: "photo",
    src: "/sample.svg",
    alt: "Sample",
    source: "seed",
  },
  doodle: {
    type: "doodle",
    strokes: [
      {
        color: "#5B4636",
        width: 3,
        points: [
          { x: 22, y: 72 },
          { x: 20, y: 44 },
          { x: 28, y: 24 },
          { x: 38, y: 18 },
          { x: 44, y: 30 },
          { x: 56, y: 30 },
          { x: 62, y: 18 },
          { x: 72, y: 24 },
          { x: 80, y: 44 },
          { x: 78, y: 72 },
          { x: 22, y: 72 },
        ],
      },
    ],
  },
  text: {
    type: "text",
    body: "Hello",
  },
}

test("parseCalendarSeed validates and returns records", () => {
  const parsed = parseCalendarSeed({
    records: [sampleRecord],
  })

  assert.equal(parsed.length, 1)
  assert.equal(parsed[0]?.date, "2026-04-21")
})

test("parseCalendarSeed rejects duplicate local dates", () => {
  assert.throws(
    () =>
      parseCalendarSeed({
        records: [
          sampleRecord,
          {
            ...sampleRecord,
            currentPreviewType: "text",
          },
        ],
      }),
    /Duplicate calendar day record/
  )
})

test("parseCalendarSeed rejects impossible local dates", () => {
  assert.throws(
    () =>
      parseCalendarSeed({
        records: [
          {
            ...sampleRecord,
            date: "2026-02-30",
          },
        ],
      }),
    /Invalid local date/
  )
})

test("cyclePreviewMode rotates only through enabled content types", () => {
  const nextType = cyclePreviewMode("photo", {
    photo: true,
    doodle: false,
    text: true,
  })

  assert.equal(nextType, "text")
})

test("resolveVisiblePreviewType falls back when current preview is filtered out", () => {
  const resolved = resolveVisiblePreviewType(sampleRecord, "photo", {
    photo: false,
    doodle: true,
    text: true,
  })

  assert.equal(resolved, null)
})

test("resolveVisiblePreviewType returns the active type when that slot exists", () => {
  const resolved = resolveVisiblePreviewType(sampleRecord, "photo", {
    photo: true,
    doodle: true,
    text: true,
  })

  assert.equal(resolved, "photo")
})

test("resolvePreviewModeAfterFilter keeps the current mode when possible", () => {
  const resolved = resolvePreviewModeAfterFilter("text", {
    photo: true,
    doodle: false,
    text: true,
  })

  assert.equal(resolved, "text")
})

test("resolvePreviewModeAfterFilter moves to the next enabled mode when needed", () => {
  const resolved = resolvePreviewModeAfterFilter("photo", {
    photo: false,
    doodle: true,
    text: true,
  })

  assert.equal(resolved, "doodle")
})

test("expandMonthRange prepends and appends month keys", () => {
  const base = createInitialMonthRange(new Date(2026, 3, 21), 1, 1)
  const withPast = expandMonthRange(base, "past", 2)
  const withFuture = expandMonthRange(base, "future", 2)

  assert.deepEqual(base, ["2026-03-01", "2026-04-01", "2026-05-01"])
  assert.equal(withPast[0], "2026-01-01")
  assert.equal(withFuture[withFuture.length - 1], "2026-07-01")
})

test("buildMonthSection creates a 7-column month grid", () => {
  const section = buildMonthSection("2026-04-01", "2026-04-21")

  assert.equal(section.weeks.length > 3, true)
  assert.equal(section.weeks[0]?.length, 7)
  assert.equal(section.monthLabel, "April 2026")
  assert.equal(section.weeks[0]?.[0]?.isPlaceholder, true)
  assert.equal(section.weeks[0]?.[0]?.date, null)
  assert.equal(section.weeks[0]?.[3]?.date, "2026-04-01")
})

test("parseIsoDate round-trips valid local dates", () => {
  assert.equal(toIsoDate(parseIsoDate("2026-02-28")), "2026-02-28")
  assert.equal(toIsoDate(parseIsoDate("2028-02-29")), "2028-02-29")
})

test("parseIsoDate rejects impossible local dates", () => {
  assert.throws(() => parseIsoDate("2026-02-30"), /Invalid local date/)
})

test("calendarReducer prevents disabling the last filter type", () => {
  const initialState = createInitialCalendarState([sampleRecord])

  const oneTypeState = {
    ...initialState,
    previewFilter: {
      photo: true,
      doodle: false,
      text: false,
    },
  }

  const nextState = calendarReducer(oneTypeState, {
    type: "toggle-filter",
    contentType: "photo",
  })

  assert.equal(nextState.previewFilter.photo, true)
})

test("calendarReducer cycles the active preview mode globally", () => {
  const initialState = createInitialCalendarState([sampleRecord])
  const nextState = calendarReducer(initialState, {
    type: "cycle-preview-mode",
  })

  assert.equal(nextState.activePreviewType, "doodle")
})

test("calendarReducer removes empty records on save", () => {
  const initialState = createInitialCalendarState([sampleRecord])
  const nextState = calendarReducer(initialState, {
    type: "save-record",
    date: "2026-04-21",
    record: null,
  })

  assert.equal(nextState.recordsByDate["2026-04-21"], undefined)
})

test("createInitialCalendarState rejects duplicate record identities", () => {
  assert.throws(
    () =>
      createInitialCalendarState([
        sampleRecord,
        {
          ...sampleRecord,
          currentPreviewType: "text",
        },
      ]),
    /Duplicate calendar day record/
  )
})

test("createDefaultPreviewFilter enables all types", () => {
  assert.deepEqual(createDefaultPreviewFilter(), {
    photo: true,
    doodle: true,
    text: true,
  })
})
