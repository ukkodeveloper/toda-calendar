import { Stack, router, useLocalSearchParams } from "expo-router"
import { Pressable, Text } from "react-native"

import { DayRecordScreen } from "@/features/day-record/day-record-screen"
import { formatDayTitle } from "@/lib/date-format"
import { palette, typography } from "@/theme/tokens"

export default function DayRecordRoute() {
  const { calendarId, localDate } = useLocalSearchParams<{
    calendarId?: string
    localDate?: string
  }>()

  if (!calendarId || !localDate) {
    return null
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: formatDayTitle(localDate),
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={[typography.button, { color: palette.accent }]}>Done</Text>
            </Pressable>
          ),
        }}
      />
      <DayRecordScreen calendarId={calendarId} localDate={localDate} />
    </>
  )
}
