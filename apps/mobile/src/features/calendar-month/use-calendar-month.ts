import { router } from "expo-router"
import { useQuery } from "@tanstack/react-query"

import { normalizeMonthKey, shiftMonth } from "@/lib/calendar"
import { monthQueryKey } from "@/lib/query-keys"
import { calendarStore } from "@/services/calendar-store"

export function useCalendarMonth(calendarId: string, initialMonth?: string) {
  const month = normalizeMonthKey(initialMonth)

  const query = useQuery({
    queryKey: monthQueryKey(calendarId, month),
    queryFn: () => calendarStore.getMonthView(calendarId, month),
  })

  return {
    ...query,
    month,
    openDay(localDate: string) {
      router.push(`/calendar/${calendarId}/day/${localDate}?month=${month}`)
    },
    goToPreviousMonth() {
      router.replace(`/calendar/${calendarId}?month=${shiftMonth(month, -1)}`)
    },
    goToNextMonth() {
      router.replace(`/calendar/${calendarId}?month=${shiftMonth(month, 1)}`)
    },
  }
}
