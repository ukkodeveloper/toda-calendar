"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

import type {
  CalendarDayRecord,
  ContentType,
  MonthSection as MonthSectionType,
} from "../model/types"
import { CalendarDayCell } from "./day-cell"

type CalendarMonthSectionProps = {
  activePreviewType: ContentType
  lastRecordMutationDate: string | null
  modeSwapVersion: number
  onCyclePreview: () => void
  onOpenDay: (date: string) => void
  recordsByDate: Record<string, CalendarDayRecord>
  recordsVersion: number
  registerSection: (key: string, node: HTMLElement | null) => void
  selectedDate: string | null
  section: MonthSectionType
}

function isDateInSection(section: MonthSectionType, date: string | null) {
  return Boolean(date?.startsWith(section.monthStart.slice(0, 7)))
}

function CalendarMonthSectionComponent({
  activePreviewType,
  modeSwapVersion,
  onCyclePreview,
  onOpenDay,
  recordsByDate,
  registerSection,
  selectedDate,
  section,
}: CalendarMonthSectionProps) {
  const handleSectionRef = React.useCallback(
    (node: HTMLElement | null) => {
      registerSection(section.key, node)
    },
    [registerSection, section.key]
  )

  return (
    <section
      ref={handleSectionRef}
      aria-label={section.monthLabel}
      className="px-0"
      style={{ contentVisibility: "auto", containIntrinsicSize: "396px" }}
    >
      <h2 className="sr-only">{section.monthLabel}</h2>
      <div className="space-y-0">
        {section.weeks.map((week, weekIndex) => (
          <div
            key={`${section.key}-${weekIndex}`}
            className={cn("grid grid-cols-7 gap-0")}
          >
            {week.map((day, dayIndex) => (
              <CalendarDayCell
                key={day.date ?? `${section.key}-${weekIndex}-${dayIndex}`}
                activePreviewType={activePreviewType}
                day={day}
                isSelected={selectedDate === day.date}
                modeSwapVersion={modeSwapVersion}
                onCyclePreview={onCyclePreview}
                onOpenDay={onOpenDay}
                record={day.date ? recordsByDate[day.date] : undefined}
                revealDelay={0.018 + 0.004 * (dayIndex % 2)}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

export const CalendarMonthSection = React.memo(
  CalendarMonthSectionComponent,
  (previousProps, nextProps) => {
    if (
      previousProps.activePreviewType !== nextProps.activePreviewType ||
      previousProps.modeSwapVersion !== nextProps.modeSwapVersion ||
      previousProps.onCyclePreview !== nextProps.onCyclePreview ||
      previousProps.onOpenDay !== nextProps.onOpenDay ||
      previousProps.registerSection !== nextProps.registerSection ||
      previousProps.section !== nextProps.section
    ) {
      return false
    }

    const selectionChanged =
      previousProps.selectedDate !== nextProps.selectedDate &&
      (isDateInSection(previousProps.section, previousProps.selectedDate) ||
        isDateInSection(nextProps.section, nextProps.selectedDate))

    if (selectionChanged) {
      return false
    }

    const recordMutationChanged =
      previousProps.recordsVersion !== nextProps.recordsVersion &&
      (isDateInSection(previousProps.section, previousProps.lastRecordMutationDate) ||
        isDateInSection(nextProps.section, nextProps.lastRecordMutationDate))

    if (recordMutationChanged) {
      return false
    }

    return true
  }
)
