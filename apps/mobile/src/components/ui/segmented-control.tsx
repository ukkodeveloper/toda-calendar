import { Pressable, Text, View } from "react-native"

import { triggerSelectionHaptic } from "@/services/haptics"
import { palette, radius, spacing, typography } from "@/theme/tokens"

type Option<T extends string> = {
  label: string
  value: T
}

type SegmentedControlProps<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (next: T) => void
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: spacing.xs,
        borderRadius: radius.pill,
        backgroundColor: palette.surfaceStrong,
        padding: 4,
      }}
    >
      {options.map(option => {
        const selected = option.value === value

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            onPress={() => {
              if (selected) {
                return
              }

              void triggerSelectionHaptic()
              onChange(option.value)
            }}
            style={({ pressed }) => ({
              flex: 1,
              borderRadius: radius.pill,
              backgroundColor: selected ? palette.surface : "transparent",
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              alignItems: "center",
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: selected ? palette.ink : palette.inkMuted,
                  fontWeight: selected ? "700" : "600",
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
