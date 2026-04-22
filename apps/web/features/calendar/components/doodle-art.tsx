"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

import type { CalendarDoodleStroke, DoodlePoint } from "../model/types"

type DoodleArtProps = {
  animatePlayback?: boolean
  className?: string
  strokes: CalendarDoodleStroke[]
  stretch?: boolean
}

function midpoint(a: DoodlePoint, b: DoodlePoint) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  }
}

function toPath(points: DoodlePoint[]) {
  if (!points.length) {
    return ""
  }

  if (points.length === 1) {
    const point = points[0]!
    return `M ${point.x} ${point.y} L ${point.x + 0.01} ${point.y + 0.01}`
  }

  if (points.length === 2) {
    const start = points[0]!
    const end = points[1]!
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  }

  const first = points[0]!
  let path = `M ${first.x} ${first.y}`

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index]!
    const next = points[index + 1]!
    const mid = midpoint(current, next)

    path += ` Q ${current.x} ${current.y} ${mid.x} ${mid.y}`
  }

  const last = points[points.length - 1]!
  path += ` L ${last.x} ${last.y}`

  return path
}

function getStrokePlayback(strokes: CalendarDoodleStroke[]) {
  const strokeWindows = strokes.map((stroke) => {
    const times = stroke.points
      .map((point) => point.t)
      .filter((time): time is number => typeof time === "number")

    if (!times.length) {
      return null
    }

    return {
      end: Math.max(...times),
      start: Math.min(...times),
    }
  })

  const timedWindows = strokeWindows.filter(
    (window): window is NonNullable<typeof window> => window !== null
  )

  if (!timedWindows.length) {
    return strokes.map(() => null)
  }

  const totalWindow = Math.max(...timedWindows.map((window) => window.end))
  const playbackScale = totalWindow > 1400 ? 1400 / totalWindow : 1

  return strokeWindows.map((window, index) => {
    const fallbackDelay = index * 0.06

    if (!window) {
      return {
        delay: fallbackDelay,
        duration: motionTokens.duration.quick,
      }
    }

    return {
      delay: (window.start * playbackScale) / 1000,
      duration: Math.max(((window.end - window.start) * playbackScale) / 1000, 0.12),
    }
  })
}

export function DoodleArt({
  animatePlayback = false,
  className,
  strokes,
  stretch = false,
}: DoodleArtProps) {
  const playback = React.useMemo(() => getStrokePlayback(strokes), [strokes])
  const renderedStrokes = React.useMemo(
    () =>
      strokes.map((stroke, index) => ({
        animation: playback[index],
        color: stroke.color,
        key: `${stroke.color}-${index}`,
        path: toPath(stroke.points),
        width: stroke.width,
      })),
    [playback, strokes]
  )

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("h-full w-full bg-transparent", className)}
      fill="none"
      preserveAspectRatio={stretch ? "none" : "xMidYMid meet"}
    >
      {renderedStrokes.map((stroke) => {
        const animation = stroke.animation

        if (animatePlayback && animation) {
          return (
            <motion.path
              key={stroke.key}
              d={stroke.path}
              initial={{ opacity: 1, pathLength: 0 }}
              animate={{ opacity: 1, pathLength: 1 }}
              stroke={stroke.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={stroke.width}
              transition={{
                delay: animation.delay,
                duration: animation.duration,
                ease: "linear",
              }}
            />
          )
        }

        return (
          <path
            key={stroke.key}
            d={stroke.path}
            stroke={stroke.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={stroke.width}
          />
        )
      })}
    </svg>
  )
}
