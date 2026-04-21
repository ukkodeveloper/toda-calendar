import { Stack, useLocalSearchParams } from "expo-router"

import { CalendarMonthScreen } from "@/features/calendar-month/calendar-month-screen"

export default function CalendarMonthRoute() {
  const { calendarId, month } = useLocalSearchParams<{
    calendarId?: string
    month?: string
  }>()

  if (!calendarId) {
    return null
  }

  return (
    <>
      <Stack.Screen options={{ title: "Calendar", headerLargeTitle: true }} />
      <CalendarMonthScreen
        calendarId={calendarId}
        initialMonth={typeof month === "string" ? month : undefined}
      />
    </>
  )
}
