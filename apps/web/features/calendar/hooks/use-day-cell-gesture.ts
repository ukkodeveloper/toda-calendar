"use client"

import * as React from "react"

import { exceedsTapSlop, isActivationKey } from "../utils/interactions"

type UseDayCellGestureProps = {
  onPress: () => void
}

export function useDayCellGesture({
  onPress,
}: UseDayCellGestureProps) {
  const pointerRef = React.useRef<{
    id: number
    moved: boolean
    startX: number
    startY: number
  } | null>(null)

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

    onPress()
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
