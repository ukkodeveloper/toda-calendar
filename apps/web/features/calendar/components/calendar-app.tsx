"use client"

import { AnimatePresence, LayoutGroup } from "framer-motion"
import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

import { CalendarHeader } from "@/components/calendar/calendar-header"
import { ClosedJournalDock } from "@/components/calendar/closed-journal-dock"
import { useMonthRange } from "../hooks/use-month-range"
import { useCalendarState } from "../hooks/use-calendar-state"
import { toIsoDate } from "../utils/date"
import { CalendarMonthSection } from "./month-section"
import { DayEditorSheet } from "./day-editor-sheet"

const dockPrompts = [
  "Give today one small memory.",
  "Catch one quiet moment before the day fades.",
  "Leave a photo, sketch, or sentence for tonight.",
  "Keep today in a softer way.",
  "Write down the part you want to remember.",
] as const

function getNextPromptIndex(current: number) {
  if (dockPrompts.length <= 1) {
    return 0
  }

  let next = current

  while (next === current) {
    next = Math.floor(Math.random() * dockPrompts.length)
  }

  return next
}

export function CalendarApp() {
  const {
    activeMonthLabel,
    bottomSentinelRef,
    registerSection,
    sections,
    topSentinelRef,
  } = useMonthRange()
  const {
    closeEditor,
    error,
    isInitialLoading,
    openDay,
    reload,
    saveDayRecord,
    selectedRecord,
    state,
  } = useCalendarState(sections.map((section) => section.monthStart.slice(0, 7)))
  const [sheetLaunchLift, setSheetLaunchLift] = React.useState(0)
  const [promptIndex, setPromptIndex] = React.useState(() =>
    Math.floor(Math.random() * dockPrompts.length)
  )
  const previousOpenRef = React.useRef<boolean | null>(null)
  const isEditorOpen = Boolean(selectedRecord)

  const openTodayEditor = React.useCallback((lift = 0) => {
    setSheetLaunchLift(lift)
    openDay(toIsoDate(new Date()))
  }, [openDay])

  React.useEffect(() => {
    const isOpen = Boolean(selectedRecord)

    if (previousOpenRef.current === null) {
      previousOpenRef.current = isOpen
      return
    }

    if (previousOpenRef.current !== isOpen) {
      setPromptIndex((current) => getNextPromptIndex(current))
      previousOpenRef.current = isOpen
    }
  }, [selectedRecord])

  if (isInitialLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[var(--calendar-app-bg)] px-6 text-center text-foreground">
        <div className="max-w-sm space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-foreground/50">
            Connecting
          </p>
          <h1 className="text-2xl font-medium tracking-[-0.03em]">
            Pulling your calendar from the API.
          </h1>
          <p className="text-sm leading-6 text-foreground/60">
            The web surface now reads month records from `apps/api` instead of the local seed.
          </p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[var(--calendar-app-bg)] px-6 text-center text-foreground">
        <div className="max-w-md space-y-4 rounded-[28px] bg-white/55 px-6 py-7 shadow-[0_20px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-foreground/42">
            API Unavailable
          </p>
          <h1 className="text-2xl font-medium tracking-[-0.03em]">
            The calendar could not reach the backend.
          </h1>
          <p className="text-sm leading-6 text-foreground/62">{error}</p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white"
            onClick={reload}
          >
            Retry connection
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-[var(--calendar-app-bg)] text-foreground">
      <div
        aria-hidden={isEditorOpen}
        className={cn("relative", isEditorOpen && "pointer-events-none")}
      >
        <CalendarHeader activeMonthLabel={activeMonthLabel} />

        <div className="relative overflow-hidden px-0 pt-[calc(env(safe-area-inset-top)+3.85rem)] pb-[calc(5.6rem+env(safe-area-inset-bottom))]">
          <div ref={topSentinelRef} className="h-px" />

          <div className="relative">
            <LayoutGroup id="calendar-selection-badge">
              {sections.map((section) => (
                <CalendarMonthSection
                  key={section.key}
                  onOpenDay={(date) => {
                    setSheetLaunchLift(0)
                    openDay(date)
                  }}
                  registerSection={registerSection}
                  recordsByDate={state.recordsByDate}
                  selectedDate={state.selectedDate}
                  section={section}
                />
              ))}
            </LayoutGroup>
          </div>

          <div ref={bottomSentinelRef} className="h-8" />
        </div>

        <AnimatePresence initial={false}>
          {!selectedRecord ? (
            <ClosedJournalDock
              key="closed-journal-dock"
              onOpenToday={openTodayEditor}
              prompt={dockPrompts[promptIndex] ?? dockPrompts[0]}
            />
          ) : null}
        </AnimatePresence>
      </div>

      <DayEditorSheet
        initialLift={sheetLaunchLift}
        onOpenChange={(open) => {
          if (!open) {
            closeEditor()
          }
        }}
        onSave={saveDayRecord}
        open={Boolean(selectedRecord)}
        record={selectedRecord}
      />
    </main>
  )
}
