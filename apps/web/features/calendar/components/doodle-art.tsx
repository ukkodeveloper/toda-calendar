import { cn } from "@workspace/ui/lib/utils"

import type { CalendarDoodleStroke } from "../model/types"

type DoodleArtProps = {
  className?: string
  strokes: CalendarDoodleStroke[]
}

function toPath(stroke: CalendarDoodleStroke) {
  return stroke.points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ")
}

export function DoodleArt({ className, strokes }: DoodleArtProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("h-full w-full bg-transparent", className)}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      {strokes.map((stroke, index) => (
        <path
          key={`${stroke.color}-${index}`}
          d={toPath(stroke)}
          stroke={stroke.color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={stroke.width}
        />
      ))}
    </svg>
  )
}
