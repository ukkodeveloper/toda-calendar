import type { PropsWithChildren } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { View } from "react-native"

import { palette, radius, shadows, spacing } from "@/theme/tokens"

type SectionCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>
}>

export function SectionCard({ children, style }: SectionCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          borderRadius: radius.lg,
          borderWidth: 1,
          padding: spacing.lg,
          gap: spacing.md,
          boxShadow: shadows.card,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
