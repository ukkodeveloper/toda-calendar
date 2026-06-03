import calendarSeed from "./calendar-seed.json"
import { parseCalendarSeed } from "./parse-calendar-seed"

export function loadCalendarSeed() {
  return parseCalendarSeed(calendarSeed)
}
