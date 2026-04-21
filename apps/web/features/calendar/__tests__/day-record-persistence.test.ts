import assert from "node:assert/strict"
import test from "node:test"

import { createSeedCalendarRecordRepository } from "../data/calendar-record-repository"
import {
  applyDayRecordPatch,
  createDayRecordPatch,
} from "../model/day-record-mutation"
import type { CalendarDayRecord } from "../model/types"
import {
  createSessionPhotoSlot,
  releaseReplacedSessionPhoto,
  releaseSessionPhotoSlot,
} from "../utils/session-photo"

const baseRecord: CalendarDayRecord = {
  date: "2026-04-21",
  currentPreviewType: "photo",
  photo: {
    type: "photo",
    assetId: "session:photo-1",
    src: "blob:photo-1",
    alt: "Quiet desk",
    source: "session",
  },
  doodle: {
    type: "doodle",
    strokes: [
      {
        color: "#111827",
        width: 3,
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 20 },
        ],
      },
    ],
  },
  text: {
    type: "text",
    body: "Held onto a quiet afternoon.",
  },
}

test("createDayRecordPatch returns a sparse transport-shaped patch", () => {
  const patch = createDayRecordPatch(baseRecord, {
    ...baseRecord,
    currentPreviewType: "text",
    text: {
      type: "text",
      body: "Held onto a gentler afternoon.",
    },
    doodle: undefined,
  })

  assert.deepEqual(patch, {
    doodle: {
      payload: null,
    },
    phrase: {
      text: "Held onto a gentler ",
    },
  })
})

test("createDayRecordPatch omits untouched fields", () => {
  const patch = createDayRecordPatch(baseRecord, {
    ...baseRecord,
    currentPreviewType: "text",
  })

  assert.deepEqual(patch, {})
})

test("applyDayRecordPatch preserves untouched slots and updates the preferred preview", () => {
  const nextRecord = applyDayRecordPatch(
    baseRecord,
    "2026-04-21",
    {
      phrase: {
        text: "Left one short line for the evening.",
      },
    },
    "text",
    (assetId) => (assetId === baseRecord.photo?.assetId ? baseRecord.photo : undefined)
  )

  assert.deepEqual(nextRecord, {
    ...baseRecord,
    currentPreviewType: "text",
    text: {
      body: "Left one short line ",
      title: undefined,
      type: "text",
    },
  })
})

test("applyDayRecordPatch removes the persisted record when every slot is cleared", () => {
  const nextRecord = applyDayRecordPatch(
    baseRecord,
    "2026-04-21",
    {
      photo: { assetId: null },
      doodle: { payload: null },
      phrase: { text: null },
    },
    "text",
    () => undefined
  )

  assert.equal(nextRecord, null)
})

test("seed repository resolves registered photo assets through the patch seam", async () => {
  const repository = createSeedCalendarRecordRepository([baseRecord])
  const nextPhoto = createSessionPhotoSlot(
    { name: "window-light.jpeg" } as File,
    () => "blob:photo-2",
    () => "session:photo-2"
  )

  repository.registerPhotoAsset(nextPhoto)

  const nextRecord = await repository.commitDayRecord(
    "2026-04-21",
    {
      photo: { assetId: "session:photo-2" },
      phrase: { text: null },
    },
    "photo"
  )

  assert.deepEqual(nextRecord, {
    ...baseRecord,
    photo: nextPhoto,
    text: undefined,
  })
})

test("createSessionPhotoSlot normalizes a selected file into a session-backed slot", () => {
  const slot = createSessionPhotoSlot(
    { name: "quiet-desk.jpeg" } as File,
    () => "blob:photo-2",
    () => "session:photo-2"
  )

  assert.deepEqual(slot, {
    type: "photo",
    assetId: "session:photo-2",
    src: "blob:photo-2",
    alt: "quiet-desk",
    source: "session",
  })
})

test("releaseSessionPhotoSlot only revokes session blob urls", () => {
  const revoked: string[] = []

  releaseSessionPhotoSlot(baseRecord.photo, (value) => {
    revoked.push(value)
  })
  releaseSessionPhotoSlot(
    {
      type: "photo",
      assetId: "seed:/calendar/photos/quiet-desk.jpg",
      src: "/calendar/photos/quiet-desk.jpg",
      alt: "Quiet desk",
      source: "seed",
    },
    (value) => {
      revoked.push(value)
    }
  )

  assert.deepEqual(revoked, ["blob:photo-1"])
})

test("releaseReplacedSessionPhoto only revokes when the persisted photo actually changed", () => {
  const revoked: string[] = []

  releaseReplacedSessionPhoto(
    baseRecord.photo,
    {
      type: "photo",
      assetId: "session:photo-2",
      src: "blob:photo-2",
      alt: "Window light",
      source: "session",
    },
    (value) => {
      revoked.push(value)
    }
  )
  releaseReplacedSessionPhoto(
    {
      type: "photo",
      assetId: "session:photo-2",
      src: "blob:photo-2",
      alt: "Window light",
      source: "session",
    },
    {
      type: "photo",
      assetId: "session:photo-2",
      src: "blob:photo-2",
      alt: "Window light",
      source: "session",
    },
    (value) => {
      revoked.push(value)
    }
  )

  assert.deepEqual(revoked, ["blob:photo-1"])
})
