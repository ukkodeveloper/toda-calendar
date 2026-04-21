"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import Image from "next/image"

import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

import type { CalendarDayRecord, CalendarGridDay, ContentType } from "../model/types"
import { useDayCellGesture } from "../hooks/use-day-cell-gesture"
import { resolveVisiblePreviewType } from "../utils/preview"
import { DoodleArt } from "./doodle-art"

type CalendarDayCellProps = {
  activePreviewType: ContentType
  day: CalendarGridDay
  isSelected: boolean
  modeSwapVersion: number
  onCyclePreview: () => void
  onOpenDay: (date: string) => void
  record?: CalendarDayRecord
  revealDelay?: number
}

function trimLabel(value: string, max = 54) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function DayPreview({
  activePreviewType,
  modeSwapVersion,
  record,
  revealDelay = 0,
}: {
  activePreviewType: ContentType
  modeSwapVersion: number
  record?: CalendarDayRecord
  revealDelay?: number
}) {
  const reducedMotion = useReducedMotion()
  const visibleType = record
    ? resolveVisiblePreviewType(record, activePreviewType, {
        photo: true,
        doodle: true,
        text: true,
      })
    : null

  const previewKey = `${modeSwapVersion}:${activePreviewType}:${visibleType ?? "empty"}`

  return (
    <div className="absolute inset-x-1.5 bottom-1.5 top-8 overflow-hidden rounded-[16px]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={previewKey}
          className="absolute inset-0"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 10, scale: 0.992 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -10, scale: 0.992 }}
          transition={
            reducedMotion
              ? { duration: motionTokens.duration.instant }
              : {
                  duration: motionTokens.duration.quick,
                  delay: revealDelay,
                  ease: motionTokens.ease.enter,
                }
          }
        >
          {visibleType === "photo" && record?.photo ? (
            <div className="relative h-full w-full overflow-hidden rounded-[16px]">
              <Image
                alt={record.photo.alt}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 14vw, 110px"
                src={record.photo.src}
                unoptimized={record.photo.src.startsWith("blob:")}
              />
            </div>
          ) : null}

          {visibleType === "doodle" && record?.doodle ? (
            <div className="flex h-full items-center justify-center px-1 py-0.5">
              <DoodleArt className="opacity-[0.94]" strokes={record.doodle.strokes} />
            </div>
          ) : null}

          {visibleType === "text" && record?.text ? (
            <div className="flex h-full items-start px-1.5 py-1">
              <p className="line-clamp-4 text-[0.78rem] font-medium leading-[1rem] tracking-[-0.02em] text-foreground/74">
                {trimLabel(record.text.title?.trim() || record.text.body.trim() || "Note")}
              </p>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export function CalendarDayCell({
  activePreviewType,
  day,
  isSelected,
  modeSwapVersion,
  onCyclePreview,
  onOpenDay,
  record,
  revealDelay = 0,
}: CalendarDayCellProps) {
  const reducedMotion = useReducedMotion()
  const visibleType = record
    ? resolveVisiblePreviewType(record, activePreviewType, {
        photo: true,
        doodle: true,
        text: true,
      })
    : null
  const hasVisiblePreview = Boolean(visibleType)
  const gesture = useDayCellGesture({
    onDoubleTap: onCyclePreview,
    onSingleTap: () => {
      if (day.date) {
        onOpenDay(day.date)
      }
    },
  })

  if (day.isPlaceholder || !day.date || !day.dayNumber) {
    return <div className="min-h-[5.7rem] sm:min-h-[6.1rem]" />
  }

  return (
    <motion.button
      type="button"
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      transition={motionTokens.spring.press}
      aria-label={`${day.date}. Tap once to edit. Double tap to cycle all calendar content.`}
      className="relative min-h-[5.7rem] w-full touch-manipulation rounded-[20px] bg-transparent px-0 py-0 text-left outline-none sm:min-h-[6.1rem]"
      onKeyDown={gesture.onKeyDown}
      onPointerUp={gesture.onPointerUp}
    >
      {isSelected ? (
        <span className="pointer-events-none absolute inset-[0.2rem] rounded-[18px] bg-[var(--calendar-selection-fill)] shadow-[var(--calendar-selection-shadow)]" />
      ) : null}

      <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 flex items-center gap-1.5">
        <span
          className={cn(
            "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-[0.12rem] text-[0.76rem] font-semibold tracking-[-0.02em] transition-colors",
            day.isToday && isSelected
              ? "bg-[var(--calendar-accent)] text-white"
              : day.isToday
                ? "bg-white/82 text-[var(--calendar-accent)] shadow-[0_2px_10px_rgba(15,23,42,0.08)] backdrop-blur-[14px]"
                : hasVisiblePreview || isSelected
                  ? "bg-[var(--calendar-date-overlay)] text-foreground/76 shadow-[var(--calendar-date-shadow)] backdrop-blur-[14px]"
                  : "text-[var(--calendar-muted-label)]"
          )}
        >
          {day.dayNumber}
        </span>
      </div>

      {hasVisiblePreview ? (
        <DayPreview
          activePreviewType={activePreviewType}
          modeSwapVersion={modeSwapVersion}
          record={record}
          revealDelay={revealDelay}
        />
      ) : null}
    </motion.button>
  )
}
