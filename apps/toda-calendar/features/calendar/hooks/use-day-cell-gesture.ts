"use client"

import * as React from "react"

import { exceedsTapSlop, isActivationKey } from "../utils/interactions"

const DOUBLE_PRESS_DELAY_MS = 240

type UseDayCellGestureProps = {
  onDoublePress?: () => void
  onPress: () => void
}

export function useDayCellGesture({
  onDoublePress,
  onPress,
}: UseDayCellGestureProps) {
  const pointerRef = React.useRef<{
    id: number
    moved: boolean
    startX: number
    startY: number
  } | null>(null)
  const pressTimerRef = React.useRef<number | null>(null)
  const lastPressRef = React.useRef<{
    time: number
    x: number
    y: number
  } | null>(null)

  const clearPressTimer = React.useCallback(() => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }, [])

  React.useEffect(() => {
    return () => {
      clearPressTimer()
    }
  }, [clearPressTimer])

  function resetPointer() {
    pointerRef.current = null
  }

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (!event.isPrimary) {
      return
    }

    pointerRef.current = {
      id: event.pointerId,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    const current = pointerRef.current

    if (!current || current.id !== event.pointerId) {
      return
    }

    if (
      exceedsTapSlop(
        { x: current.startX, y: current.startY },
        { x: event.clientX, y: event.clientY }
      )
    ) {
      current.moved = true
    }
  }

  function onPointerUp(event: React.PointerEvent<HTMLElement>) {
    const current = pointerRef.current
    resetPointer()

    if (!current || current.id !== event.pointerId || current.moved) {
      return
    }

    if (!onDoublePress) {
      onPress()
      return
    }

    const now = Date.now()
    const point = {
      x: event.clientX,
      y: event.clientY,
    }
    const lastPress = lastPressRef.current

    if (
      lastPress &&
      now - lastPress.time <= DOUBLE_PRESS_DELAY_MS &&
      !exceedsTapSlop(
        { x: lastPress.x, y: lastPress.y },
        point,
        24
      )
    ) {
      clearPressTimer()
      lastPressRef.current = null
      onDoublePress()
      return
    }

    lastPressRef.current = {
      time: now,
      ...point,
    }

    clearPressTimer()
    pressTimerRef.current = window.setTimeout(() => {
      lastPressRef.current = null
      pressTimerRef.current = null
      onPress()
    }, DOUBLE_PRESS_DELAY_MS)
  }

  function onPointerCancel() {
    resetPointer()
  }

  function onPointerLeave(event: React.PointerEvent<HTMLElement>) {
    const current = pointerRef.current

    if (!current || current.id !== event.pointerId) {
      return
    }

    current.moved = true
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (!isActivationKey(event.key)) {
      return
    }

    clearPressTimer()
    lastPressRef.current = null
    event.preventDefault()
    onPress()
  }

  return {
    onKeyDown,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerMove,
    onPointerUp,
  }
}
