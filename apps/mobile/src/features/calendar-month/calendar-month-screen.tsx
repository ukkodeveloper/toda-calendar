import { useState } from "react"
import { ActivityIndicator, ScrollView, Text, View } from "react-native"

import { MonthGrid } from "@/components/calendar/month-grid"
import { PrimaryButton } from "@/components/ui/primary-button"
import { SectionCard } from "@/components/ui/section-card"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { useCalendarMonth } from "@/features/calendar-month/use-calendar-month"
import type { CalendarLayer } from "@/types/calendar"
import { palette, spacing, typography } from "@/theme/tokens"

const layerOptions: Array<{ label: string; value: CalendarLayer }> = [
  { label: "All", value: "all" },
  { label: "Photo", value: "photo" },
  { label: "Sketch", value: "doodle" },
  { label: "Words", value: "text" },
]

export function CalendarMonthScreen({
  calendarId,
  initialMonth,
}: {
  calendarId: string
  initialMonth?: string
}) {
  const [activeLayer, setActiveLayer] = useState<CalendarLayer>("all")
  const { data, isPending, isError, refetch, goToNextMonth, goToPreviousMonth, openDay } =
    useCalendarMonth(calendarId, initialMonth)

  if (isPending) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: spacing.xl }}
      >
        <ActivityIndicator size="small" color={palette.accent} />
      </ScrollView>
    )
  }

  if (isError || !data) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.xl }}
      >
        <SectionCard>
          <Text style={[typography.sectionTitle, { color: palette.ink }]}>
            The month could not load
          </Text>
          <Text style={[typography.body, { color: palette.inkMuted }]}>
            Pulling mobile state from local storage failed. Try reloading the screen.
          </Text>
          <PrimaryButton label="Retry" onPress={() => void refetch()} />
        </SectionCard>
      </ScrollView>
    )
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
        gap: spacing.lg,
      }}
    >
      <SectionCard style={{ backgroundColor: palette.surfaceStrong }}>
        <Text style={[typography.eyebrow, { color: palette.inkMuted }]}>Monthly pace</Text>
        <Text style={[typography.title, { color: palette.ink }]}>
          {data.stats.recordedDays} recorded day{data.stats.recordedDays === 1 ? "" : "s"}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <View
            style={{
              minWidth: "47%",
              borderRadius: 18,
              backgroundColor: "#f7eddc",
              padding: spacing.md,
              gap: spacing.xs,
            }}
          >
            <Text style={[typography.caption, { color: palette.inkMuted }]}>Photo days</Text>
            <Text style={[typography.number, { color: palette.photo }]}>{data.stats.photoDays}</Text>
          </View>
          <View
            style={{
              minWidth: "47%",
              borderRadius: 18,
              backgroundColor: "#e8f2f8",
              padding: spacing.md,
              gap: spacing.xs,
            }}
          >
            <Text style={[typography.caption, { color: palette.inkMuted }]}>Sketch days</Text>
            <Text style={[typography.number, { color: palette.doodle }]}>
              {data.stats.doodleDays}
            </Text>
          </View>
          <View
            style={{
              minWidth: "47%",
              borderRadius: 18,
              backgroundColor: "#f8ece8",
              padding: spacing.md,
              gap: spacing.xs,
            }}
          >
            <Text style={[typography.caption, { color: palette.inkMuted }]}>Word days</Text>
            <Text style={[typography.number, { color: palette.text }]}>{data.stats.textDays}</Text>
          </View>
          <View
            style={{
              minWidth: "47%",
              borderRadius: 18,
              backgroundColor: palette.surface,
              padding: spacing.md,
              gap: spacing.xs,
            }}
          >
            <Text style={[typography.caption, { color: palette.inkMuted }]}>Focus</Text>
            <Text style={[typography.bodyStrong, { color: palette.ink }]}>
              One-handed capture, then get out.
            </Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={[typography.eyebrow, { color: palette.inkMuted }]}>Focus month</Text>
            <Text style={[typography.sectionTitle, { color: palette.ink }]}>{data.monthLabel}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <PrimaryButton label="Prev" tone="secondary" compact onPress={goToPreviousMonth} />
            <PrimaryButton label="Next" tone="secondary" compact onPress={goToNextMonth} />
          </View>
        </View>

        <Text style={[typography.body, { color: palette.inkMuted }]}>
          Tap any day to open the native sheet and capture a photo, a sketch, or one short line.
        </Text>

        <SegmentedControl options={layerOptions} value={activeLayer} onChange={setActiveLayer} />
        <MonthGrid weeks={data.weeks} activeLayer={activeLayer} onPressDay={openDay} />
      </SectionCard>

      <SectionCard>
        <Text style={[typography.eyebrow, { color: palette.inkMuted }]}>Today prompt</Text>
        <Text style={[typography.sectionTitle, { color: palette.ink }]}>
          Keep the detail that would vanish first.
        </Text>
        <Text style={[typography.body, { color: palette.inkMuted }]}>
          The branch is local-first on purpose, so mobile can move without waiting on backend work.
        </Text>
        <PrimaryButton label="Open today" onPress={() => openDay(data.todayLocalDate)} />
      </SectionCard>
    </ScrollView>
  )
}
