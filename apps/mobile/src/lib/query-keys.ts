export function monthQueryKey(calendarId: string, month: string) {
  return ["calendar", calendarId, "month", month] as const
}

export function monthQueryPrefix(calendarId: string) {
  return ["calendar", calendarId, "month"] as const
}

export function dayQueryKey(calendarId: string, localDate: string) {
  return ["calendar", calendarId, "day", localDate] as const
}
