import { Stack } from "expo-router"

import { palette } from "@/theme/tokens"

export default function CalendarLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Calendar",
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="day/[localDate]"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: [0.62, 1],
          sheetGrabberVisible: true,
          headerTransparent: true,
          contentStyle: { backgroundColor: "transparent" },
          headerTintColor: palette.ink,
        }}
      />
    </Stack>
  )
}
