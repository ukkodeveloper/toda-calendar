import { cn } from "@workspace/ui/lib/utils"

export type CalendarPreviewDay = {
  day: number
  isCurrentMonth?: boolean
  isSelected?: boolean
  isToday?: boolean
  preview?: {
    style: "wash" | "stroke" | "lines"
    label: string
  }
}

type CalendarPreviewProps = {
  days: CalendarPreviewDay[]
  density?: "compact" | "comfortable" | "spacious"
  monthLabel: string
  previewStyleLabel?: string
  weekdays?: string[]
  className?: string
}

const defaultWeekdays = ["일", "월", "화", "수", "목", "금", "토"]

function CalendarPreview({
  className,
  density = "comfortable",
  days,
  monthLabel,
  previewStyleLabel = "미리보기",
  weekdays = defaultWeekdays,
}: CalendarPreviewProps) {
  return (
    <section
      aria-label={`${monthLabel} 미리보기`}
      className={cn("overflow-hidden bg-[var(--calendar-cell)]", className)}
    >
      <div className="flex items-center justify-between border-b border-[var(--calendar-divider)] px-3 py-2.5">
        <h3 className="text-[1.02rem] font-semibold text-balance text-foreground">
          {monthLabel}
        </h3>
        <span className="rounded-full bg-[var(--calendar-nav)] px-2.5 py-1 text-[0.72rem] font-medium text-foreground/58">
          {previewStyleLabel}
        </span>
      </div>
      <div
        aria-label="요일"
        className="grid grid-cols-7 border-b border-[var(--calendar-divider)]"
        role="group"
      >
        {weekdays.map((weekday, index) => (
          <div
            key={`${weekday}-${index}`}
            className="grid h-7 place-items-center text-[0.65rem] font-semibold text-foreground/42"
          >
            <span aria-hidden="true">{weekday}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, index) => (
          <CalendarPreviewCell
            key={`${day.day}-${index}`}
            day={day}
            density={density}
          />
        ))}
      </div>
    </section>
  )
}

function CalendarPreviewCell({
  day,
  density,
}: {
  day: CalendarPreviewDay
  density: NonNullable<CalendarPreviewProps["density"]>
}) {
  const hasPreview = Boolean(day.preview)

  return (
    <div
      className={cn(
        "relative aspect-[4/5] min-w-0 overflow-hidden border-r border-b border-[var(--calendar-divider)] bg-white/48",
        !day.isCurrentMonth && "bg-transparent"
      )}
    >
      <span className="sr-only">
        {day.day}일{day.isToday ? ", 오늘" : ""}
        {day.isSelected ? ", 선택됨" : ""}
        {day.preview
          ? `, ${getPreviewStyleLabel(day.preview.style)} 미리보기: ${day.preview.label}`
          : ""}
      </span>
      {day.preview?.style === "wash" ? (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,180,153,0.92),rgba(153,197,255,0.82)_48%,rgba(255,255,255,0.72))]" />
      ) : null}
      {day.preview?.style === "stroke" ? (
        <div className="absolute inset-1 rounded-[12px] bg-white/76">
          <div className="absolute top-[56%] left-[18%] h-7 w-[68%] -rotate-6 rounded-[999px] border-t-2 border-[var(--calendar-accent)]/72" />
          <div className="absolute top-[28%] left-[24%] h-4 w-4 rounded-full border-2 border-foreground/38" />
        </div>
      ) : null}
      {day.preview?.style === "lines" ? (
        <div
          className={cn(
            "absolute inset-x-1.5 bottom-1.5",
            density === "compact" && "space-y-0.5",
            density !== "compact" && "space-y-1"
          )}
        >
          <div className="h-1.5 rounded-full bg-foreground/28" />
          <div className="h-1.5 w-4/5 rounded-full bg-foreground/18" />
          {density !== "compact" ? (
            <div className="h-1.5 w-3/5 rounded-full bg-foreground/12" />
          ) : null}
        </div>
      ) : null}
      {!hasPreview ? (
        <div className="absolute inset-1 rounded-[12px] bg-[var(--calendar-preview-empty)]" />
      ) : null}
      {day.isSelected ? (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: "var(--calendar-selection-fill)",
            boxShadow:
              "inset 0 0 0 1px var(--calendar-selection-ring), var(--calendar-selection-shadow)",
          }}
        />
      ) : null}
      <div
        className={cn(
          "absolute top-1 left-1 grid size-5 place-items-center rounded-full text-[0.64rem] font-semibold tabular-nums backdrop-blur-[14px]",
          day.isSelected
            ? "bg-[var(--calendar-date-selected)] text-white"
            : "bg-[var(--calendar-date-badge)] text-[var(--calendar-date-text-strong)]"
        )}
      >
        <span
          className={cn(
            day.isToday && "text-[var(--calendar-accent)]",
            day.isSelected && "text-white"
          )}
        >
          {day.day}
        </span>
      </div>
    </div>
  )
}

function getPreviewStyleLabel(
  style: NonNullable<CalendarPreviewDay["preview"]>["style"]
) {
  if (style === "wash") {
    return "채움"
  }

  if (style === "stroke") {
    return "선"
  }

  return "줄"
}

export { CalendarPreview }
