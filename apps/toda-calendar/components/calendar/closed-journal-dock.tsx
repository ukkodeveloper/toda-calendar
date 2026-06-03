"use client"

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "framer-motion"
import * as React from "react"

import { motionTokens } from "@workspace/ui/lib/motion"

import {
  dockDetents,
  floatingSheetUi,
} from "@/features/calendar/utils/sheet-detents"
import { calendarInteractionUi } from "@/features/calendar/utils/interactions"

type ClosedJournalDockProps = {
  onOpenToday: (lift?: number) => void
  prompt: string
}

export function ClosedJournalDock({
  onOpenToday,
  prompt,
}: ClosedJournalDockProps) {
  const reducedMotion = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [viewportWidth, setViewportWidth] = React.useState(393)
  const sideInset = useTransform(
    y,
    [-dockDetents.gestureRange, 0],
    [dockDetents.liftedInset, dockDetents.restInset],
    { clamp: true }
  )
  const bottomInset = useTransform(
    y,
    [-dockDetents.gestureRange, 0],
    [dockDetents.liftedBottom, 0],
    { clamp: true }
  )
  const radius = useTransform(
    y,
    [-dockDetents.gestureRange, 0],
    [dockDetents.liftedRadius, 0],
    { clamp: true }
  )
  const scale = useTransform(
    y,
    [-dockDetents.gestureRange, 0],
    [dockDetents.liftedScale, dockDetents.restScale],
    { clamp: true }
  )
  const dockHeight = useTransform(
    y,
    [-dockDetents.gestureRange, 0],
    [dockDetents.liftedHeight, dockDetents.restHeight],
    { clamp: true }
  )
  const promptOpacity = useTransform(
    y,
    [-dockDetents.gestureRange, 0],
    [1, 0.92],
    { clamp: true }
  )

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const syncViewport = () => {
      setViewportWidth(window.visualViewport?.width ?? window.innerWidth)
    }

    syncViewport()
    window.addEventListener("resize", syncViewport)
    window.visualViewport?.addEventListener("resize", syncViewport)

    return () => {
      window.removeEventListener("resize", syncViewport)
      window.visualViewport?.removeEventListener("resize", syncViewport)
    }
  }, [])

  function settle() {
    animate(
      x,
      0,
      reducedMotion
        ? { duration: motionTokens.duration.instant }
        : motionTokens.intent.dragFollow
    )
    animate(
      y,
      0,
      reducedMotion
        ? { duration: motionTokens.duration.instant }
        : motionTokens.spring.drag
    )
  }

  function handleDragEnd(
    _: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo
  ) {
    if (info.offset.y < -42 || info.velocity.y < -480) {
      onOpenToday(Math.min(dockDetents.gestureRange, Math.max(0, -info.offset.y)))
      settle()
      return
    }

    settle()
  }

  return (
    <motion.div
      drag
      dragConstraints={{
        top: -Math.max(180, dockDetents.gestureRange * 2),
        right: Math.max(72, viewportWidth * 0.48),
        bottom: 40,
        left: -Math.max(72, viewportWidth * 0.48),
      }}
      dragElastic={0.14}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      className="pointer-events-auto fixed z-40 overflow-hidden text-foreground shadow-[var(--calendar-sheet-shadow)] backdrop-blur-[28px] backdrop-saturate-[1.35]"
      style={{
        x,
        left: sideInset,
        right: sideInset,
        bottom: bottomInset,
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
        borderBottomLeftRadius: radius,
        borderBottomRightRadius: radius,
        height: dockHeight,
        scale,
        y,
        backgroundColor: "var(--calendar-sheet-surface)",
        boxShadow: "var(--calendar-sheet-shadow), var(--calendar-sheet-inner-shadow)",
        touchAction: "none",
        overscrollBehavior: "none",
      }}
      initial={reducedMotion ? { opacity: 1 } : { y: 18, opacity: 0 }}
      animate={reducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
      transition={
        reducedMotion
          ? { duration: motionTokens.duration.instant }
          : {
              duration: motionTokens.duration.quick,
              ease: motionTokens.ease.enter,
            }
      }
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[var(--calendar-sheet-surface)]" />
        <div className="absolute inset-0 bg-[image:var(--calendar-sheet-glass-overlay)]" />
        <div className="absolute inset-0 bg-[image:var(--calendar-sheet-top-sheen)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[var(--calendar-sheet-edge-highlight)]" />
      </div>

      <div className="relative z-10 flex h-full flex-col px-[16px] pt-[8px] pb-[max(14px,env(safe-area-inset-bottom))]">
        <div
          aria-hidden="true"
          className="flex w-full items-center justify-center rounded-full"
          style={{
            height: floatingSheetUi.handleTouchHeight,
            WebkitTapHighlightColor: "transparent",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
        >
          <motion.span
            className="rounded-full"
            initial={false}
            animate={{
              width: floatingSheetUi.handleWidth,
              height: floatingSheetUi.handleHeight,
            }}
            style={{ backgroundColor: "var(--calendar-sheet-handle)" }}
          />
        </div>
        <motion.div
          style={{ opacity: promptOpacity }}
          className="mt-[8px] flex flex-1 items-center justify-center"
        >
          <button
            type="button"
            data-dock-action="open"
            className="min-w-0 max-w-[288px] rounded-full px-[14px] py-[8px] text-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--calendar-accent)]/30"
            style={{
              backgroundColor: "var(--calendar-sheet-pill)",
              minHeight: calendarInteractionUi.minTouchTarget,
            }}
            onPointerDown={(event) => {
              event.stopPropagation()
            }}
            onClick={() => onOpenToday(0)}
          >
            <div className="text-[15px] font-medium tracking-[-0.38px] text-foreground/74">
              {prompt}
            </div>
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}
