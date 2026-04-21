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
  | { type: "save-record"; record: CalendarDayRecord }
  | { type: "cycle-preview-mode" }
  | { type: "toggle-filter"; contentType: ContentType }

export function createEmptyDayRecord(date: string): CalendarDayRecord {
  return {
    date,
    currentPreviewType: "photo",
  }
}

export function sanitizeDayRecord(record: CalendarDayRecord) {
  const nextRecord: CalendarDayRecord = {
    date: record.date,
    currentPreviewType: record.currentPreviewType,
    photo: hasSlotContent(record, "photo") ? record.photo : undefined,
    doodle: hasSlotContent(record, "doodle") ? record.doodle : undefined,
    text: hasSlotContent(record, "text") ? record.text : undefined,
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

export function createInitialCalendarState(records: CalendarDayRecord[]): CalendarState {
  return {
    activePreviewType: "photo",
    recordsByDate: records.reduce<Record<string, CalendarDayRecord>>((accumulator, record) => {
      const sanitized = sanitizeDayRecord(record)

      if (sanitized) {
        accumulator[record.date] = sanitized
      }

      return accumulator
    }, {}),
    previewFilter: createDefaultPreviewFilter(),
    selectedDate: null,
  }
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

  if (action.type === "save-record") {
    const sanitized = sanitizeDayRecord(action.record)
    const nextRecords = { ...state.recordsByDate }

    if (sanitized) {
      nextRecords[sanitized.date] = sanitized
    } else {
      delete nextRecords[action.record.date]
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
