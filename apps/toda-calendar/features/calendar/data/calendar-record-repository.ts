import { normalizeCalendarRecords } from "../model/calendar-state"
import { applyDayRecordPatch, type DayRecordPatch } from "../model/day-record-mutation"
import type { CalendarDayRecord, CalendarPhotoSlot, ContentType } from "../model/types"
import { loadCalendarSeed } from "./calendar-seed"

export interface CalendarRecordRepository {
  commitDayRecord: (
    date: string,
    patch: DayRecordPatch,
    preferredPreviewType: ContentType
  ) => Promise<CalendarDayRecord | null>
  getInitialRecords: () => CalendarDayRecord[]
  registerPhotoAsset: (slot: CalendarPhotoSlot) => void
}

function toRecordsByDate(records: CalendarDayRecord[]) {
  return normalizeCalendarRecords(records)
}

export function createSeedCalendarRecordRepository(
  initialRecords = loadCalendarSeed()
): CalendarRecordRepository {
  const recordsByDate = toRecordsByDate(initialRecords)
  const photoAssetsById = Object.values(recordsByDate).reduce<
    Record<string, CalendarPhotoSlot>
  >((accumulator, record) => {
    if (record.photo?.assetId) {
      accumulator[record.photo.assetId] = record.photo
    }

    return accumulator
  }, {})

  return {
    getInitialRecords() {
      return Object.values(recordsByDate).sort((left, right) =>
        left.date.localeCompare(right.date)
      )
    },
    registerPhotoAsset(slot) {
      if (!slot.assetId) {
        throw new Error("Photo asset must include an assetId")
      }

      photoAssetsById[slot.assetId] = slot
    },
    async commitDayRecord(date, patch, preferredPreviewType) {
      const nextRecord = applyDayRecordPatch(
        recordsByDate[date],
        date,
        patch,
        preferredPreviewType,
        (assetId) => photoAssetsById[assetId]
      )

      if (nextRecord) {
        recordsByDate[date] = nextRecord
      } else {
        delete recordsByDate[date]
      }

      return nextRecord
    },
  }
}
