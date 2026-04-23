"use client"

import { AnimatePresence, LayoutGroup } from "framer-motion"
import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

import { CalendarHeader } from "@/components/calendar/calendar-header"
import type { AppSession } from "@/lib/auth/app-session"
import { appCopy } from "@/lib/copy"
import { ClosedJournalDock } from "@/components/calendar/closed-journal-dock"
import { useMonthRange } from "../hooks/use-month-range"
import { useCalendarState } from "../hooks/use-calendar-state"
import { toIsoDate } from "../utils/date"
import { exceedsTapSlop } from "../utils/interactions"
import { CalendarMonthSection } from "./month-section"
import { DayEditorSheet } from "./day-editor-sheet"

const dockPrompts = appCopy.page.calendar.dockPrompts
const SURFACE_DOUBLE_TAP_MS = 320

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

type CalendarAppProps = {
  session?: AppSession
}

export function CalendarApp({ session }: CalendarAppProps) {
  const {
    activeMonthLabel,
    bottomSentinelRef,
    registerSection,
    sections,
    topSentinelRef,
  } = useMonthRange()
  const {
    advancePreviewMode,
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
  const showAuthActions =
    session?.runtime === "configured" && session.isAuthenticated
  const sessionLabel =
    session?.identity?.email ?? appCopy.page.calendar.sessionFallbackLabel
  const surfacePointerRef = React.useRef<{
    id: number
    moved: boolean
    startX: number
    startY: number
  } | null>(null)
  const lastSurfaceTapRef = React.useRef<{
    time: number
    x: number
    y: number
  } | null>(null)

  const openTodayEditor = React.useCallback((lift = 0) => {
    setSheetLaunchLift(lift)
    openDay(toIsoDate(new Date()))
  }, [openDay])

  const handleSurfacePointerDownCapture = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!event.isPrimary || isInteractiveTapTarget(event.target)) {
        surfacePointerRef.current = null
        return
      }

      surfacePointerRef.current = {
        id: event.pointerId,
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
      }
    },
    []
  )

  const handleSurfacePointerMoveCapture = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const current = surfacePointerRef.current

      if (!current || current.id !== event.pointerId) {
        return
      }

      if (
        exceedsTapSlop(
          { x: current.startX, y: current.startY },
          { x: event.clientX, y: event.clientY }
        )
      ) {
        current.moved = true
      }
    },
    []
  )

  const handleSurfacePointerUpCapture = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const current = surfacePointerRef.current
      surfacePointerRef.current = null

      if (!current || current.id !== event.pointerId || current.moved) {
        return
      }

      const now = Date.now()
      const lastTap = lastSurfaceTapRef.current

      if (
        lastTap &&
        now - lastTap.time <= SURFACE_DOUBLE_TAP_MS &&
        !exceedsTapSlop(
          { x: lastTap.x, y: lastTap.y },
          { x: event.clientX, y: event.clientY },
          24
        )
      ) {
        lastSurfaceTapRef.current = null
        advancePreviewMode()
        return
      }

      lastSurfaceTapRef.current = {
        time: now,
        x: event.clientX,
        y: event.clientY,
      }
    },
    [advancePreviewMode]
  )

  const handleSurfacePointerCancelCapture = React.useCallback(() => {
    surfacePointerRef.current = null
  }, [])

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
            {appCopy.page.calendar.loading.eyebrow}
          </p>
          <h1 className="text-2xl font-medium tracking-[-0.03em]">
            {appCopy.page.calendar.loading.title}
          </h1>
          <p className="text-sm leading-6 text-foreground/60">
            {appCopy.page.calendar.loading.description}
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
            {appCopy.page.calendar.error.eyebrow}
          </p>
          <h1 className="text-2xl font-medium tracking-[-0.03em]">
            {appCopy.page.calendar.error.title}
          </h1>
          <p className="text-sm leading-6 text-foreground/62">{error}</p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white"
            onClick={reload}
          >
            {appCopy.page.calendar.error.retry}
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
        onPointerCancelCapture={handleSurfacePointerCancelCapture}
        onPointerDownCapture={handleSurfacePointerDownCapture}
        onPointerMoveCapture={handleSurfacePointerMoveCapture}
        onPointerUpCapture={handleSurfacePointerUpCapture}
      >
        <CalendarHeader
          activeMonthLabel={activeMonthLabel}
          activePreviewType={state.activePreviewType}
          onAdvancePreviewMode={advancePreviewMode}
          sessionLabel={sessionLabel}
          showAuthActions={showAuthActions}
        />

        <div className="relative overflow-hidden px-0 pt-[calc(env(safe-area-inset-top)+5.95rem)] pb-[calc(5.6rem+env(safe-area-inset-bottom))]">
          <div ref={topSentinelRef} className="h-px" />

          <div className="relative">
            <LayoutGroup id="calendar-selection-badge">
              {sections.map((section) => (
                <CalendarMonthSection
                  key={section.key}
                  activePreviewType={state.activePreviewType}
                  onAdvancePreviewMode={advancePreviewMode}
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

function isInteractiveTapTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return true
  }

  return Boolean(
    target.closest(
      "button, a, input, textarea, select, label, summary, [role='button'], [data-calendar-interactive='true']"
    )
  )
}
