const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/

function pad(value: number) {
  return value.toString().padStart(2, "0")
}

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

export function formatLocalDate(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${pad(month)}-${pad(day)}`
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

export function toLocalDateKey(date: Date) {
  return formatLocalDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function parseMonthKey(monthKey: string) {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`)
  }

  const year = Number(monthKey.slice(0, 4))
  const month = Number(monthKey.slice(5, 7))
  return new Date(year, month - 1, 1)
}

export function normalizeMonthKey(monthKey?: string) {
  if (!monthKey || !isValidMonthKey(monthKey)) {
    return getMonthKey(new Date())
  }

  return monthKey
}

export function shiftMonthKey(monthKey: string, amount: number) {
  const parsed = parseMonthKey(monthKey)
  return getMonthKey(new Date(parsed.getFullYear(), parsed.getMonth() + amount, 1))
}
