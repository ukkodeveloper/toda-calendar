import type { DayRecord, DayRecordSummary, MonthCell, MonthView } from "@/types/calendar"

function pad(value: number) {
  return value.toString().padStart(2, "0")
}

export function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseLocalDateKey(value: string) {
  const [yearPart, monthPart, dayPart] = value.split("-")
  return new Date(Number(yearPart), Number(monthPart) - 1, Number(dayPart))
}

export function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function parseMonthKey(month: string) {
  const [yearPart, monthPart] = month.split("-")
  return new Date(Number(yearPart), Number(monthPart) - 1, 1)
}

export function normalizeMonthKey(month?: string) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return getMonthKey(new Date())
  }

  return month
}

export function shiftMonth(month: string, amount: number) {
  const parsed = parseMonthKey(month)
  return getMonthKey(new Date(parsed.getFullYear(), parsed.getMonth() + amount, 1))
}

export function createEmptyDayRecord(localDate: string): DayRecord {
  return {
    localDate,
    note: "",
    photoUri: null,
    doodleStrokes: [],
    updatedAt: new Date().toISOString(),
  }
}

export function isRecordEmpty(record: DayRecord) {
  return !record.note.trim() && !record.photoUri && record.doodleStrokes.length === 0
}

export function createSummary(record?: DayRecord): DayRecordSummary | null {
  if (!record || isRecordEmpty(record)) {
    return null
  }

  const hasPhoto = Boolean(record.photoUri)
  const hasDoodle = record.doodleStrokes.length > 0
  const hasText = Boolean(record.note.trim())

  return {
    localDate: record.localDate,
    hasPhoto,
    hasDoodle,
    hasText,
    intensity: [hasPhoto, hasDoodle, hasText].filter(Boolean).length,
  }
}

export function buildMonthView({
  calendarId,
  month,
  recordsByDate,
  today = new Date(),
}: {
  calendarId: string
  month: string
  recordsByDate: Record<string, DayRecord>
  today?: Date
}): MonthView {
  const monthStart = parseMonthKey(month)
  const gridStart = addDays(monthStart, -monthStart.getDay())
  const todayKey = toLocalDateKey(today)
  const weeks: MonthCell[][] = []
  const stats = {
    recordedDays: 0,
    photoDays: 0,
    doodleDays: 0,
    textDays: 0,
  }

  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const row: MonthCell[] = []

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const offset = weekIndex * 7 + dayIndex
      const date = addDays(gridStart, offset)
      const localDate = toLocalDateKey(date)
      const record = recordsByDate[localDate]
      const summary = createSummary(record)
      const isCurrentMonth = date.getMonth() === monthStart.getMonth()

      if (isCurrentMonth && summary) {
        stats.recordedDays += 1
        stats.photoDays += Number(summary.hasPhoto)
        stats.doodleDays += Number(summary.hasDoodle)
        stats.textDays += Number(summary.hasText)
      }

      row.push({
        localDate,
        dayNumber: date.getDate(),
        isCurrentMonth,
        isToday: localDate === todayKey,
        summary,
      })
    }

    weeks.push(row)
  }

  return {
    calendarId,
    month,
    monthLabel: new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    }).format(monthStart),
    todayLocalDate: todayKey,
    weeks,
    stats,
  }
}
