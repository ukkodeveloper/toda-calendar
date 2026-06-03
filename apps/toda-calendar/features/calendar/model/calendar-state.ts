import {
  type CalendarDayRecord,
  type ContentType,
  type PreviewFilterState,
} from "./types"
import {
  createDefaultPreviewFilter,
  getEnabledContentTypes,
  getFilledContentTypes,
  hasSlotContent,
  resolvePreviewModeAfterFilter,
  cyclePreviewMode,
} from "../utils/preview"

export type CalendarState = {
  activePreviewType: ContentType
  recordsByDate: Record<string, CalendarDayRecord>
  previewFilter: PreviewFilterState
  selectedDate: string | null
}

export type CalendarAction =
  | { type: "open-editor"; date: string }
  | { type: "close-editor" }
  | { type: "merge-records"; records: CalendarDayRecord[] }
  | { type: "reset-records" }
  | { type: "save-record"; date: string; record: CalendarDayRecord | null }
  | { type: "cycle-preview-mode" }
  | { type: "toggle-filter"; contentType: ContentType }

const TEXT_MAX_LENGTH = 8

function clampTextValue(value?: string) {
  return value?.trim().slice(0, TEXT_MAX_LENGTH)
}

function normalizePhotoSlot(record: CalendarDayRecord) {
  if (!record.photo) {
    return undefined
  }

  return {
    ...record.photo,
    assetId: record.photo.assetId ?? `${record.photo.source}:${record.photo.src}`,
  }
}

export function createEmptyDayRecord(date: string): CalendarDayRecord {
  return {
    date,
    currentPreviewType: "photo",
  }
}

export function sanitizeDayRecord(record: CalendarDayRecord) {
  const normalizedPhoto = normalizePhotoSlot(record)
  const normalizedText = record.text
    ? {
        ...record.text,
        title: clampTextValue(record.text.title),
        body: clampTextValue(record.text.body) ?? "",
      }
    : undefined

  const nextRecord: CalendarDayRecord = {
    date: record.date,
    currentPreviewType: record.currentPreviewType,
    photo: hasSlotContent(record, "photo") ? normalizedPhoto : undefined,
    doodle: hasSlotContent(record, "doodle") ? record.doodle : undefined,
    text:
      normalizedText && hasSlotContent({ ...record, text: normalizedText }, "text")
        ? normalizedText
        : undefined,
  }

  const filled = getFilledContentTypes(nextRecord)

  if (!filled.length) {
    return null
  }

  return {
    ...nextRecord,
    currentPreviewType: filled.includes(record.currentPreviewType)
      ? record.currentPreviewType
      : (filled[0] ?? "text"),
  }
}

export function createInitialCalendarState(
  records: CalendarDayRecord[],
  selectedDate: string | null = null
): CalendarState {
  return {
    activePreviewType: "photo",
    recordsByDate: normalizeCalendarRecords(records),
    previewFilter: createDefaultPreviewFilter(),
    selectedDate,
  }
}

export function normalizeCalendarRecords(records: CalendarDayRecord[]) {
  return records.reduce<Record<string, CalendarDayRecord>>((accumulator, record) => {
    const sanitized = sanitizeDayRecord(record)

    if (!sanitized) {
      return accumulator
    }

    if (accumulator[sanitized.date]) {
      throw new Error(`Duplicate calendar day record: ${sanitized.date}`)
    }

    accumulator[sanitized.date] = sanitized
    return accumulator
  }, {})
}

export function getRecordForDate(
  recordsByDate: Record<string, CalendarDayRecord>,
  date: string
) {
  return recordsByDate[date] ?? createEmptyDayRecord(date)
}

export function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  if (action.type === "open-editor") {
    return {
      ...state,
      selectedDate: action.date,
    }
  }

  if (action.type === "close-editor") {
    return {
      ...state,
      selectedDate: null,
    }
  }

  if (action.type === "merge-records") {
    return {
      ...state,
      recordsByDate: {
        ...state.recordsByDate,
        ...normalizeCalendarRecords(action.records),
      },
    }
  }

  if (action.type === "reset-records") {
    return {
      ...state,
      recordsByDate: {},
      selectedDate: null,
    }
  }

  if (action.type === "save-record") {
    const nextRecords = { ...state.recordsByDate }

    if (action.record) {
      nextRecords[action.record.date] = action.record
    } else {
      delete nextRecords[action.date]
    }

    return {
      ...state,
      recordsByDate: nextRecords,
    }
  }

  if (action.type === "cycle-preview-mode") {
    return {
      ...state,
      activePreviewType: cyclePreviewMode(state.activePreviewType, state.previewFilter),
    }
  }

  if (action.type === "toggle-filter") {
    const enabledTypes = getEnabledContentTypes(state.previewFilter)
    const isCurrentlyEnabled = state.previewFilter[action.contentType]

    if (isCurrentlyEnabled && enabledTypes.length === 1) {
      return state
    }

    return {
      ...state,
      activePreviewType: resolvePreviewModeAfterFilter(state.activePreviewType, {
        ...state.previewFilter,
        [action.contentType]: !state.previewFilter[action.contentType],
      }),
      previewFilter: {
        ...state.previewFilter,
        [action.contentType]: !state.previewFilter[action.contentType],
      },
    }
  }

  return state
}
