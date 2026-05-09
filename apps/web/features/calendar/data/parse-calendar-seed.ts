import { sanitizeDayRecord } from "../model/calendar-state"
import { calendarSeedSchema } from "../model/types"

export function parseCalendarSeed(input: unknown) {
  const parsed = calendarSeedSchema.parse(input)

  return parsed.records.flatMap((record) => {
    const sanitized = sanitizeDayRecord(record)
    return sanitized ? [sanitized] : []
  })
}
