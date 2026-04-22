import { isValidLocalDate, isValidMonthKey } from "@workspace/app-core"
import { z } from "zod"

export const localDateSchema = z.string().refine(isValidLocalDate, {
  message: "Expected a valid local date in YYYY-MM-DD format",
})

export const monthKeySchema = z.string().refine(isValidMonthKey, {
  message: "Expected a valid month key in YYYY-MM format",
})

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    details: z.unknown().optional(),
    message: z.string(),
  }),
})

export type ApiErrorResponse = z.infer<typeof apiErrorSchema>
