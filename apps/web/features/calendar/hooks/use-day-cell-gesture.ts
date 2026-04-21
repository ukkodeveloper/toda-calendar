"use client"

import * as React from "react"

import { motionTokens } from "@workspace/ui/lib/motion"

type UseDayCellGestureProps = {
  onDoubleTap: () => void
  onSingleTap: () => void
}

export function useDayCellGesture({
  onDoubleTap,
  onSingleTap,
}: UseDayCellGestureProps) {
  const timeoutRef = React.useRef<number | null>(null)
  const lastTapRef = React.useRef(0)

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  function onPointerUp() {
    const now = Date.now()

    if (now - lastTapRef.current <= motionTokens.gesture.doubleTapMs) {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = null
      lastTapRef.current = 0
      onDoubleTap()
      return
    }

    lastTapRef.current = now
    timeoutRef.current = window.setTimeout(() => {
      onSingleTap()
      timeoutRef.current = null
      lastTapRef.current = 0
    }, motionTokens.gesture.doubleTapMs)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    onSingleTap()
  }

  return {
    onPointerUp,
    onKeyDown,
  }
}
