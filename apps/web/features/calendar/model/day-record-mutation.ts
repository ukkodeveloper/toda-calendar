import { getFilledContentTypes } from "../utils/preview"
import { createEmptyDayRecord, sanitizeDayRecord } from "./calendar-state"
import type { CalendarDayRecord, CalendarPhotoSlot, ContentType } from "./types"

export type DayRecordPatch = {
  doodle?: { payload: NonNullable<CalendarDayRecord["doodle"]>["strokes"] | null }
  photo?: { assetId: string | null }
  phrase?: { text: string | null }
}

function isEqualSlot<T>(left?: T | null, right?: T | null) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null)
}

function resolvePersistedPreviewType(
  preferredPreviewType: ContentType,
  record: CalendarDayRecord
) {
  const filledContentTypes = getFilledContentTypes(record)

  if (!filledContentTypes.length) {
    return preferredPreviewType
  }

  if (filledContentTypes.includes(preferredPreviewType)) {
    return preferredPreviewType
  }

  return filledContentTypes[0] ?? preferredPreviewType
}

export function createDayRecordPatch(
  previous: CalendarDayRecord | null | undefined,
  next: CalendarDayRecord
) {
  const normalizedPrevious = previous ? sanitizeDayRecord(previous) : null
  const normalizedNext = sanitizeDayRecord(next)
  const patch: DayRecordPatch = {}

  if (!isEqualSlot(normalizedPrevious?.photo, normalizedNext?.photo)) {
    patch.photo = {
      assetId: normalizedNext?.photo?.assetId ?? null,
    }
  }

  if (!isEqualSlot(normalizedPrevious?.doodle, normalizedNext?.doodle)) {
    patch.doodle = {
      payload: normalizedNext?.doodle?.strokes ?? null,
    }
  }

  if (!isEqualSlot(normalizedPrevious?.text, normalizedNext?.text)) {
    patch.phrase = {
      text: normalizedNext?.text?.body ?? null,
    }
  }

  return patch
}

export function applyDayRecordPatch(
  previous: CalendarDayRecord | null | undefined,
  date: string,
  patch: DayRecordPatch,
  preferredPreviewType: ContentType,
  resolvePhotoAsset: (assetId: string) => CalendarPhotoSlot | undefined
) {
  const baseRecord = previous ?? createEmptyDayRecord(date)
  const nextPhoto =
    patch.photo === undefined
      ? baseRecord.photo
      : patch.photo.assetId === null
        ? undefined
        : resolvePhotoAsset(patch.photo.assetId)

  if (patch.photo?.assetId && !nextPhoto) {
    throw new Error(`Unknown photo asset: ${patch.photo.assetId}`)
  }

  const mergedRecord: CalendarDayRecord = {
    ...baseRecord,
    date,
    currentPreviewType: preferredPreviewType,
    photo: nextPhoto,
    doodle:
      patch.doodle === undefined
        ? baseRecord.doodle
        : patch.doodle.payload
          ? {
              type: "doodle",
              strokes: patch.doodle.payload,
            }
          : undefined,
    text:
      patch.phrase === undefined
        ? baseRecord.text
        : patch.phrase.text
          ? {
              type: "text",
              body: patch.phrase.text,
            }
          : undefined,
  }
  const sanitizedRecord = sanitizeDayRecord(mergedRecord)

  if (!sanitizedRecord) {
    return null
  }

  return {
    ...sanitizedRecord,
    currentPreviewType: resolvePersistedPreviewType(
      preferredPreviewType,
      sanitizedRecord
    ),
  }
}
