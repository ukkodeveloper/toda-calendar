"use client"

import * as React from "react"
import { startTransition, useEffectEvent } from "react"

import {
  buildMonthSection,
  createInitialMonthRange,
  expandMonthRange,
  monthKey,
  startOfMonth,
  toIsoDate,
} from "../utils/date"

const INITIAL_MONTHS_BEFORE = 2
const INITIAL_MONTHS_AFTER = 5
const CHUNK_SIZE = 4
const MONTH_TOP_OFFSET = 110
const ACTIVE_MONTH_OFFSET = 146

export function useMonthRange(anchorDate = new Date()) {
  const topSentinelRef = React.useRef<HTMLDivElement | null>(null)
  const bottomSentinelRef = React.useRef<HTMLDivElement | null>(null)
  const sectionRefs = React.useRef(new Map<string, HTMLElement>())
  const previousScrollHeightRef = React.useRef<number | null>(null)
  const frameRef = React.useRef<number | null>(null)
  const hasInitialScrollRef = React.useRef(false)
  const currentMonthKey = monthKey(anchorDate)
  const [monthStarts, setMonthStarts] = React.useState(() =>
    createInitialMonthRange(
      startOfMonth(anchorDate),
      INITIAL_MONTHS_BEFORE,
      INITIAL_MONTHS_AFTER
    )
  )
  const [activeMonthKey, setActiveMonthKey] = React.useState(currentMonthKey)
  const todayKey = toIsoDate(anchorDate)
  const sections = React.useMemo(
    () => monthStarts.map((monthStart) => buildMonthSection(monthStart, todayKey)),
    [monthStarts, todayKey]
  )

  React.useLayoutEffect(() => {
    if (previousScrollHeightRef.current == null || typeof window === "undefined") {
      return
    }

    const nextHeight = document.documentElement.scrollHeight
    const diff = nextHeight - previousScrollHeightRef.current

    if (diff > 0) {
      window.scrollBy(0, diff)
    }

    previousScrollHeightRef.current = null
  }, [monthStarts])

  React.useLayoutEffect(() => {
    if (hasInitialScrollRef.current) {
      return
    }

    const todayCell =
      typeof document === "undefined"
        ? null
        : document.querySelector<HTMLElement>(`[data-calendar-date='${todayKey}']`)
    const currentMonthSection = sectionRefs.current.get(currentMonthKey)
    const initialTarget = todayCell ?? currentMonthSection

    if (!initialTarget || typeof window === "undefined") {
      return
    }

    window.scrollTo({
      top: Math.max(initialTarget.offsetTop - MONTH_TOP_OFFSET, 0),
      behavior: "auto",
    })
    setActiveMonthKey(currentMonthKey)
    hasInitialScrollRef.current = true
  }, [currentMonthKey, monthStarts, todayKey])

  const prependMonths = useEffectEvent(() => {
    if (typeof window === "undefined") {
      return
    }

    previousScrollHeightRef.current = document.documentElement.scrollHeight

    startTransition(() => {
      setMonthStarts((current) => expandMonthRange(current, "past", CHUNK_SIZE))
    })
  })

  const appendMonths = useEffectEvent(() => {
    startTransition(() => {
      setMonthStarts((current) => expandMonthRange(current, "future", CHUNK_SIZE))
    })
  })

  const syncActiveMonth = useEffectEvent(() => {
    if (!monthStarts.length || typeof window === "undefined") {
      return
    }

    const threshold = window.scrollY + ACTIVE_MONTH_OFFSET
    let nextActiveMonth = monthStarts[0] ?? currentMonthKey

    for (const monthStart of monthStarts) {
      const section = sectionRefs.current.get(monthStart)

      if (!section) {
        continue
      }

      if (section.offsetTop <= threshold) {
        nextActiveMonth = monthStart
        continue
      }

      break
    }

    setActiveMonthKey((current) => (current === nextActiveMonth ? current : nextActiveMonth))
  })

  function scrollToMonth(targetMonthKey: string, behavior: ScrollBehavior) {
    const targetSection = sectionRefs.current.get(targetMonthKey)

    if (!targetSection || typeof window === "undefined") {
      return
    }

    window.scrollTo({
      top: Math.max(targetSection.offsetTop - MONTH_TOP_OFFSET, 0),
      behavior,
    })
  }

  function registerSection(key: string, node: HTMLElement | null) {
    if (node) {
      sectionRefs.current.set(key, node)
      return
    }

    sectionRefs.current.delete(key)
  }

  React.useEffect(() => {
    if (!topSentinelRef.current || !bottomSentinelRef.current) {
      return
    }

    let pastLocked = false
    let futureLocked = false
    const releasePastLock = () => {
      pastLocked = false
    }
    const releaseFutureLock = () => {
      futureLocked = false
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return
          }

          if (entry.target === topSentinelRef.current && !pastLocked) {
            pastLocked = true
            prependMonths()
            window.setTimeout(releasePastLock, 160)
          }

          if (entry.target === bottomSentinelRef.current && !futureLocked) {
            futureLocked = true
            appendMonths()
            window.setTimeout(releaseFutureLock, 160)
          }
        })
      },
      {
        root: null,
        rootMargin: "640px 0px 640px 0px",
      }
    )

    observer.observe(topSentinelRef.current)
    observer.observe(bottomSentinelRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleScroll = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }

      frameRef.current = window.requestAnimationFrame(() => {
        syncActiveMonth()
        frameRef.current = null
      })
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [monthStarts.length])

  const activeMonthLabel =
    sections.find((section) => section.key === activeMonthKey)?.monthLabel ??
    sections[0]?.monthLabel ??
    ""

  return {
    topSentinelRef,
    bottomSentinelRef,
    sections,
    activeMonthLabel,
    registerSection,
    scrollToCurrentMonth: () => scrollToMonth(currentMonthKey, "smooth"),
  }
}
