import type { CalendarGridDay, MonthSection } from "../model/types"

const isoLocalDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/

function pad(value: number) {
  return value.toString().padStart(2, "0")
}

export function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function isValidIsoDate(value: string) {
  const match = isoLocalDatePattern.exec(value)

  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false
  }

  const candidate = new Date(year, month - 1, day)

  return (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
  )
}

export function parseIsoDate(value: string) {
  if (!isValidIsoDate(value)) {
    throw new Error(`Invalid local date: ${value}`)
  }

  const parts = value.split("-")
  const year = Number(parts[0] ?? 0)
  const month = Number(parts[1] ?? 1)
  const day = Number(parts[2] ?? 1)
  return new Date(year, month - 1, day)
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function monthKey(date: Date) {
  return toIsoDate(startOfMonth(date))
}

export function resolveCalendarEntryDate(
  value: string | null | undefined,
  fallbackDate = new Date()
) {
  if (!value || !isValidIsoDate(value)) {
    return {
      anchorDate: fallbackDate,
      selectedDate: null,
    }
  }

  const parsed = parseIsoDate(value)

  return {
    anchorDate: parsed,
    selectedDate: toIsoDate(parsed),
  }
}

export function createInitialMonthRange(anchor: Date, before: number, after: number) {
  const keys: string[] = []

  for (let index = before; index > 0; index -= 1) {
    keys.push(monthKey(addMonths(anchor, -index)))
  }

  keys.push(monthKey(anchor))

  for (let index = 1; index <= after; index += 1) {
    keys.push(monthKey(addMonths(anchor, index)))
  }

  return keys
}

export function expandMonthRange(
  monthStarts: string[],
  direction: "past" | "future",
  count: number
) {
  if (!monthStarts.length) {
    return monthStarts
  }

  if (direction === "past") {
    const first = parseIsoDate(monthStarts[0] ?? monthKey(new Date()))
    const nextKeys: string[] = []

    for (let index = count; index > 0; index -= 1) {
      nextKeys.push(monthKey(addMonths(first, -index)))
    }

    return [...nextKeys, ...monthStarts]
  }

  const last = parseIsoDate(monthStarts[monthStarts.length - 1] ?? monthKey(new Date()))
  const nextKeys: string[] = []

  for (let index = 1; index <= count; index += 1) {
    nextKeys.push(monthKey(addMonths(last, index)))
  }

  return [...monthStarts, ...nextKeys]
}

function createGridDay(
  date: Date,
  monthStart: Date,
  todayKey: string
): CalendarGridDay {
  return {
    date: toIsoDate(date),
    dayNumber: date.getDate(),
    isCurrentMonth: date.getMonth() === monthStart.getMonth(),
    isPlaceholder: false,
    isToday: toIsoDate(date) === todayKey,
  }
}

export function buildMonthSection(monthStartKey: string, todayKey: string): MonthSection {
  const monthStart = parseIsoDate(monthStartKey)
  const leadingBlanks = monthStart.getDay()
  const weeks: CalendarGridDay[][] = []
  const cells: CalendarGridDay[] = []
  const gridStart = addDays(monthStart, -leadingBlanks)
  const totalCells = 42

  for (let index = 0; index < totalCells; index += 1) {
    cells.push(createGridDay(addDays(gridStart, index), monthStart, todayKey))
  }

  for (let index = 0; index < totalCells; index += 7) {
    weeks.push(cells.slice(index, index + 7))
  }

  return {
    key: monthStartKey,
    monthStart: monthStartKey,
    monthLabel: new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(monthStart),
    weeks,
  }
}

export const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
