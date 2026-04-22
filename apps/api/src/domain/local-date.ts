const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/

export function isValidMonthKey(value: string): boolean {
  if (!MONTH_KEY_PATTERN.test(value)) {
    return false
  }

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))

  return year >= 1 && month >= 1 && month <= 12
}

export function isValidLocalDate(value: string): boolean {
  if (!LOCAL_DATE_PATTERN.test(value)) {
    return false
  }

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  const candidate = new Date(Date.UTC(year, month - 1, day))

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  )
}

export function getMonthKeyFromLocalDate(localDate: string): string {
  return localDate.slice(0, 7)
}

export function listLocalDatesForMonth(monthKey: string): string[] {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`)
  }

  const year = Number(monthKey.slice(0, 4))
  const month = Number(monthKey.slice(5, 7))
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

  return Array.from({ length: lastDayOfMonth }, (_, index) =>
    formatLocalDate(year, month, index + 1)
  )
}

export function getMonthGridRange(monthKey: string) {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`)
  }

  const monthStart = parseMonthKeyUtc(monthKey)
  const gridStart = addUtcDays(monthStart, -monthStart.getUTCDay())
  const gridEnd = addUtcDays(gridStart, 41)

  return {
    endLocalDate: formatUtcLocalDate(gridEnd),
    startLocalDate: formatUtcLocalDate(gridStart),
  }
}

export function listLocalDatesForMonthGrid(monthKey: string): string[] {
  const { startLocalDate } = getMonthGridRange(monthKey)
  const gridStart = parseLocalDateUtc(startLocalDate)

  return Array.from({ length: 42 }, (_, index) =>
    formatUtcLocalDate(addUtcDays(gridStart, index))
  )
}

function formatLocalDate(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`
}

function parseMonthKeyUtc(monthKey: string) {
  return new Date(Date.UTC(Number(monthKey.slice(0, 4)), Number(monthKey.slice(5, 7)) - 1, 1))
}

function parseLocalDateUtc(localDate: string) {
  return new Date(
    Date.UTC(
      Number(localDate.slice(0, 4)),
      Number(localDate.slice(5, 7)) - 1,
      Number(localDate.slice(8, 10))
    )
  )
}

function addUtcDays(date: Date, amount: number) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + amount)
  )
}

function formatUtcLocalDate(date: Date) {
  return formatLocalDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}
