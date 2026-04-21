import { parseLocalDateKey } from "@/lib/calendar"

export function formatDayTitle(localDate: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parseLocalDateKey(localDate))
}

export function formatAccessibilityDate(localDate: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parseLocalDateKey(localDate))
}
