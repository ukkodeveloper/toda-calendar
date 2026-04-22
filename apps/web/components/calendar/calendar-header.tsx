"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { FormatFilter } from "@workspace/ui/components/format-filter"
import { motionTokens } from "@workspace/ui/lib/motion"

import type { ContentType } from "@/features/calendar/model/types"

function splitMonthLabel(label: string) {
  const [month = "", year = ""] = label.split(" ")
  return { month, year }
}

const previewOptions: Array<{ value: ContentType; label: string }> = [
  { value: "photo", label: "Photo" },
  { value: "doodle", label: "Sketch" },
  { value: "text", label: "Text" },
]

type CalendarHeaderProps = {
  activeMonthLabel: string
  activePreviewLabel: string
  onCyclePreview: () => void
  onTogglePreviewFilter: (contentType: ContentType) => void
  previewFilter: Record<ContentType, boolean>
}

export function CalendarHeader({
  activeMonthLabel,
  activePreviewLabel,
  onCyclePreview,
  onTogglePreviewFilter,
  previewFilter,
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

        <div className="pointer-events-auto flex items-center gap-2">
          <motion.button
            type="button"
            aria-label={`Cycle preview mode. Current mode: ${activePreviewLabel}.`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/82 px-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.07)] backdrop-blur-[16px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--calendar-accent)]/35"
            whileTap={reducedMotion ? undefined : { scale: 0.985 }}
            transition={motionTokens.intent.touchFeedback}
            onClick={onCyclePreview}
          >
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-foreground/42">
              Preview
            </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={activePreviewLabel}
                className="text-[0.84rem] font-semibold tracking-[-0.02em] text-foreground/72"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 3 }}
                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -3 }}
                transition={
                  reducedMotion
                    ? { duration: motionTokens.duration.instant }
                    : {
                        duration: motionTokens.duration.quick,
                        ease: motionTokens.ease.enter,
                      }
                }
              >
                {activePreviewLabel}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <FormatFilter
            description="Choose which formats the preview switch rotates through."
            onToggle={onTogglePreviewFilter}
            options={previewOptions}
            selected={previewFilter}
            title="Preview"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 px-0 text-center text-[0.68rem] font-medium tracking-[0.04em] text-foreground/36">
        {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
          <div key={`${label}-${index}`}>{label}</div>
        ))}
      </div>
    </div>
  )
}
