import { Link, Stack } from "expo-router"
import { Text, View } from "react-native"

import { PrimaryButton } from "@/components/ui/primary-button"
import { SectionCard } from "@/components/ui/section-card"
import { palette, spacing, typography } from "@/theme/tokens"

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Missing" }} />
      <View
        style={{
          flex: 1,
          backgroundColor: palette.background,
          padding: spacing.xl,
          justifyContent: "center",
        }}
      >
        <SectionCard>
          <Text style={[typography.eyebrow, { color: palette.inkMuted }]}>
            Route not found
          </Text>
          <Text style={[typography.title, { color: palette.ink }]}>
            This screen does not exist in the current mobile flow.
          </Text>
          <Link href="/" asChild>
            <PrimaryButton label="Back to calendar" />
          </Link>
        </SectionCard>
      </View>
    </>
  )
}
