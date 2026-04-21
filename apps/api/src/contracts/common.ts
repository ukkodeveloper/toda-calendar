import { z } from "zod"

import { isValidLocalDate, isValidMonthKey } from "../domain/local-date.js"

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
