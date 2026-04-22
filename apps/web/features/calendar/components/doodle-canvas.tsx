"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { motionTokens } from "@workspace/ui/lib/motion"
import type { CalendarDoodleSlot, CalendarDoodleStroke, DoodlePoint } from "../model/types"
import { calendarInteractionUi } from "../utils/interactions"
import { DoodleArt } from "./doodle-art"

type DoodleCanvasProps = {
  label?: string
  mode?: "peek" | "expanded"
  onChange: (slot?: CalendarDoodleSlot) => void
  onDrawingChange?: (drawing: boolean) => void
  recordKey?: string
  slot?: CalendarDoodleSlot
}

const DEFAULT_STROKE_COLOR = "#ff3b30"
const DEFAULT_STROKE_WIDTH = 3.8
const GUIDE_STROKE_COLOR = "rgba(255,59,48,0.18)"
const GUIDE_STROKES: CalendarDoodleStroke[] = [
  {
    color: GUIDE_STROKE_COLOR,
    width: 3,
    points: [
      { x: 18, y: 72 },
      { x: 22, y: 42 },
      { x: 32, y: 24 },
      { x: 40, y: 40 },
      { x: 50, y: 18 },
      { x: 60, y: 40 },
      { x: 68, y: 24 },
      { x: 78, y: 42 },
      { x: 82, y: 72 },
      { x: 18, y: 72 },
    ],
  },
  {
    color: GUIDE_STROKE_COLOR,
    width: 3,
    points: [
      { x: 36, y: 52 },
      { x: 38, y: 52 },
    ],
  },
  {
    color: GUIDE_STROKE_COLOR,
    width: 3,
    points: [
      { x: 62, y: 52 },
      { x: 64, y: 52 },
    ],
  },
  {
    color: GUIDE_STROKE_COLOR,
    width: 3,
    points: [
      { x: 44, y: 64 },
      { x: 50, y: 68 },
      { x: 56, y: 64 },
    ],
  },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function DoodleCanvas({
  label,
  mode = "peek",
  onChange,
  onDrawingChange,
  recordKey,
  slot,
}: DoodleCanvasProps) {
  const surfaceRef = React.useRef<SVGSVGElement | null>(null)
  const [activeStroke, setActiveStroke] = React.useState<CalendarDoodleStroke | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isStrokeActive, setIsStrokeActive] = React.useState(false)
  const reducedMotion = useReducedMotion()
  const compact = mode === "expanded"
  const stageMaxWidth = compact ? 196 : 220
  const aspectRatio = motionTokens.preview.doodleAspectRatio
  const strokeStartRef = React.useRef<number | null>(null)
  const strokeOffsetRef = React.useRef(0)
  const activePointerIdRef = React.useRef<number | null>(null)
  const activeStrokeRef = React.useRef<CalendarDoodleStroke | null>(null)
  const slotStrokesRef = React.useRef(slot?.strokes ?? [])
  const previousRecordKeyRef = React.useRef(recordKey)
  const hasCommittedStrokes = Boolean(slot?.strokes.length)

  React.useEffect(() => {
    return () => {
      onDrawingChange?.(false)
    }
  }, [onDrawingChange])

  React.useEffect(() => {
    if (!slot?.strokes.length) {
      setIsEditing(false)
    }
  }, [slot?.strokes.length])

  React.useEffect(() => {
    slotStrokesRef.current = slot?.strokes ?? []
  }, [slot?.strokes])

  React.useEffect(() => {
    if (previousRecordKeyRef.current === recordKey) {
      return
    }

    previousRecordKeyRef.current = recordKey
    setActiveStroke(null)
    activeStrokeRef.current = null
    setIsEditing(false)
    setIsStrokeActive(false)
    strokeStartRef.current = null
    activePointerIdRef.current = null
    onDrawingChange?.(false)
  }, [onDrawingChange, recordKey, slot?.strokes.length])

  const isLockedPreview = hasCommittedStrokes && !isEditing
  const isCanvasInteractive = isEditing

  function pointFromEvent(event: React.PointerEvent<SVGSVGElement>): DoodlePoint | null {
    return pointFromClientPosition(event.clientX, event.clientY)
  }

  function pointFromClientPosition(clientX: number, clientY: number): DoodlePoint | null {
    const rect = surfaceRef.current?.getBoundingClientRect()

    if (!rect) {
      return null
    }

    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
    }
  }

  function getEventPoints(event: React.PointerEvent<SVGSVGElement>) {
    const nativeEvent = event.nativeEvent
    const samples =
      typeof nativeEvent.getCoalescedEvents === "function"
        ? nativeEvent.getCoalescedEvents()
        : [nativeEvent]

    return samples
      .map((sample, index) => {
        const point = pointFromClientPosition(sample.clientX, sample.clientY)

        if (!point) {
          return null
        }

        return {
          ...point,
          t:
            strokeOffsetRef.current +
            Math.max(
              0,
              performance.now() - (strokeStartRef.current ?? performance.now())
            ) +
            index * 4,
        }
      })
      .filter((point): point is DoodlePoint & { t: number } => point !== null)
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (isLockedPreview || !isCanvasInteractive || !event.isPrimary) {
      return
    }

    const point = pointFromEvent(event)

    if (!point) {
      return
    }

    const lastTimedPoint =
      slot?.strokes
        .flatMap((stroke) => stroke.points)
        .map((currentPoint) => currentPoint.t ?? 0)
        .reduce((max, value) => Math.max(max, value), 0) ?? 0

    strokeStartRef.current = performance.now()
    strokeOffsetRef.current = lastTimedPoint > 0 ? lastTimedPoint + 90 : 0
    activePointerIdRef.current = event.pointerId
    setIsStrokeActive(true)
    onDrawingChange?.(true)
    if (event.cancelable) {
      event.preventDefault()
    }
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const nextStroke = {
      color: DEFAULT_STROKE_COLOR,
      width: DEFAULT_STROKE_WIDTH,
      points: [
        {
          ...point,
          t: strokeOffsetRef.current,
        },
      ],
    }
    activeStrokeRef.current = nextStroke
    setActiveStroke(nextStroke)
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (
      isLockedPreview ||
      !isCanvasInteractive ||
      !event.isPrimary ||
      activePointerIdRef.current !== event.pointerId
    ) {
      return
    }

    if (!activeStrokeRef.current) {
      return
    }

    if (event.cancelable) {
      event.preventDefault()
    }

    const nextPoints = getEventPoints(event)

    if (!nextPoints.length) {
      return
    }

    setActiveStroke((current) => {
      const baseStroke = current ?? activeStrokeRef.current

      if (!baseStroke) {
        return current
      }

      const appendedPoints = nextPoints.filter((point) => {
        const lastPoint =
          (baseStroke.points[baseStroke.points.length - 1] ??
            activeStrokeRef.current?.points[activeStrokeRef.current.points.length - 1])!

        return Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) >= 0.45
      })

      if (!appendedPoints.length) {
        return baseStroke
      }

      const nextStroke = {
        ...baseStroke,
        points: [...baseStroke.points, ...appendedPoints],
      }

      activeStrokeRef.current = nextStroke
      return nextStroke
    })
  }

  function commitStroke(event?: React.PointerEvent<SVGSVGElement>) {
    if (
      event &&
      activePointerIdRef.current !== null &&
      event.pointerId !== activePointerIdRef.current
    ) {
      return
    }

    activePointerIdRef.current = null
    setIsStrokeActive(false)

    const strokeToCommit = activeStrokeRef.current

    if (!strokeToCommit) {
      onDrawingChange?.(false)
      return
    }

    onChange({
      type: "doodle",
      strokes: [...slotStrokesRef.current, strokeToCommit],
    })
    activeStrokeRef.current = null
    setActiveStroke(null)
    strokeStartRef.current = null
    onDrawingChange?.(false)
  }

  function clearDoodle() {
    activeStrokeRef.current = null
    setActiveStroke(null)
    setIsEditing(false)
    setIsStrokeActive(false)
    activePointerIdRef.current = null
    onDrawingChange?.(false)
    onChange(undefined)
  }

  function finishEditing() {
    const strokeToCommit = activeStrokeRef.current

    if (strokeToCommit) {
      onChange({
        type: "doodle",
        strokes: [...slotStrokesRef.current, strokeToCommit],
      })
      activeStrokeRef.current = null
      setActiveStroke(null)
    }

    strokeStartRef.current = null
    activePointerIdRef.current = null
    setIsStrokeActive(false)
    onDrawingChange?.(false)
    setIsEditing(false)
  }

  const previewStrokes = activeStroke
    ? [...(slot?.strokes ?? []), activeStroke]
    : (slot?.strokes ?? [])
  const hasPreviewStrokes = previewStrokes.length > 0

  return (
    <div className="flex h-full min-h-0 items-center justify-center">
      <div
        className="relative w-full overflow-hidden rounded-[26px] bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_18px_32px_rgba(15,23,42,0.08)]"
        style={{
          maxHeight: "100%",
          maxWidth: stageMaxWidth,
          aspectRatio: `${aspectRatio}`,
        }}
      >
        {label ? (
          <div className="pointer-events-none absolute top-3 left-3 z-[1]">
            <div className="rounded-full bg-white/76 px-2.5 py-1 text-[11px] font-semibold tracking-[-0.01em] text-foreground/56 backdrop-blur-[12px]">
              {label}
            </div>
          </div>
        ) : null}

        {!hasPreviewStrokes ? (
          <>
            <div className="pointer-events-none absolute inset-0 opacity-90">
              <DoodleArt className="h-full w-full" stretch strokes={GUIDE_STROKES} />
            </div>
          </>
        ) : null}

        <DoodleArt
          className="absolute inset-0 h-full w-full"
          stretch
          strokes={previewStrokes}
        />
        <svg
          ref={surfaceRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full touch-none"
          fill="none"
          style={{
            pointerEvents: isLockedPreview || !isCanvasInteractive ? "none" : "auto",
            touchAction: "none",
            overscrollBehavior: "none",
          }}
          onPointerCancel={commitStroke}
          onPointerDown={handlePointerDown}
          onLostPointerCapture={commitStroke}
          onPointerMove={handlePointerMove}
          onPointerUp={commitStroke}
        >
          <rect x="0" y="0" width="100" height="100" fill="transparent" />
        </svg>

        <AnimatePresence initial={false}>
          {!hasPreviewStrokes && !isEditing ? (
            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/18 via-black/6 to-transparent px-3 pb-3 pt-9"
              initial={
                reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }
              }
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={
                reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.985 }
              }
              transition={
                reducedMotion
                  ? { duration: motionTokens.duration.instant }
                  : motionTokens.intent.selectionFlow
              }
            >
              <motion.button
                type="button"
                aria-label="Start sketching"
                className="pointer-events-auto inline-flex min-h-11 rounded-full bg-white/84 px-4 py-2 text-[11px] font-semibold tracking-[-0.01em] text-foreground/68 shadow-[0_10px_22px_rgba(15,23,42,0.1)] backdrop-blur-[14px] outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                transition={motionTokens.intent.touchFeedback}
                onClick={(event) => {
                  event.stopPropagation()
                  setIsEditing(true)
                }}
              >
                Start sketch
              </motion.button>
            </motion.div>
          ) : null}

          {isLockedPreview ? (
            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/26 via-black/10 to-transparent px-3 pb-3 pt-7"
              initial={
                reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }
              }
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={
                reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.985 }
              }
              transition={
                reducedMotion
                  ? { duration: motionTokens.duration.instant }
                  : motionTokens.intent.selectionFlow
              }
            >
              <motion.button
                type="button"
                aria-label="Edit sketch"
                className="pointer-events-auto inline-flex min-h-11 rounded-full bg-white/80 px-4 py-2 text-[11px] font-semibold tracking-[-0.01em] text-foreground/68 shadow-[0_10px_22px_rgba(15,23,42,0.1)] backdrop-blur-[14px] outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                transition={motionTokens.intent.touchFeedback}
                onClick={(event) => {
                  event.stopPropagation()
                  setIsEditing(true)
                }}
              >
                Edit sketch
              </motion.button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {isEditing && hasPreviewStrokes && !isStrokeActive ? (
            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/24 via-black/10 to-transparent px-3 pb-3 pt-8"
              initial={
                reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.94 }
              }
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={
                reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.985 }
              }
              transition={
                reducedMotion
                  ? { duration: motionTokens.duration.instant }
                  : motionTokens.intent.selectionFlow
              }
            >
              <div
                className="pointer-events-auto flex items-center gap-2"
                style={{ minHeight: calendarInteractionUi.minTouchTarget }}
              >
                <motion.button
                  type="button"
                  aria-label="Clear sketch"
                  className="inline-flex min-h-11 rounded-full bg-white/8 px-[3px] py-[3px] shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-[10px] outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                  transition={motionTokens.intent.touchFeedback}
                  onClick={(event) => {
                    event.stopPropagation()
                    clearDoodle()
                  }}
                >
                  <span className="rounded-full bg-white/82 px-4 py-2 text-[11px] font-semibold tracking-[-0.01em] text-foreground/64">
                    Clear
                  </span>
                </motion.button>

                <motion.button
                  type="button"
                  aria-label="Finish sketch editing"
                  className="inline-flex min-h-11 rounded-full bg-[linear-gradient(180deg,rgba(255,110,100,0.98)_0%,rgba(255,59,48,0.98)_100%)] px-4 py-2 text-[11px] font-semibold tracking-[-0.01em] text-white shadow-[0_12px_24px_rgba(255,59,48,0.24),inset_0_1px_0_rgba(255,255,255,0.32)] outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                  transition={motionTokens.intent.touchFeedback}
                  onClick={(event) => {
                    event.stopPropagation()
                    finishEditing()
                  }}
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
