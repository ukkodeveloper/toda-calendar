import { Text, View } from "react-native"

import type { SaveState } from "@/types/calendar"
import { palette, radius, spacing, typography } from "@/theme/tokens"

const stateMap: Record<SaveState, { label: string; backgroundColor: string; dotColor: string }> = {
  idle: {
    label: "Autosave on",
    backgroundColor: palette.surfaceStrong,
    dotColor: palette.inkMuted,
  },
  saving: {
    label: "Saving...",
    backgroundColor: "#eef4f6",
    dotColor: palette.doodle,
  },
  saved: {
    label: "Saved",
    backgroundColor: "#e8f6eb",
    dotColor: palette.success,
  },
  error: {
    label: "Needs retry",
    backgroundColor: "#fcebea",
    dotColor: palette.danger,
  },
}

export function SaveStatusPill({ state }: { state: SaveState }) {
  const config = stateMap[state]

  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        borderRadius: radius.pill,
        backgroundColor: config.backgroundColor,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: radius.pill,
          backgroundColor: config.dotColor,
        }}
      />
      <Text style={[typography.caption, { color: palette.ink }]}>{config.label}</Text>
    </View>
  )
}
