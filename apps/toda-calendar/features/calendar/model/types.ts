import { z } from "zod"

import { isValidIsoDate } from "../utils/date"

export const contentTypes = ["photo", "doodle", "text"] as const

export type ContentType = (typeof contentTypes)[number]

export type PreviewFilterState = Record<ContentType, boolean>

export type CalendarPhotoSlot = {
  type: "photo"
  assetId?: string
  src: string
  alt: string
  source: "seed" | "session"
}

export type DoodlePoint = {
  t?: number
  x: number
  y: number
}

export type CalendarDoodleStroke = {
  color: string
  width: number
  points: DoodlePoint[]
}

export type CalendarDoodleSlot = {
  type: "doodle"
  strokes: CalendarDoodleStroke[]
}

export type CalendarTextSlot = {
  type: "text"
  title?: string
  body: string
}

export type CalendarContentSlot =
  | CalendarPhotoSlot
  | CalendarDoodleSlot
  | CalendarTextSlot

export type CalendarDayRecord = {
  date: string
  currentPreviewType: ContentType
  photo?: CalendarPhotoSlot
  doodle?: CalendarDoodleSlot
  text?: CalendarTextSlot
}

export type EditorDraft = CalendarDayRecord

export type CalendarGridDay = {
  date: string
  dayNumber: number
  isCurrentMonth: boolean
  isPlaceholder: boolean
  isToday: boolean
}

export type MonthSection = {
  key: string
  monthStart: string
  monthLabel: string
  weeks: CalendarGridDay[][]
}

const doodlePointSchema = z.object({
  t: z.number().min(0).optional(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
})

const doodleStrokeSchema = z.object({
  color: z.string().min(1),
  width: z.number().min(1).max(12),
  points: z.array(doodlePointSchema).min(1),
})

export const photoSlotSchema = z.object({
  type: z.literal("photo"),
  assetId: z.string().min(1).optional(),
  src: z.string().min(1),
  alt: z.string().min(1),
  source: z.enum(["seed", "session"]).default("seed"),
})

export const doodleSlotSchema = z.object({
  type: z.literal("doodle"),
  strokes: z.array(doodleStrokeSchema),
})

export const textSlotSchema = z.object({
  type: z.literal("text"),
  title: z.string().trim().min(1).optional(),
  body: z.string().default(""),
})

export const calendarDayRecordSchema = z.object({
  date: z.string().refine(isValidIsoDate, "Invalid local date"),
  currentPreviewType: z.enum(contentTypes),
  photo: photoSlotSchema.optional(),
  doodle: doodleSlotSchema.optional(),
  text: textSlotSchema.optional(),
})

export const calendarSeedSchema = z.object({
  records: z.array(calendarDayRecordSchema),
})

export type CalendarSeed = z.infer<typeof calendarSeedSchema>
