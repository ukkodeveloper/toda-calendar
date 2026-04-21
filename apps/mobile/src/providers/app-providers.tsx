import { useEffect, type PropsWithChildren } from "react"
import { StatusBar } from "expo-status-bar"
import * as SystemUI from "expo-system-ui"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { QueryProvider } from "@/providers/query-provider"
import { palette } from "@/theme/tokens"

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(palette.background)
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.background }}>
      <SafeAreaProvider>
        <QueryProvider>
          <StatusBar style="dark" />
          {children}
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
