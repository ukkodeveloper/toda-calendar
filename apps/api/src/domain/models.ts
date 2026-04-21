export const monthLayers = ["PHOTO", "TEXT", "DOODLE"] as const

export type MonthLayer = (typeof monthLayers)[number]
export type SlotType = MonthLayer

export type UserProfile = {
  id: string
  displayName: string | null
  timezone: string
  locale: string
  defaultCalendarId: string
}

export type CalendarSummary = {
  id: string
  ownerUserId: string
  name: string
  slug: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type PhotoSlot = {
  type: "PHOTO"
  assetUrl: string
  alt: string | null
}

export type TextSlot = {
  type: "TEXT"
  title: string | null
  body: string | null
}

export type DoodlePoint = {
  t?: number
  x: number
  y: number
}

export type DoodleStroke = {
  color: string
  width: number
  points: DoodlePoint[]
}

export type DoodleSlot = {
  type: "DOODLE"
  strokes: DoodleStroke[]
}

export type DayRecordSlot = PhotoSlot | TextSlot | DoodleSlot

export type DayRecord = {
  id: string
  calendarId: string
  ownerUserId: string
  localDate: string
  timezone: string
  createdAt: string
  updatedAt: string
  slots: DayRecordSlot[]
}

export type MonthCellPreview =
  | {
      type: "PHOTO"
      assetUrl: string
      alt: string | null
    }
  | {
      type: "TEXT"
      title: string | null
      body: string | null
    }
  | {
      type: "DOODLE"
      strokeCount: number
    }

export const slotOrder: Record<SlotType, number> = {
  PHOTO: 0,
  TEXT: 1,
  DOODLE: 2,
}
