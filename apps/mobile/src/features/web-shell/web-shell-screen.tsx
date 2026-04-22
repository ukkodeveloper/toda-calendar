import { useRef, useState } from "react"
import Constants from "expo-constants"
import { ActivityIndicator, Pressable, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { WebView } from "react-native-webview"

import { palette, spacing, typography } from "@/theme/tokens"

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

function resolveWebAppUrl() {
  const configured = process.env.EXPO_PUBLIC_WEB_APP_URL?.trim()

  if (configured) {
    return trimTrailingSlash(configured)
  }

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.platform?.hostUri ?? null
  const host = hostUri?.split(":")[0]

  if (!host) {
    return null
  }

  return `http://${host}:3000`
}

export function WebShellScreen() {
  const webViewRef = useRef<WebView>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const webAppUrl = resolveWebAppUrl()

  if (!webAppUrl) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: spacing.xl,
            gap: spacing.md,
          }}
        >
          <Text style={[typography.eyebrow, { color: palette.inkMuted }]}>Web shell</Text>
          <Text style={[typography.title, { color: palette.ink }]}>
            A web URL is required before the shell can open Toda.
          </Text>
          <Text style={[typography.body, { color: palette.inkMuted }]}>
            Set `EXPO_PUBLIC_WEB_APP_URL` for deployed previews, or start Expo from the same
            machine as the Next.js dev server so the host IP can be inferred automatically.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        }}
      >
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={[typography.eyebrow, { color: palette.inkMuted }]}>RN shell</Text>
          <Text numberOfLines={1} style={[typography.bodyStrong, { color: palette.ink }]}>
            {webAppUrl}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setLoadError(null)
            webViewRef.current?.reload()
          }}
          style={({ pressed }) => ({
            opacity: pressed ? 0.65 : 1,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: 999,
            backgroundColor: palette.surfaceStrong,
          })}
        >
          <Text style={[typography.button, { color: palette.ink }]}>Reload</Text>
        </Pressable>
      </View>

      {loadError ? (
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: "#fff4ef",
            borderBottomWidth: 1,
            borderBottomColor: "#f3d1c0",
            gap: spacing.xs,
          }}
        >
          <Text style={[typography.bodyStrong, { color: "#8a3b12" }]}>
            The WebView could not load Toda.
          </Text>
          <Text style={[typography.caption, { color: "#8a3b12" }]}>{loadError}</Text>
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          allowsBackForwardNavigationGestures
          originWhitelist={["*"]}
          onError={(event) => {
            setLoadError(event.nativeEvent.description)
            setIsLoading(false)
          }}
          onLoadEnd={() => {
            setIsLoading(false)
          }}
          onLoadStart={() => {
            setLoadError(null)
            setIsLoading(true)
          }}
          setSupportMultipleWindows={false}
          sharedCookiesEnabled
          source={{ uri: webAppUrl }}
          startInLoadingState
        />

        {isLoading ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(244,239,230,0.82)",
              gap: spacing.sm,
            }}
          >
            <ActivityIndicator size="small" color={palette.accent} />
            <Text style={[typography.caption, { color: palette.inkMuted }]}>
              Opening the web experience inside Expo.
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  )
}
