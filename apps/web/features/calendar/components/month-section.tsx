"use client"

import { cn } from "@workspace/ui/lib/utils"

import type {
  CalendarDayRecord,
  ContentType,
  MonthSection as MonthSectionType,
} from "../model/types"
import { CalendarDayCell } from "./day-cell"

type CalendarMonthSectionProps = {
  activePreviewType: ContentType
  modeSwapVersion: number
  onCyclePreview: () => void
  onOpenDay: (date: string) => void
  recordsByDate: Record<string, CalendarDayRecord>
  registerSection: (key: string, node: HTMLElement | null) => void
  selectedDate: string | null
  section: MonthSectionType
}

export function CalendarMonthSection({
  activePreviewType,
  modeSwapVersion,
  onCyclePreview,
  onOpenDay,
  recordsByDate,
  registerSection,
  selectedDate,
  section,
}: CalendarMonthSectionProps) {
  return (
    <section
      ref={(node) => registerSection(section.key, node)}
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
