import { calendarInteractionUi } from "./interactions"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export const dockDetents = {
  gestureRange: 96,
  restInset: -1,
  liftedInset: 10,
  liftedBottom: 16,
  liftedRadius: 30,
  restHeight: 84,
  liftedHeight: 116,
  restScale: 1,
  liftedScale: 1,
} as const

export const floatingSheetUi = {
  handleWidth: 40,
  handleHeight: 6,
  handleTouchHeight: calendarInteractionUi.minTouchTarget,
  headerPaddingX: 16,
  headerPaddingTop: 8,
  headerPaddingBottom: 12,
  contentPaddingX: 16,
  contentPaddingBottom: 16,
  titleSize: 16,
  titleTracking: -0.4,
  actionSize: 13,
  actionHeight: calendarInteractionUi.minTouchTarget,
  segmentHeight: calendarInteractionUi.minTouchTarget,
  segmentRadius: 11,
  segmentContainerRadius: 15,
} as const

type FloatingSheetViewport = {
  bottomInset: number
  height: number
  width: number
}

export function getFloatingSheetDetents({
  bottomInset,
  height,
  width,
}: FloatingSheetViewport) {
  const floatingBottom = Math.max(16, bottomInset + 16)
  const sideInset = clamp(Math.round(width * 0.028), 10, 18)
  const maxVisibleHeight = Math.max(320, height - floatingBottom - 12)
  const peekPreferred = clamp(height - floatingBottom - 126, 328, 396)
  const expandedPreferred = clamp(height - floatingBottom - 12, 440, 736)

  return {
    peek: {
      left: sideInset,
      right: sideInset,
      bottom: floatingBottom,
      borderTopLeftRadius: dockDetents.liftedRadius,
      borderTopRightRadius: dockDetents.liftedRadius,
      borderBottomLeftRadius: dockDetents.liftedRadius,
      borderBottomRightRadius: dockDetents.liftedRadius,
      height: Math.min(peekPreferred, maxVisibleHeight),
      opacity: 1,
      scale: 1,
    },
    expanded: {
      left: sideInset,
      right: sideInset,
      bottom: floatingBottom,
      borderTopLeftRadius: 34,
      borderTopRightRadius: 34,
      borderBottomLeftRadius: 34,
      borderBottomRightRadius: 34,
      height: Math.min(expandedPreferred, maxVisibleHeight),
      opacity: 1,
      scale: 1,
    },
  }
}

export function getDockHandoffFrame(lift: number, width = 393) {
  const progress = clamp(lift / dockDetents.gestureRange, 0, 1)
  const sideInset = clamp(Math.round(width * 0.028), 10, 18)

  return {
    left: dockDetents.restInset + (sideInset - dockDetents.restInset) * progress,
    right: dockDetents.restInset + (sideInset - dockDetents.restInset) * progress,
    bottom: dockDetents.liftedBottom * progress,
    borderTopLeftRadius: dockDetents.liftedRadius * progress,
    borderTopRightRadius: dockDetents.liftedRadius * progress,
    borderBottomLeftRadius: dockDetents.liftedRadius * progress,
    borderBottomRightRadius: dockDetents.liftedRadius * progress,
    height:
      dockDetents.restHeight +
      (dockDetents.liftedHeight - dockDetents.restHeight) * progress,
    scale:
      dockDetents.restScale +
      (dockDetents.liftedScale - dockDetents.restScale) * progress,
    opacity: 1,
  }
}
