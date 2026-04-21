import { z } from "zod"

import { localDateSchema, monthKeySchema } from "./common.js"

const assetUrlSchema = z.string().trim().min(1).max(2048)
const nullableBodySchema = z.string().trim().min(1).max(4000).nullable()
const nullableTitleSchema = z.string().trim().min(1).max(120).nullable()
const nullableAltSchema = z.string().trim().min(1).max(200).nullable()

export const monthLayerSchema = z.enum(["PHOTO", "TEXT", "DOODLE"])

const doodlePointSchema = z.object({
  t: z.number().int().min(0).optional(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
})

const doodleStrokeSchema = z.object({
  color: z.string().trim().min(1).max(32),
  points: z.array(doodlePointSchema).min(1).max(500),
  width: z.number().min(1).max(12),
})

export const photoSlotSchema = z.object({
  alt: nullableAltSchema,
  assetUrl: assetUrlSchema,
  type: z.literal("PHOTO"),
})

export const textSlotSchema = z.object({
  body: nullableBodySchema,
  title: nullableTitleSchema,
  type: z.literal("TEXT"),
})

export const doodleSlotSchema = z.object({
  strokes: z.array(doodleStrokeSchema).min(1).max(400),
  type: z.literal("DOODLE"),
})

export const dayRecordSlotSchema = z.discriminatedUnion("type", [
  photoSlotSchema,
  textSlotSchema,
  doodleSlotSchema,
])

export const meResponseSchema = z.object({
  defaultCalendarId: z.string().uuid(),
  user: z.object({
    displayName: z.string().nullable(),
    id: z.string().uuid(),
    locale: z.string().min(1).max(20),
    timezone: z.string().min(1).max(100),
  }),
})

export const calendarSummarySchema = z.object({
  id: z.string().uuid(),
  isDefault: z.boolean(),
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(80).nullable(),
})

export const listCalendarsResponseSchema = z.object({
  calendars: z.array(calendarSummarySchema),
})

const monthViewPhotoPreviewSchema = z.object({
  alt: nullableAltSchema,
  assetUrl: assetUrlSchema,
  type: z.literal("PHOTO"),
})

const monthViewTextPreviewSchema = z.object({
  body: nullableBodySchema,
  title: nullableTitleSchema,
  type: z.literal("TEXT"),
})

const monthViewDoodlePreviewSchema = z.object({
  strokeCount: z.number().int().nonnegative(),
  type: z.literal("DOODLE"),
})

export const monthViewCellSchema = z.object({
  hasContent: z.boolean(),
  localDate: localDateSchema,
  preview: z
    .union([
      monthViewPhotoPreviewSchema,
      monthViewTextPreviewSchema,
      monthViewDoodlePreviewSchema,
    ])
    .nullable(),
})

export const getMonthViewQuerySchema = z.object({
  layer: monthLayerSchema.default("PHOTO"),
  month: monthKeySchema,
})

export const getMonthViewResponseSchema = z.object({
  cells: z.array(monthViewCellSchema),
  layer: monthLayerSchema,
  month: monthKeySchema,
})

export const dayRecordSchema = z.object({
  calendarId: z.string().uuid(),
  id: z.string().uuid().nullable(),
  localDate: localDateSchema,
  slots: z.array(dayRecordSlotSchema),
  timezone: z.string().min(1).max(100),
})

export const getDayRecordResponseSchema = z.object({
  dayRecord: dayRecordSchema,
})

const textPatchSchema = z
  .object({
    body: nullableBodySchema.optional(),
    title: nullableTitleSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one text field to update",
  })

const photoPatchSchema = z.object({
  alt: nullableAltSchema.optional(),
  assetUrl: assetUrlSchema,
})

const doodlePatchSchema = z.object({
  strokes: z.array(doodleStrokeSchema).min(1).max(400),
})

export const patchDayRecordBodySchema = z
  .object({
    doodle: doodlePatchSchema.nullable().optional(),
    photo: photoPatchSchema.nullable().optional(),
    text: textPatchSchema.nullable().optional(),
  })
  .refine(
    (value) =>
      value.photo !== undefined ||
      value.text !== undefined ||
      value.doodle !== undefined,
    {
      message: "Provide at least one slot mutation",
    }
  )

export type MonthLayer = z.infer<typeof monthLayerSchema>
export type PatchDayRecordBody = z.infer<typeof patchDayRecordBodySchema>
