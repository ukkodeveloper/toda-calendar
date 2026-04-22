"use client"

import * as React from "react"
import { startTransition, useEffectEvent } from "react"

import {
  buildMonthSection,
  createInitialMonthRange,
  estimateMonthSectionHeight,
  expandMonthRange,
  getMonthRenderWindow,
  monthKey,
  startOfMonth,
  toIsoDate,
} from "../utils/date"
import type { MonthSection } from "../model/types"

const INITIAL_MONTHS_BEFORE = 2
const INITIAL_MONTHS_AFTER = 5
const CHUNK_SIZE = 4
const EXPANSION_MARGIN = 1
const MONTH_TOP_OFFSET = 84
const ACTIVE_MONTH_OFFSET = 120
const WINDOW_MONTHS_BEFORE = 2
const WINDOW_MONTHS_AFTER = 4
const DEFAULT_VIEWPORT_WIDTH = 393

export function useMonthRange(anchorDate = new Date()) {
  const anchorDateRef = React.useRef(anchorDate)
  const sectionRefs = React.useRef(new Map<string, HTMLElement>())
  const sectionCacheRef = React.useRef(new Map<string, MonthSection>())
  const pendingPrependOffsetRef = React.useRef(0)
  const frameRef = React.useRef<number | null>(null)
  const hasInitialScrollRef = React.useRef(false)
  const resolvedAnchorDate = anchorDateRef.current
  const currentMonthKey = monthKey(resolvedAnchorDate)
  const todayKey = toIsoDate(resolvedAnchorDate)
  const [monthStarts, setMonthStarts] = React.useState(() =>
    createInitialMonthRange(
      startOfMonth(resolvedAnchorDate),
      INITIAL_MONTHS_BEFORE,
      INITIAL_MONTHS_AFTER
    )
  )
  const [activeMonthKey, setActiveMonthKey] = React.useState(currentMonthKey)
  const [viewportWidth, setViewportWidth] = React.useState(() =>
    typeof window === "undefined"
      ? DEFAULT_VIEWPORT_WIDTH
      : (window.visualViewport?.width ?? window.innerWidth)
  )
  const activeMonthIndex = React.useMemo(() => {
    const resolvedIndex = monthStarts.indexOf(activeMonthKey)

    if (resolvedIndex >= 0) {
      return resolvedIndex
    }

    const currentMonthIndex = monthStarts.indexOf(currentMonthKey)
    return currentMonthIndex >= 0 ? currentMonthIndex : 0
  }, [activeMonthKey, currentMonthKey, monthStarts])
  const renderWindow = React.useMemo(
    () =>
      getMonthRenderWindow(
        monthStarts,
        monthStarts[activeMonthIndex] ?? currentMonthKey,
        WINDOW_MONTHS_BEFORE,
        WINDOW_MONTHS_AFTER
      ),
    [activeMonthIndex, currentMonthKey, monthStarts]
  )
  const visibleMonthStarts = React.useMemo(
    () =>
      monthStarts.slice(renderWindow.startIndex, Math.max(renderWindow.endIndex + 1, 0)),
    [monthStarts, renderWindow.endIndex, renderWindow.startIndex]
  )

  React.useEffect(() => {
    sectionCacheRef.current.clear()
  }, [todayKey])

  const getMonthSection = React.useCallback(
    (monthStart: string) => {
      const cachedSection = sectionCacheRef.current.get(monthStart)

      if (cachedSection) {
        return cachedSection
      }

      const nextSection = buildMonthSection(monthStart, todayKey)
      sectionCacheRef.current.set(monthStart, nextSection)

      return nextSection
    },
    [todayKey]
  )

  const sections = React.useMemo(
    () => visibleMonthStarts.map((monthStart) => getMonthSection(monthStart)),
    [getMonthSection, visibleMonthStarts]
  )
  const prefixHeights = React.useMemo(() => {
    const nextPrefixHeights = [0]

    for (const monthStart of monthStarts) {
      const section = getMonthSection(monthStart)
      const previousHeight =
        nextPrefixHeights[nextPrefixHeights.length - 1] ?? 0

      nextPrefixHeights.push(
        previousHeight +
          estimateMonthSectionHeight(section.weeks.length, viewportWidth)
      )
    }

    return nextPrefixHeights
  }, [getMonthSection, monthStarts, viewportWidth])
  const topSpacerHeight = prefixHeights[renderWindow.startIndex] ?? 0
  const totalHeight = prefixHeights[prefixHeights.length - 1] ?? 0
  const renderedHeight =
    (prefixHeights[renderWindow.endIndex + 1] ?? totalHeight) - topSpacerHeight
  const bottomSpacerHeight = Math.max(totalHeight - topSpacerHeight - renderedHeight, 0)

  React.useLayoutEffect(() => {
    if (!pendingPrependOffsetRef.current || typeof window === "undefined") {
      return
    }

    window.scrollBy(0, pendingPrependOffsetRef.current)
    pendingPrependOffsetRef.current = 0
  }, [monthStarts, renderWindow.startIndex])

  React.useLayoutEffect(() => {
    if (hasInitialScrollRef.current) {
      return
    }

    const currentMonthSection = sectionRefs.current.get(currentMonthKey)

    if (!currentMonthSection || typeof window === "undefined") {
      return
    }

    window.scrollTo({
      top: Math.max(currentMonthSection.offsetTop - MONTH_TOP_OFFSET, 0),
      behavior: "auto",
    })
    setActiveMonthKey(currentMonthKey)
    hasInitialScrollRef.current = true
  }, [currentMonthKey, monthStarts])

  const prependMonths = useEffectEvent(() => {
    startTransition(() => {
      setMonthStarts((current) => {
        if (!current[0]) {
          return current
        }

        const nextMonthStarts = expandMonthRange(current, "past", CHUNK_SIZE)
        const prependedMonthStarts = nextMonthStarts.slice(
          0,
          nextMonthStarts.length - current.length
        )

        pendingPrependOffsetRef.current += prependedMonthStarts.reduce((total, monthStart) => {
          const section = getMonthSection(monthStart)

          return (
            total +
            estimateMonthSectionHeight(section.weeks.length, viewportWidth)
          )
        }, 0)

        return nextMonthStarts
      })
    })
  })

  const appendMonths = useEffectEvent(() => {
    startTransition(() => {
      setMonthStarts((current) => expandMonthRange(current, "future", CHUNK_SIZE))
    })
  })

  const syncActiveMonth = useEffectEvent(() => {
    if (!visibleMonthStarts.length || typeof window === "undefined") {
      return
    }

    const threshold = window.scrollY + ACTIVE_MONTH_OFFSET
    let nextActiveMonth = visibleMonthStarts[0] ?? currentMonthKey

    for (const monthStart of visibleMonthStarts) {
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

  const registerSection = React.useCallback((key: string, node: HTMLElement | null) => {
    if (node) {
      sectionRefs.current.set(key, node)
      return
    }

    sectionRefs.current.delete(key)
  }, [])

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

  React.useEffect(() => {
    if (activeMonthIndex <= EXPANSION_MARGIN) {
      prependMonths()
      return
    }

    if (monthStarts.length - activeMonthIndex - 1 <= EXPANSION_MARGIN) {
      appendMonths()
    }
  }, [activeMonthIndex, monthStarts.length])

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
  }, [visibleMonthStarts])

  const activeMonthLabel =
    getMonthSection(monthStarts[activeMonthIndex] ?? currentMonthKey).monthLabel

  return {
    activeMonthLabel,
    bottomSpacerHeight,
    registerSection,
    sections,
    scrollToCurrentMonth: () => scrollToMonth(currentMonthKey, "smooth"),
    topSpacerHeight,
  }
}
