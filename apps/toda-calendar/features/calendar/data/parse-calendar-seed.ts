import { normalizeCalendarRecords } from "../model/calendar-state"
import { calendarSeedSchema } from "../model/types"

export function parseCalendarSeed(input: unknown) {
  const parsed = calendarSeedSchema.parse(input)
  return Object.values(normalizeCalendarRecords(parsed.records)).sort((left, right) =>
    left.date.localeCompare(right.date)
  )
}
