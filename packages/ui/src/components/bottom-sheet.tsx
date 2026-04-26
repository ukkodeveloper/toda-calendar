"use client"

import * as React from "react"
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion"
import { createPortal } from "react-dom"

import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

type BottomSheetProps = {
  children: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  leadingAccessory?: React.ReactNode
  onOpenChange: (open: boolean) => void
  open: boolean
  trailingAccessory?: React.ReactNode
  title?: React.ReactNode
  className?: string
  contentClassName?: string
  scrollable?: boolean
}

function BottomSheet({
  children,
  className,
  contentClassName,
  description,
  footer,
  leadingAccessory,
  onOpenChange,
  open,
  scrollable = true,
  trailingAccessory,
  title,
}: BottomSheetProps) {
  const [mounted, setMounted] = React.useState(false)
  const reducedMotion = useReducedMotion()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  function handleDragEnd(
    _: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo
  ) {
    if (
      info.offset.y > motionTokens.gesture.sheetDismissOffset ||
      info.velocity.y > motionTokens.gesture.sheetDismissVelocity
    ) {
      onOpenChange(false)
    }
  }

  if (!mounted) {
    return null
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center overscroll-contain">
          <motion.button
            type="button"
            aria-label="Close sheet"
            className="absolute inset-0 bg-[color:var(--sheet-backdrop)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reducedMotion
                ? motionTokens.duration.instant
                : motionTokens.duration.quick,
              ease: motionTokens.ease.fade,
            }}
            onClick={() => onOpenChange(false)}
          />
          <motion.section
            aria-modal="true"
            role="dialog"
            drag="y"
            dragDirectionLock
            dragElastic={0.12}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className={cn(
              "relative z-10 flex max-h-[82dvh] w-full max-w-[34rem] flex-col overflow-hidden overscroll-contain rounded-t-[28px] border border-black/6 bg-[var(--surface-panel)] text-foreground shadow-[0_-18px_52px_rgba(15,23,42,0.16)] backdrop-blur-2xl",
              className
            )}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={
              reducedMotion
                ? { duration: motionTokens.duration.instant }
                : motionTokens.spring.sheet
            }
          >
            <div className="flex justify-center pt-2.5">
              <div className="h-1.5 w-10 rounded-full bg-foreground/14" />
            </div>
            {title || description || leadingAccessory || trailingAccessory ? (
              <header className="px-4 pt-2 pb-3 sm:px-5">
                <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
                  <div className="min-h-9 min-w-[3rem]">{leadingAccessory}</div>
                  <div className="min-w-0 pt-1 text-center">
                    {title ? (
                      <h2 className="truncate text-[1.05rem] font-semibold">
                        {title}
                      </h2>
                    ) : null}
                    {description ? (
                      <p className="mt-1 text-[0.78rem] leading-5 text-foreground/58">
                        {description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex min-h-9 min-w-[3rem] justify-end">
                    {trailingAccessory}
                  </div>
                </div>
              </header>
            ) : null}
            <div
              className={cn(
                "min-h-0 flex-1 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5",
                scrollable ? "overflow-y-auto" : "overflow-hidden",
                contentClassName
              )}
            >
              {children}
            </div>
            {footer ? (
              <footer className="border-t border-black/5 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
                {footer}
              </footer>
            ) : null}
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}

export { BottomSheet }
