"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import Image from "next/image"

import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

import { appCopy } from "@/lib/copy"
import type {
  CalendarDayRecord,
  CalendarGridDay,
  ContentType,
} from "../model/types"
import { useDayCellGesture } from "../hooks/use-day-cell-gesture"
import { resolveVisiblePreviewType } from "../utils/preview"
import { DoodleArt } from "./doodle-art"

type CalendarDayCellProps = {
  activePreviewType: ContentType
  day: CalendarGridDay
  isSelected: boolean
  onAdvancePreviewMode: () => void
  onOpenDay: (date: string) => void
  record?: CalendarDayRecord
  revealDelay?: number
}

const dayCellAspectRatio = "4 / 5"

function trimLabel(value: string, max = 54) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function DayPreview({
  activePreviewType,
  record,
  revealDelay = 0,
}: {
  activePreviewType: ContentType
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
  const animateDoodlePlayback =
    !reducedMotion &&
    visibleType === "doodle" &&
    Boolean(
      record?.doodle?.strokes.some((stroke) =>
        stroke.points.some((point) => typeof point.t === "number")
      )
    )

  const previewKey = `${activePreviewType}:${visibleType ?? "empty"}`

  return (
    <div className="absolute inset-0 overflow-hidden rounded-none">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={previewKey}
          className="absolute inset-0"
          initial={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 1.016, filter: "saturate(0.82) blur(1.5px)" }
          }
          animate={
            reducedMotion
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, filter: "saturate(1) blur(0px)" }
          }
          exit={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.992, filter: "saturate(1.08) blur(1px)" }
          }
          transition={
            reducedMotion
              ? { duration: motionTokens.duration.instant }
              : { ...motionTokens.intent.modeCellSwap, delay: revealDelay }
          }
        >
          {visibleType === "photo" && record?.photo ? (
            <div className="relative h-full w-full overflow-hidden rounded-none">
              <Image
                alt={record.photo.alt}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 14vw, 110px"
                src={record.photo.src}
                unoptimized={
                  record.photo.src.startsWith("blob:") ||
                  record.photo.src.startsWith("data:") ||
                  record.photo.src.startsWith("http://") ||
                  record.photo.src.startsWith("https://")
                }
              />
            </div>
          ) : null}

          {visibleType === "doodle" && record?.doodle ? (
            <div className="flex h-full items-center justify-center px-1 py-0.5">
              <DoodleArt
                animatePlayback={animateDoodlePlayback}
                className="opacity-[0.94]"
                strokes={record.doodle.strokes}
              />
            </div>
          ) : null}

          {visibleType === "text" && record?.text ? (
            <div className="flex h-full items-end px-2 pb-1.5 pt-7">
              <p className="line-clamp-2 break-keep text-[0.7rem] font-semibold leading-[0.9rem] tracking-[-0.02em] text-foreground/74">
                {trimLabel(
                  record.text.title?.trim() ||
                    record.text.body.trim() ||
                    appCopy.component.dayCell.noteFallback
                )}
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
  onAdvancePreviewMode,
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
  const isToday = day.isToday
  const hasVisiblePreview = Boolean(visibleType)
  const showDateBadgeSurface = hasVisiblePreview || isSelected || isToday
  const gesture = useDayCellGesture({
    onDoublePress: onAdvancePreviewMode,
    onPress: () => {
      if (day.date) {
        onOpenDay(day.date)
      }
    },
  })

  if (day.isPlaceholder || !day.date || !day.dayNumber) {
    return <div className="w-full" style={{ aspectRatio: dayCellAspectRatio }} />
  }

  return (
    <motion.button
      type="button"
      data-calendar-date={day.date}
      data-calendar-interactive="true"
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      transition={motionTokens.spring.press}
      aria-label={`${day.date}. ${appCopy.component.dayCell.openDayAriaSuffix}`}
      className="relative w-full touch-manipulation rounded-none bg-transparent px-0 py-0 text-left outline-none"
      style={{ aspectRatio: dayCellAspectRatio }}
      onKeyDown={gesture.onKeyDown}
      onPointerCancel={gesture.onPointerCancel}
      onPointerDown={gesture.onPointerDown}
      onPointerLeave={gesture.onPointerLeave}
      onPointerMove={gesture.onPointerMove}
      onPointerUp={gesture.onPointerUp}
    >
      {hasVisiblePreview ? (
        <DayPreview
          activePreviewType={activePreviewType}
          record={record}
          revealDelay={revealDelay}
        />
      ) : null}

      <AnimatePresence initial={false}>
        {isSelected ? (
          <>
            <motion.span
              className="pointer-events-none absolute inset-0 z-[1] rounded-none"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.992 }}
              style={{
                background: "var(--calendar-selection-fill)",
                boxShadow: "var(--calendar-selection-shadow)",
              }}
              transition={
                reducedMotion
                  ? { duration: motionTokens.duration.instant }
                  : motionTokens.intent.selectionFlow
              }
            />
            <motion.span
              className="pointer-events-none absolute inset-[0.5px] z-[1] rounded-none"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
              style={{
                boxShadow:
                  "inset 0 0 0 0.5px var(--calendar-selection-ring), inset 0 1px 0 var(--calendar-selection-inner-highlight)",
              }}
              transition={
                reducedMotion
                  ? { duration: motionTokens.duration.instant }
                  : {
                      duration: motionTokens.duration.quick,
                      ease: motionTokens.ease.fade,
                    }
              }
            />
          </>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none absolute left-1.5 top-1.5 z-[2]">
        <motion.div
          className="relative grid h-[24px] w-[24px] place-items-center"
          initial={false}
          animate={
            reducedMotion
              ? { scale: 1 }
              : { scale: isSelected ? 1.04 : isToday ? 1.02 : 1 }
          }
          transition={
            reducedMotion
              ? { duration: motionTokens.duration.instant }
              : motionTokens.intent.selectionFlow
          }
        >
          <AnimatePresence initial={false}>
            {isToday && isSelected ? (
              <motion.span
                className="absolute -inset-px rounded-full bg-[var(--calendar-date-selected-halo)]"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                transition={
                  reducedMotion
                    ? { duration: motionTokens.duration.instant }
                    : motionTokens.intent.selectionFlow
                }
              />
            ) : null}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {showDateBadgeSurface && !isSelected ? (
              <motion.span
                key={`${isToday}-${hasVisiblePreview}`}
                className={cn(
                  "absolute inset-0 rounded-full backdrop-blur-[14px]",
                  isToday
                    ? "bg-[var(--calendar-date-today)]"
                    : "bg-[var(--calendar-date-badge)]"
                )}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                style={{
                  boxShadow: isToday
                    ? "var(--calendar-today-shadow)"
                    : "var(--calendar-date-badge-shadow)",
                }}
                transition={
                  reducedMotion
                    ? { duration: motionTokens.duration.instant }
                    : motionTokens.intent.selectionFlow
                }
              />
            ) : null}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {isSelected ? (
              <motion.span
                layoutId="calendar-selected-date-badge"
                className="absolute inset-0 rounded-full bg-[var(--calendar-date-selected)]"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                style={{ boxShadow: "var(--calendar-date-selected-shadow)" }}
                transition={
                  reducedMotion
                    ? { duration: motionTokens.duration.instant }
                    : motionTokens.intent.selectionFlow
                }
              />
            ) : null}
          </AnimatePresence>

          <motion.span
            className={cn(
              "relative z-10 grid h-full w-full place-items-center text-center text-[11px] font-semibold leading-none tracking-[-0.01em] tabular-nums",
              isSelected
                ? "text-white"
                : isToday
                  ? "text-[var(--calendar-accent)]"
                : showDateBadgeSurface
                  ? "text-[color:var(--calendar-date-text-strong)]"
                  : "text-[var(--calendar-muted-label)]"
            )}
            initial={false}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={
              reducedMotion
                ? { duration: motionTokens.duration.instant }
                : {
                    duration: motionTokens.duration.quick,
                    ease: motionTokens.ease.enter,
                  }
            }
          >
            {day.dayNumber}
          </motion.span>
        </motion.div>
      </div>
    </motion.button>
  )
}
