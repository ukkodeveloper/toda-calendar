"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

import type { CalendarDoodleSlot, CalendarDoodleStroke, DoodlePoint } from "../model/types"
import { DoodleArt } from "./doodle-art"

type DoodleCanvasProps = {
  mode?: "peek" | "expanded"
  onChange: (slot?: CalendarDoodleSlot) => void
  onDrawingChange?: (drawing: boolean) => void
  slot?: CalendarDoodleSlot
}

const DEFAULT_STROKE_COLOR = "#1F2937"
const DEFAULT_STROKE_WIDTH = 4
const GUIDE_STROKES: CalendarDoodleStroke[] = [
  {
    color: "rgba(15,23,42,0.14)",
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
    color: "rgba(15,23,42,0.14)",
    width: 3,
    points: [
      { x: 36, y: 52 },
      { x: 38, y: 52 },
    ],
  },
  {
    color: "rgba(15,23,42,0.14)",
    width: 3,
    points: [
      { x: 62, y: 52 },
      { x: 64, y: 52 },
    ],
  },
  {
    color: "rgba(15,23,42,0.14)",
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
  mode = "peek",
  onChange,
  onDrawingChange,
  slot,
}: DoodleCanvasProps) {
  const surfaceRef = React.useRef<SVGSVGElement | null>(null)
  const [activeStroke, setActiveStroke] = React.useState<CalendarDoodleStroke | null>(null)
  const compact = mode === "expanded"

  React.useEffect(() => {
    return () => {
      onDrawingChange?.(false)
    }
  }, [onDrawingChange])

  function pointFromEvent(event: React.PointerEvent<SVGSVGElement>): DoodlePoint | null {
    const rect = surfaceRef.current?.getBoundingClientRect()

    if (!rect) {
      return null
    }

    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    }
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    const point = pointFromEvent(event)

    if (!point) {
      return
    }

    onDrawingChange?.(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    setActiveStroke({
      color: DEFAULT_STROKE_COLOR,
      width: DEFAULT_STROKE_WIDTH,
      points: [point],
    })
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!activeStroke) {
      return
    }

    const point = pointFromEvent(event)

    if (!point) {
      return
    }

    setActiveStroke((current) =>
      current
        ? {
            ...current,
            points: [...current.points, point],
          }
        : current
    )
  }

  function commitStroke() {
    if (!activeStroke) {
      onDrawingChange?.(false)
      return
    }

    onChange({
      type: "doodle",
      strokes: [...(slot?.strokes ?? []), activeStroke],
    })
    setActiveStroke(null)
    onDrawingChange?.(false)
  }

  function clearDoodle() {
    setActiveStroke(null)
    onDrawingChange?.(false)
    onChange(undefined)
  }

  const previewStrokes = activeStroke
    ? [...(slot?.strokes ?? []), activeStroke]
    : (slot?.strokes ?? [])

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden rounded-[22px] border border-black/[0.06]",
          compact ? "rounded-[20px]" : "rounded-[24px]"
        )}
      >
        {!previewStrokes.length ? (
          <>
            <div className="pointer-events-none absolute inset-0 opacity-90">
              <DoodleArt className="h-full w-full" strokes={GUIDE_STROKES} />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[0.82rem] font-medium text-foreground/30">
              Try a sleepy cat face
            </div>
          </>
        ) : null}

        <DoodleArt className="absolute inset-0 h-full w-full" strokes={previewStrokes} />
        <svg
          ref={surfaceRef}
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full touch-none"
          fill="none"
          onPointerCancel={commitStroke}
          onPointerDown={handlePointerDown}
          onPointerLeave={commitStroke}
          onPointerMove={handlePointerMove}
          onPointerUp={commitStroke}
        >
          <rect x="0" y="0" width="100" height="100" fill="transparent" />
        </svg>
      </div>

      <div className="flex h-9 items-center justify-end">
        <button
          type="button"
          className={cn(
            "rounded-full border border-black/[0.08] text-foreground/56 outline-none transition-colors hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-[var(--calendar-accent)]/40 disabled:opacity-35",
            compact ? "h-9 px-3 text-[0.8rem] font-medium" : "h-10 px-4 text-[0.88rem] font-medium"
          )}
          disabled={!previewStrokes.length}
          onClick={clearDoodle}
        >
          Clear
        </button>
      </div>
    </div>
  )
}
