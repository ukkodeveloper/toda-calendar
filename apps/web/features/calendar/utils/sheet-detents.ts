function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export const dockDetents = {
  gestureRange: 96,
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
  handleTouchHeight: 20,
  headerPaddingX: 14,
  headerPaddingTop: 8,
  headerPaddingBottom: 10,
  contentPaddingX: 14,
  contentPaddingBottom: 14,
  titleSize: 16,
  titleTracking: -0.4,
  actionSize: 13,
  actionHeight: 30,
  segmentHeight: 30,
  segmentRadius: 11,
  segmentContainerRadius: 15,
} as const

type FloatingSheetViewport = {
  bottomInset: number
  height: number
}

export function getFloatingSheetDetents({
  bottomInset,
  height,
}: FloatingSheetViewport) {
  const floatingBottom = Math.max(16, bottomInset + 16)
  const maxVisibleHeight = Math.max(320, height - floatingBottom - 12)
  const peekPreferred = clamp(height - floatingBottom - 136, 280, 352)
  const expandedPreferred = clamp(height - floatingBottom - 12, 440, 736)

  return {
    peek: {
      left: dockDetents.liftedInset,
      right: dockDetents.liftedInset,
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
      left: dockDetents.liftedInset,
      right: dockDetents.liftedInset,
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

export function getDockHandoffFrame(lift: number) {
  const progress = clamp(lift / dockDetents.gestureRange, 0, 1)

  return {
    left: dockDetents.liftedInset * progress,
    right: dockDetents.liftedInset * progress,
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
