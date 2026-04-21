"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { IconButton } from "@workspace/ui/components/icon-button"
import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

export type FormatFilterOption<T extends string> = {
  value: T
  label: string
  description?: string
}

type FormatFilterProps<T extends string> = {
  options: Array<FormatFilterOption<T>>
  selected: Record<T, boolean>
  title?: string
  description?: string
  onToggle: (value: T) => void
  className?: string
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.05rem]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16" strokeLinecap="round" />
      <path d="M7 12h10" strokeLinecap="round" />
      <path d="M10 17h4" strokeLinecap="round" />
    </svg>
  )
}

function FormatFilter<T extends string>({
  className,
  description,
  onToggle,
  options,
  selected,
  title = "Preview filter",
}: FormatFilterProps<T>) {
  const [open, setOpen] = React.useState(false)
  const reducedMotion = useReducedMotion()
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <IconButton
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Open preview filter"
        size="sm"
        onClick={() => setOpen((current) => !current)}
      >
        <FilterIcon />
      </IconButton>
      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-label={title}
            className="absolute top-11 right-0 z-30 w-[min(12rem,calc(100vw-1.5rem))] rounded-[20px] border border-black/6 bg-[var(--surface-panel)] p-1.5 text-left shadow-[0_18px_38px_rgba(15,23,42,0.14)] backdrop-blur-2xl"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{
              duration: reducedMotion
                ? motionTokens.duration.instant
                : motionTokens.duration.quick,
              ease: motionTokens.ease.enter,
            }}
          >
            <div className="px-2.5 pt-2 pb-1.5">
              <p className="text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-foreground/46">
                {title}
              </p>
              {description ? (
                <p className="mt-1 text-[0.72rem] leading-4 text-foreground/54">{description}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected[option.value]}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[16px] px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45",
                    selected[option.value]
                      ? "bg-white/88 text-foreground"
                      : "bg-transparent text-foreground/66"
                  )}
                  onClick={() => onToggle(option.value)}
                >
                  <span className="text-[0.92rem] font-medium tracking-[-0.02em]">
                    {option.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-flex size-5 items-center justify-center rounded-full border text-[0.65rem]",
                      selected[option.value]
                        ? "border-foreground/10 bg-foreground text-background"
                        : "border-foreground/10 bg-transparent text-transparent"
                    )}
                  >
                    ✓
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export { FormatFilter }
