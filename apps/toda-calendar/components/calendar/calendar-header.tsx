"use client"

import Link from "next/link"
import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { motionTokens } from "@workspace/ui/lib/motion"

import { appCopy } from "@/lib/copy"
import type { ContentType } from "@/features/calendar/model/types"

function splitMonthLabel(label: string) {
  const [month = "", year = ""] = label.split(" ")
  return { month, year }
}

function createWeekdayLabels(locale: string) {
  const longFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "long",
  })
  const shortFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "short",
  })
  const sunday = Date.UTC(2024, 0, 7)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday + index * 24 * 60 * 60 * 1000)

    return {
      fullLabel: longFormatter.format(date),
      shortLabel: shortFormatter.format(date),
    }
  })
}

type CalendarHeaderProps = {
  activeMonthLabel: string
  activePreviewType: ContentType
  authHref?: string
  onAdvancePreviewMode: () => void
  settingsHref: string
  sessionLabel?: string | null
  showSignInLink?: boolean
  showSessionLabel?: boolean
}

export function CalendarHeader({
  activeMonthLabel,
  activePreviewType,
  authHref = "/login",
  onAdvancePreviewMode,
  settingsHref,
  sessionLabel,
  showSignInLink = false,
  showSessionLabel = false,
}: CalendarHeaderProps) {
  const reducedMotion = useReducedMotion()
  const { month, year } = splitMonthLabel(activeMonthLabel)
  const resetTapTimerRef = React.useRef<number | null>(null)
  const lastTapTimeRef = React.useRef(0)
  const previewModeLabel = appCopy.common.previewModes[activePreviewType]
  const weekdayLabels = React.useMemo(
    () => createWeekdayLabels(appCopy.common.locale),
    []
  )

  React.useEffect(() => {
    return () => {
      if (resetTapTimerRef.current !== null) {
        window.clearTimeout(resetTapTimerRef.current)
      }
    }
  }, [])

  function handlePreviewModeTap() {
    const now = Date.now()

    if (now - lastTapTimeRef.current <= 320) {
      lastTapTimeRef.current = 0

      if (resetTapTimerRef.current !== null) {
        window.clearTimeout(resetTapTimerRef.current)
        resetTapTimerRef.current = null
      }

      onAdvancePreviewMode()
      return
    }

    lastTapTimeRef.current = now

    if (resetTapTimerRef.current !== null) {
      window.clearTimeout(resetTapTimerRef.current)
    }

    resetTapTimerRef.current = window.setTimeout(() => {
      lastTapTimeRef.current = 0
      resetTapTimerRef.current = null
    }, 320)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40">
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-start gap-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.button
              key={activeMonthLabel}
              type="button"
              aria-label={`${month} ${year}. ${previewModeLabel} preview. ${appCopy.component.calendarHeader.previewModeAriaLabel}`}
              aria-live="polite"
              className="pointer-events-auto inline-flex touch-manipulation items-center gap-2 rounded-full bg-[color:var(--calendar-nav)]/88 px-3 py-1.5 text-[0.96rem] font-semibold tracking-[-0.03em] text-foreground shadow-[0_10px_26px_rgba(15,23,42,0.06)] backdrop-blur-[18px] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]/50"
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
              onClick={handlePreviewModeTap}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onAdvancePreviewMode()
                }
              }}
            >
              <span>{month} {year}</span>
              <span aria-hidden="true" className="h-3 w-px bg-foreground/12" />
              <span className="text-[0.76rem] font-medium tracking-[-0.02em] text-foreground/58">
                {previewModeLabel}
              </span>
            </motion.button>
          </AnimatePresence>

          <div className="pointer-events-auto ml-auto flex items-center gap-2">
            {showSessionLabel && sessionLabel ? (
              <span className="hidden max-w-[12rem] truncate rounded-full bg-[color:var(--calendar-nav)]/68 px-3 py-1.5 text-[0.76rem] font-medium tracking-[-0.02em] text-foreground/56 backdrop-blur-[18px] sm:inline-flex">
                {sessionLabel}
              </span>
            ) : null}
            {showSignInLink ? (
              <Link
                className="inline-flex h-10 items-center justify-center px-2 text-[0.92rem] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
                href={authHref}
              >
                로그인
              </Link>
            ) : null}
            <Link
              aria-label={appCopy.component.calendarHeader.settingsAriaLabel}
              className="inline-flex size-10 items-center justify-center rounded-full border border-black/6 bg-white/88 text-foreground shadow-[0_6px_18px_rgba(15,23,42,0.06)] backdrop-blur-xl outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45 active:scale-[0.98]"
              href={settingsHref}
            >
              <SettingsIcon />
            </Link>
          </div>
        </div>

        <div className="mt-3 overflow-hidden border-y border-[color:var(--calendar-divider)]/90 bg-[color:var(--calendar-nav)]/62 shadow-[0_8px_26px_rgba(15,23,42,0.035)] backdrop-blur-[22px] backdrop-saturate-[1.18]">
          <div
            aria-label={appCopy.component.calendarHeader.weekdayRowAriaLabel}
            className="grid grid-cols-7"
            role="group"
          >
            {weekdayLabels.map((label) => (
              <div
                key={label.fullLabel}
                aria-label={label.fullLabel}
                className="flex h-9 items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className="text-[0.68rem] font-semibold tracking-[0.02em] text-foreground/44"
                >
                  {label.shortLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[1.15rem]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="m19.32 15.25.24 2.03-1.74 1-1.64-1.18a7.48 7.48 0 0 1-1.74.72L14 20h-4l-.44-2.18a7.5 7.5 0 0 1-1.74-.72l-1.64 1.18-1.74-1 .24-2.03a7.6 7.6 0 0 1 0-1.5l-.24-2.03 1.74-1 1.64 1.18c.55-.3 1.13-.54 1.74-.72L10 4h4l.44 2.18c.6.18 1.19.42 1.74.72l1.64-1.18 1.74 1-.24 2.03c.12.49.12 1.01 0 1.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}
