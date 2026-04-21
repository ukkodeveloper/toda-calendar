import { Pressable, Text, View } from "react-native"

import { formatAccessibilityDate } from "@/lib/date-format"
import type { CalendarLayer, MonthCell } from "@/types/calendar"
import { palette, radius, spacing, typography } from "@/theme/tokens"

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

function hasVisibleContent(cell: MonthCell, activeLayer: CalendarLayer) {
  if (!cell.summary) {
    return false
  }

  if (activeLayer === "all") {
    return true
  }

  if (activeLayer === "photo") {
    return cell.summary.hasPhoto
  }

  if (activeLayer === "doodle") {
    return cell.summary.hasDoodle
  }

  return cell.summary.hasText
}

function cellBackground(cell: MonthCell, activeLayer: CalendarLayer) {
  if (!hasVisibleContent(cell, activeLayer)) {
    return cell.isCurrentMonth ? palette.surface : "#f7f1e8"
  }

  if (activeLayer === "photo") {
    return "#f7eddc"
  }

  if (activeLayer === "doodle") {
    return "#e8f2f8"
  }

  if (activeLayer === "text") {
    return "#f8ece8"
  }

  return "#f0ede7"
}

function contentSummaryLabel(cell: MonthCell) {
  if (!cell.summary) {
    return "no entry yet"
  }

  const parts = []

  if (cell.summary.hasPhoto) {
    parts.push("photo")
  }

  if (cell.summary.hasDoodle) {
    parts.push("doodle")
  }

  if (cell.summary.hasText) {
    parts.push("note")
  }

  return parts.join(", ")
}

export function MonthGrid({
  weeks,
  activeLayer,
  onPressDay,
}: {
  weeks: MonthCell[][]
  activeLayer: CalendarLayer
  onPressDay: (localDate: string) => void
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", gap: spacing.xs }}>
        {weekdayLabels.map(label => (
          <View key={label} style={{ flex: 1, alignItems: "center" }}>
            <Text style={[typography.caption, { color: palette.inkMuted }]}>{label}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={`week-${weekIndex}`} style={{ flexDirection: "row", gap: spacing.xs }}>
          {week.map(cell => {
            const highlighted = hasVisibleContent(cell, activeLayer)

            return (
              <Pressable
                key={cell.localDate}
                accessibilityRole="button"
                accessibilityLabel={`${formatAccessibilityDate(cell.localDate)}, ${contentSummaryLabel(cell)}`}
                onPress={() => onPressDay(cell.localDate)}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 70,
                  borderRadius: radius.md,
                  borderWidth: cell.isToday ? 1.5 : 1,
                  borderColor: cell.isToday ? palette.accent : palette.border,
                  backgroundColor: cellBackground(cell, activeLayer),
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.sm,
                  justifyContent: "space-between",
                  opacity: pressed ? 0.78 : 1,
                })}
              >
                <Text
                  style={[
                    typography.bodyStrong,
                    {
                      color: cell.isCurrentMonth ? palette.ink : "#9a8f83",
                    },
                  ]}
                >
                  {cell.dayNumber}
                </Text>

                <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: radius.pill,
                      backgroundColor:
                        cell.summary?.hasPhoto && (activeLayer === "all" || activeLayer === "photo")
                          ? palette.photo
                          : "#dacdbf",
                    }}
                  />
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: radius.pill,
                      backgroundColor:
                        cell.summary?.hasDoodle &&
                        (activeLayer === "all" || activeLayer === "doodle")
                          ? palette.doodle
                          : "#dacdbf",
                    }}
                  />
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: radius.pill,
                      backgroundColor:
                        cell.summary?.hasText && (activeLayer === "all" || activeLayer === "text")
                          ? palette.text
                          : "#dacdbf",
                    }}
                  />
                  <View style={{ flex: 1 }} />
                  {highlighted ? (
                    <Text style={[typography.caption, { color: palette.inkMuted }]}>
                      {cell.summary?.intensity}/3
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            )
          })}
        </View>
      ))}
    </View>
  )
}
