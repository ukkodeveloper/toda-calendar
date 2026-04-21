"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { motionTokens } from "@workspace/ui/lib/motion"

function splitMonthLabel(label: string) {
  const [month = "", year = ""] = label.split(" ")
  return { month, year }
}

type CalendarHeaderProps = {
  activeMonthLabel: string
  modeLabel: string
  showModeLabel: boolean
}

export function CalendarHeader({
  activeMonthLabel,
  modeLabel,
  showModeLabel,
}: CalendarHeaderProps) {
  const reducedMotion = useReducedMotion()
  const { month, year } = splitMonthLabel(activeMonthLabel)

  return (
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
          {showModeLabel ? (
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
              {modeLabel}
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
  )
}
