import type { DayRecord, PatchDayRecordBody } from "@workspace/contracts"

import { getMe, listMonthDayRecords, patchDayRecord } from "@/lib/api/client"

import { sanitizeDayRecord } from "../model/calendar-state"
import type {
  CalendarDayRecord,
  CalendarPhotoSlot,
  ContentType,
} from "../model/types"
import { getFilledContentTypes } from "../utils/preview"
import { getSessionPhotoFile } from "../utils/session-photo"

function isEqualSlot<T>(left?: T | null, right?: T | null) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null)
}

function resolvePreviewType(
  record: CalendarDayRecord,
  preferredPreviewType?: ContentType
): ContentType {
  const filled = getFilledContentTypes(record)

  if (preferredPreviewType && filled.includes(preferredPreviewType)) {
    return preferredPreviewType
  }

  return filled[0] ?? "photo"
}

function toWebRecord(
  dayRecord: DayRecord,
  preferredPreviewType?: ContentType
): CalendarDayRecord | null {
  const nextRecord: CalendarDayRecord = {
    date: dayRecord.localDate,
    currentPreviewType: "photo",
  }

  for (const slot of dayRecord.slots) {
    if (slot.type === "PHOTO") {
      nextRecord.photo = {
        type: "photo",
        alt: slot.alt ?? "Photo",
        assetId: `persisted:${dayRecord.localDate}`,
        source: "seed",
        src: slot.assetUrl,
      }
      continue
    }

    if (slot.type === "TEXT") {
      nextRecord.text = {
        type: "text",
        body: slot.body ?? "",
        title: slot.title ?? undefined,
      }
      continue
    }

    nextRecord.doodle = {
      type: "doodle",
      strokes: slot.strokes,
    }
  }

  const sanitized = sanitizeDayRecord(nextRecord)

  if (!sanitized) {
    return null
  }

  return {
    ...sanitized,
    currentPreviewType: resolvePreviewType(sanitized, preferredPreviewType),
  }
}

function messageOrNull(value?: string) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error("Selected photo could not be prepared for upload."))
    }

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Selected photo could not be encoded."))
        return
      }

      resolve(reader.result)
    }

    reader.readAsDataURL(file)
  })
}

async function toPhotoPatch(slot: CalendarPhotoSlot) {
  const file = getSessionPhotoFile(slot)

  return {
    alt: messageOrNull(slot.alt),
    assetUrl: file ? await fileToDataUrl(file) : slot.src,
  }
}

async function createPatch(
  previous: CalendarDayRecord | null | undefined,
  next: CalendarDayRecord
): Promise<PatchDayRecordBody | null> {
  const normalizedPrevious = previous ? sanitizeDayRecord(previous) : null
  const normalizedNext = sanitizeDayRecord(next)
  const patch: PatchDayRecordBody = {}

  if (!isEqualSlot(normalizedPrevious?.photo, normalizedNext?.photo)) {
    patch.photo = normalizedNext?.photo ? await toPhotoPatch(normalizedNext.photo) : null
  }

  if (!isEqualSlot(normalizedPrevious?.doodle, normalizedNext?.doodle)) {
    patch.doodle = normalizedNext?.doodle
      ? {
          strokes: normalizedNext.doodle.strokes,
        }
      : null
  }

  if (!isEqualSlot(normalizedPrevious?.text, normalizedNext?.text)) {
    patch.text = normalizedNext?.text
      ? {
          body: messageOrNull(normalizedNext.text.body),
          title: messageOrNull(normalizedNext.text.title),
        }
      : null
  }

  return Object.keys(patch).length ? patch : null
}

export function createApiCalendarRecordRepository() {
  return {
    async getDefaultCalendarId() {
      const me = await getMe()
      return me.defaultCalendarId
    },
    async getMonthRecords(calendarId: string, month: string) {
      const response = await listMonthDayRecords(calendarId, month)

      return response.dayRecords
        .map((dayRecord) => toWebRecord(dayRecord))
        .filter((record): record is CalendarDayRecord => Boolean(record))
    },
    async commitDayRecord(
      calendarId: string,
      previous: CalendarDayRecord | null | undefined,
      next: CalendarDayRecord
    ) {
      const patch = await createPatch(previous, next)

      if (!patch) {
        return sanitizeDayRecord(next)
      }

      const response = await patchDayRecord(calendarId, next.date, patch)
      return response.dayRecord.id
        ? toWebRecord(response.dayRecord, next.currentPreviewType)
        : null
    },
  }
}
