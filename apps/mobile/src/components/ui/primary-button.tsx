import { Pressable, Text } from "react-native"

import { palette, radius, spacing, typography } from "@/theme/tokens"

type PrimaryButtonProps = {
  label: string
  onPress?: () => void
  tone?: "primary" | "secondary" | "danger"
  compact?: boolean
  disabled?: boolean
}

export function PrimaryButton({
  label,
  onPress,
  tone = "primary",
  compact = false,
  disabled = false,
}: PrimaryButtonProps) {
  const backgroundColor =
    tone === "primary"
      ? palette.accent
      : tone === "danger"
        ? "#fdeceb"
        : palette.surfaceStrong

  const textColor =
    tone === "primary" ? palette.white : tone === "danger" ? palette.danger : palette.ink

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radius.pill,
        backgroundColor,
        paddingHorizontal: compact ? spacing.md : spacing.lg,
        paddingVertical: compact ? spacing.sm : spacing.md,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
      })}
    >
      <Text style={[typography.button, { color: textColor }]}>{label}</Text>
    </Pressable>
  )
}
