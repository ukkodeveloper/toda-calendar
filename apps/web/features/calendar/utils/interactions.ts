export const calendarInteractionUi = {
  compactActionGap: 8,
  minTouchTarget: 44,
  tapSlop: 10,
} as const

type Point = {
  x: number
  y: number
}

export function exceedsTapSlop(
  start: Point,
  end: Point,
  slop = calendarInteractionUi.tapSlop
) {
  return Math.hypot(end.x - start.x, end.y - start.y) > slop
}

export function isActivationKey(key: string) {
  return key === "Enter" || key === " "
}
