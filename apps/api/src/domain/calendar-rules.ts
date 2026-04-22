import type {
  DayRecord,
  DayRecordSlot,
  DoodleStroke,
  MonthCellPreview,
  MonthLayer,
  SlotType,
} from "./models.js"
import { listLocalDatesForMonthGrid } from "./local-date.js"
import { slotOrder } from "./models.js"

export type TextSlotPatch = {
  title?: string | null
  body?: string | null
}

export type PhotoSlotPatch = {
  assetUrl: string
  alt?: string | null
}

export type DoodleSlotPatch = {
  strokes: DoodleStroke[]
}

export type DayRecordPatch = {
  photo?: PhotoSlotPatch | null
  text?: TextSlotPatch | null
  doodle?: DoodleSlotPatch | null
}

export type DayRecordDraft = {
  id?: string
  calendarId: string
  ownerUserId: string
  localDate: string
  timezone: string
  createdAt?: string
  updatedAt: string
  slots: DayRecordSlot[]
}

type ApplyDayRecordPatchInput = {
  existing: DayRecord | null
  calendarId: string
  ownerUserId: string
  localDate: string
  timezone: string
  patch: DayRecordPatch
  nowIso: string
  idGenerator: () => string
}

export function buildMonthViewCells(
  month: string,
  layer: MonthLayer,
  records: DayRecord[]
) {
  const recordsByDate = new Map(records.map((record) => [record.localDate, record]))

  return listLocalDatesForMonthGrid(month).map((localDate) => {
    const record = recordsByDate.get(localDate)

    return {
      hasContent: Boolean(record && record.slots.length > 0),
      isCurrentMonth: localDate.slice(0, 7) === month,
      localDate,
      preview: record ? toMonthCellPreview(record, layer) : null,
    }
  })
}

export function applyDayRecordPatch({
  existing,
  calendarId,
  ownerUserId,
  localDate,
  timezone,
  patch,
  nowIso,
  idGenerator,
}: ApplyDayRecordPatchInput): DayRecordDraft | null {
  const slots = new Map<SlotType, DayRecordSlot>(
    existing?.slots.map((slot) => [slot.type, slot]) ?? []
  )

  if (patch.photo !== undefined) {
    if (patch.photo === null) {
      slots.delete("PHOTO")
    } else {
      slots.set("PHOTO", {
        type: "PHOTO",
        assetUrl: patch.photo.assetUrl.trim(),
        alt: normalizeNullableString(patch.photo.alt),
      })
    }
  }

  if (patch.text !== undefined) {
    if (patch.text === null) {
      slots.delete("TEXT")
    } else {
      const currentSlot = getSlot(slots.values(), "TEXT")
      const title =
        patch.text.title !== undefined
          ? normalizeNullableString(patch.text.title)
          : currentSlot?.title ?? null
      const body =
        patch.text.body !== undefined
          ? normalizeNullableString(patch.text.body)
          : currentSlot?.body ?? null

      if (title === null && body === null) {
        slots.delete("TEXT")
      } else {
        slots.set("TEXT", {
          type: "TEXT",
          title,
          body,
        })
      }
    }
  }

  if (patch.doodle !== undefined) {
    if (patch.doodle === null) {
      slots.delete("DOODLE")
    } else {
      slots.set("DOODLE", {
        type: "DOODLE",
        strokes: cloneDoodleStrokes(patch.doodle.strokes),
      })
    }
  }

  const normalizedSlots = Array.from(slots.values()).sort(
    (left, right) => slotOrder[left.type] - slotOrder[right.type]
  )

  if (!normalizedSlots.length) {
    return null
  }

  if (existing) {
    return {
      ...existing,
      slots: normalizedSlots,
      timezone,
      updatedAt: nowIso,
    }
  }

  return {
    calendarId,
    createdAt: nowIso,
    id: idGenerator(),
    localDate,
    ownerUserId,
    slots: normalizedSlots,
    timezone,
    updatedAt: nowIso,
  }
}

function toMonthCellPreview(
  record: DayRecord,
  layer: MonthLayer
): MonthCellPreview | null {
  const slot = getSlot(record.slots, layer)

  if (!slot) {
    return null
  }

  if (slot.type === "PHOTO") {
    return {
      type: "PHOTO",
      assetUrl: slot.assetUrl,
      alt: slot.alt,
    }
  }

  if (slot.type === "TEXT") {
    return {
      type: "TEXT",
      title: slot.title,
      body: slot.body,
    }
  }

  return {
    type: "DOODLE",
    strokeCount: slot.strokes.length,
  }
}

function getSlot<TType extends SlotType>(
  slots: Iterable<DayRecordSlot>,
  type: TType
): Extract<DayRecordSlot, { type: TType }> | undefined {
  for (const slot of slots) {
    if (slot.type === type) {
      return slot as Extract<DayRecordSlot, { type: TType }>
    }
  }

  return undefined
}

function normalizeNullableString(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = value.trim()

  return normalized ? normalized : null
}

function cloneDoodleStrokes(strokes: DoodleStroke[]) {
  return strokes.map((stroke) => ({
    color: stroke.color,
    width: stroke.width,
    points: stroke.points.map((point) => ({ ...point })),
  }))
}
