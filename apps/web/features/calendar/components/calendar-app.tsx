"use client"

import {
  AnimatePresence,
  LayoutGroup,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
  useReducedMotion,
  type PanInfo,
} from "framer-motion"
import * as React from "react"

import { motionTokens } from "@workspace/ui/lib/motion"

import type { ContentType } from "../model/types"
import { useMonthRange } from "../hooks/use-month-range"
import { useCalendarState } from "../hooks/use-calendar-state"
import { toIsoDate } from "../utils/date"
import { cyclePreviewMode } from "../utils/preview"
import { dockDetents, floatingSheetUi } from "../utils/sheet-detents"
import { CalendarMonthSection } from "./month-section"
import { DayEditorSheet } from "./day-editor-sheet"

function splitMonthLabel(label: string) {
  const [month = "", year = ""] = label.split(" ")
  return { month, year }
}

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

function ClosedJournalDock({
  onOpenToday,
  prompt,
}: {
  onOpenToday: (lift?: number) => void
  prompt: string
}) {
  const reducedMotion = useReducedMotion()
  const dragControls = useDragControls()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [viewportWidth, setViewportWidth] = React.useState(393)
  const sideInset = useTransform(
    y,
    [-dockDetents.gestureRange, 0],
    [dockDetents.liftedInset, dockDetents.restInset],
    { clamp: true }
  )
  const bottomInset = useTransform(
    y,
    [-dockDetents.gestureRange, 0],
    [dockDetents.liftedBottom, 0],
    { clamp: true }
  )
  const radius = useTransform(
    y,
    [-dockDetents.gestureRange, 0],
    [dockDetents.liftedRadius, 0],
    { clamp: true }
  )
  const scale = useTransform(
    y,
    [-dockDetents.gestureRange, 0],
    [dockDetents.liftedScale, dockDetents.restScale],
    { clamp: true }
  )
  const dockHeight = useTransform(
    y,
    [-dockDetents.gestureRange, 0],
    [dockDetents.liftedHeight, dockDetents.restHeight],
    { clamp: true }
  )
  const promptOpacity = useTransform(
    y,
    [-dockDetents.gestureRange, 0],
    [1, 0.92],
    { clamp: true }
  )

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const syncViewport = () => {
      setViewportWidth(window.visualViewport?.width ?? window.innerWidth)
    }

    syncViewport()
    window.addEventListener("resize", syncViewport)
    window.visualViewport?.addEventListener("resize", syncViewport)

    return () => {
      window.removeEventListener("resize", syncViewport)
      window.visualViewport?.removeEventListener("resize", syncViewport)
    }
  }, [])

  function settle() {
    animate(
      x,
      0,
      reducedMotion
        ? { duration: motionTokens.duration.instant }
        : motionTokens.intent.dragFollow
    )
    animate(
      y,
      0,
      reducedMotion
        ? { duration: motionTokens.duration.instant }
        : motionTokens.spring.drag
    )
  }

  function handleDragEnd(
    _: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo
  ) {
    if (info.offset.y < -42 || info.velocity.y < -480) {
      onOpenToday(Math.min(dockDetents.gestureRange, Math.max(0, -info.offset.y)))
      settle()
      return
    }

    settle()
  }

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragConstraints={{
        top: -Math.max(180, dockDetents.gestureRange * 2),
        right: Math.max(72, viewportWidth * 0.48),
        bottom: 40,
        left: -Math.max(72, viewportWidth * 0.48),
      }}
      dragElastic={0.14}
      dragListener={false}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      className="pointer-events-auto fixed z-40 overflow-hidden text-foreground shadow-[var(--calendar-sheet-shadow)] backdrop-blur-[28px] backdrop-saturate-[1.35]"
      style={{
        x,
        left: sideInset,
        right: sideInset,
        bottom: bottomInset,
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
        borderBottomLeftRadius: radius,
        borderBottomRightRadius: radius,
        height: dockHeight,
        scale,
        y,
        backgroundColor: "var(--calendar-sheet-surface)",
        boxShadow: "var(--calendar-sheet-shadow), var(--calendar-sheet-inner-shadow)",
      }}
      initial={reducedMotion ? { opacity: 1 } : { y: 18, opacity: 0 }}
      animate={reducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
      transition={
        reducedMotion
          ? { duration: motionTokens.duration.instant }
          : {
              duration: motionTokens.duration.quick,
              ease: motionTokens.ease.enter,
            }
      }
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[var(--calendar-sheet-surface)]" />
        <div className="absolute inset-0 bg-[image:var(--calendar-sheet-glass-overlay)]" />
        <div className="absolute inset-0 bg-[image:var(--calendar-sheet-top-sheen)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[var(--calendar-sheet-edge-highlight)]" />
      </div>

      <div className="relative z-10 flex h-full flex-col px-[16px] pt-[8px] pb-[max(14px,env(safe-area-inset-bottom))]">
        <button
          type="button"
          aria-label="Drag journal drawer"
          className="flex w-full items-center justify-center rounded-full active:cursor-grabbing"
          style={{
            height: floatingSheetUi.handleTouchHeight,
            touchAction: "none",
            WebkitTapHighlightColor: "transparent",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
          onPointerDown={(event) => {
            dragControls.start(event)
          }}
        >
          <motion.span
            className="rounded-full"
            initial={false}
            animate={{
              width: floatingSheetUi.handleWidth,
              height: floatingSheetUi.handleHeight,
            }}
            style={{ backgroundColor: "var(--calendar-sheet-handle)" }}
          />
        </button>
        <motion.div
          style={{ opacity: promptOpacity }}
          className="mt-[8px] flex flex-1 items-center justify-center"
        >
          <button
            type="button"
            className="min-w-0 max-w-[288px] rounded-full px-[12px] py-[6px] text-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--calendar-accent)]/30"
            style={{ backgroundColor: "var(--calendar-sheet-pill)" }}
            onClick={() => onOpenToday(0)}
          >
            <div className="text-[15px] font-medium tracking-[-0.38px] text-foreground/74">
              {prompt}
            </div>
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}

export function CalendarApp() {
  const reducedMotion = useReducedMotion()
  const {
    activeMonthLabel,
    bottomSentinelRef,
    registerSection,
    sections,
    topSentinelRef,
  } = useMonthRange()
  const { dispatch, selectedRecord, state } = useCalendarState()
  const { month, year } = splitMonthLabel(activeMonthLabel)
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
    dispatch({ type: "open-editor", date: toIsoDate(new Date()) })
  }, [dispatch])

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

    dispatch({ type: "cycle-preview-mode" })
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
  }, [dispatch, state.activePreviewType, state.previewFilter])

  return (
    <main className="min-h-dvh bg-[var(--calendar-app-bg)] text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40">
        <div className="flex items-start justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeMonthLabel}
              aria-live="polite"
              className="inline-flex rounded-full bg-[color:var(--calendar-nav)]/88 px-3 py-1.5 text-[0.96rem] font-semibold tracking-[-0.03em] text-foreground shadow-[0_10px_26px_rgba(15,23,42,0.06)] backdrop-blur-[18px]"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={
                reducedMotion
                  ? { duration: motionTokens.duration.instant }
                  : {
                      duration: motionTokens.duration.quick,
                      ease: motionTokens.ease.enter,
                    }
              }
            >
              {month} {year}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {modeLabel && isModeSwitching ? (
              <motion.div
                key={modeLabel}
                className="inline-flex rounded-full bg-white/82 px-3 py-1.5 text-[0.84rem] font-semibold tracking-[-0.02em] text-foreground/68 shadow-[0_8px_22px_rgba(15,23,42,0.07)] backdrop-blur-[16px]"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
                transition={
                  reducedMotion
                    ? { duration: motionTokens.duration.instant }
                    : {
                        duration: motionTokens.duration.quick,
                        ease: motionTokens.ease.enter,
                      }
                }
              >
                {formatModeLabel(modeLabel)}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="mt-3 grid grid-cols-7 px-0 text-center text-[0.68rem] font-medium tracking-[0.04em] text-foreground/36">
          {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
            <div key={`${label}-${index}`}>{label}</div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden px-0 pt-[calc(env(safe-area-inset-top)+3.85rem)] pb-[calc(5.6rem+env(safe-area-inset-bottom))]">
        <div ref={topSentinelRef} className="h-px" />

        <div className="relative">
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
                modeSwapVersion={modeSwapVersion}
                onCyclePreview={handleCyclePreview}
                onOpenDay={(date) => {
                  setSheetLaunchLift(0)
                  dispatch({ type: "open-editor", date })
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

      <DayEditorSheet
        activePreviewType={state.activePreviewType}
        initialLift={sheetLaunchLift}
        onOpenChange={(open) => {
          if (!open) {
            dispatch({ type: "close-editor" })
          }
        }}
        onSave={(record) => dispatch({ type: "save-record", record })}
        open={Boolean(selectedRecord)}
        record={selectedRecord}
      />
    </main>
  )
}
