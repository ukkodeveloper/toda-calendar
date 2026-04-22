"use client"

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion"
import * as React from "react"

import { CalendarHeader } from "@/components/calendar/calendar-header"
import { ClosedJournalDock } from "@/components/calendar/closed-journal-dock"
import { motionTokens } from "@workspace/ui/lib/motion"

import type { ContentType } from "../model/types"
import { useMonthRange } from "../hooks/use-month-range"
import { useCalendarState } from "../hooks/use-calendar-state"
import { toIsoDate } from "../utils/date"
import { cyclePreviewMode } from "../utils/preview"
import { CalendarMonthSection } from "./month-section"
import { DayEditorSheet } from "./day-editor-sheet"

function formatModeLabel(mode: ContentType | null) {
  if (mode === "photo") {
    return "Photo"
  }

  if (mode === "doodle") {
    return "Sketch"
  }

  if (mode === "text") {
    return "Text"
  }

  return ""
}

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
  const reducedMotion = useReducedMotion()
  const {
    activeMonthLabel,
    bottomSpacerHeight,
    registerSection,
    sections,
    topSpacerHeight,
  } = useMonthRange()
  const {
    advancePreviewMode,
    closeEditor,
    openDay,
    saveDayRecord,
    selectedRecord,
    state,
  } = useCalendarState()
  const [modeSwapVersion, setModeSwapVersion] = React.useState(0)
  const [isModeSwitching, setIsModeSwitching] = React.useState(false)
  const [modeLabel, setModeLabel] = React.useState<ContentType | null>(null)
  const [sheetLaunchLift, setSheetLaunchLift] = React.useState(0)
  const [promptIndex, setPromptIndex] = React.useState(() =>
    Math.floor(Math.random() * dockPrompts.length)
  )
  const modeTimerRef = React.useRef<number | null>(null)
  const previousOpenRef = React.useRef<boolean | null>(null)

  const openTodayEditor = React.useCallback((lift = 0) => {
    setSheetLaunchLift(lift)
    openDay(toIsoDate(new Date()))
  }, [openDay])
  const handleOpenDay = React.useCallback(
    (date: string) => {
      setSheetLaunchLift(0)
      openDay(date)
    },
    [openDay]
  )

  React.useEffect(() => {
    return () => {
      if (modeTimerRef.current !== null) {
        window.clearTimeout(modeTimerRef.current)
      }
    }
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

  const handleCyclePreview = React.useCallback(() => {
    const nextMode = cyclePreviewMode(state.activePreviewType, state.previewFilter)

    advancePreviewMode()
    setModeSwapVersion((current) => current + 1)
    setModeLabel(nextMode)
    setIsModeSwitching(true)

    if (modeTimerRef.current !== null) {
      window.clearTimeout(modeTimerRef.current)
    }

    modeTimerRef.current = window.setTimeout(() => {
      setIsModeSwitching(false)
      modeTimerRef.current = null
    }, 320)
  }, [advancePreviewMode, state.activePreviewType, state.previewFilter])

  return (
    <main className="min-h-dvh bg-[var(--calendar-app-bg)] text-foreground">
      <CalendarHeader
        activeMonthLabel={activeMonthLabel}
        modeLabel={formatModeLabel(modeLabel)}
        showModeLabel={Boolean(modeLabel && isModeSwitching)}
      />

      <div className="relative overflow-hidden px-0 pt-[calc(env(safe-area-inset-top)+3.85rem)] pb-[calc(5.6rem+env(safe-area-inset-bottom))]">
        <div className="relative">
          {topSpacerHeight > 0 ? (
            <div aria-hidden="true" style={{ height: topSpacerHeight }} />
          ) : null}

          <AnimatePresence initial={false}>
            {isModeSwitching && !reducedMotion ? (
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: motionTokens.duration.quick,
                  ease: motionTokens.ease.fade,
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-[color:var(--calendar-mode-flash)] backdrop-blur-[4px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.02, 0.1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{
                    ...motionTokens.intent.modePageSwap,
                    times: [0, 0.52, 1],
                  }}
                />
                <motion.div
                  className="absolute inset-0 bg-[color:var(--calendar-mode-accent-wash)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.42, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{
                    ...motionTokens.intent.modePageSwap,
                    times: [0, 0.32, 1],
                  }}
                />
                <motion.div
                  className="absolute inset-y-[-8%] left-[-12%] w-[36%] bg-[image:var(--calendar-mode-accent-glow)] blur-[16px]"
                  initial={{ opacity: 0, x: "10%" }}
                  animate={{ opacity: [0, 0.64, 0], x: ["10%", "0%", "-12%"] }}
                  exit={{ opacity: 0 }}
                  transition={{
                    ...motionTokens.intent.modePageSwap,
                    times: [0, 0.42, 1],
                  }}
                />
                <motion.div
                  className="absolute inset-y-[-8%] left-[-16%] w-[42%] bg-[image:var(--calendar-mode-sweep-glow)] blur-[14px]"
                  initial={{ opacity: 0, x: "14%" }}
                  animate={{ opacity: [0, 0.5, 0], x: ["14%", "2%", "-14%"] }}
                  exit={{ opacity: 0 }}
                  transition={{
                    ...motionTokens.intent.modePageSwap,
                    times: [0, 0.48, 1],
                  }}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <LayoutGroup id="calendar-selection-badge">
            {sections.map((section) => (
              <CalendarMonthSection
                key={section.key}
                activePreviewType={state.activePreviewType}
                lastRecordMutationDate={state.lastRecordMutationDate}
                modeSwapVersion={modeSwapVersion}
                onCyclePreview={handleCyclePreview}
                onOpenDay={handleOpenDay}
                registerSection={registerSection}
                recordsByDate={state.recordsByDate}
                recordsVersion={state.recordsVersion}
                selectedDate={state.selectedDate}
                section={section}
              />
            ))}
          </LayoutGroup>

          {bottomSpacerHeight > 0 ? (
            <div aria-hidden="true" style={{ height: bottomSpacerHeight }} />
          ) : null}
        </div>
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

      <DayEditorSheet
        activePreviewType={state.activePreviewType}
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
