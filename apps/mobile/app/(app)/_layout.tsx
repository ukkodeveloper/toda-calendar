import { Stack } from "expo-router"

import { palette } from "@/theme/tokens"

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: palette.background },
        headerShadowVisible: false,
        headerTintColor: palette.ink,
      }}
    />
  )
}
