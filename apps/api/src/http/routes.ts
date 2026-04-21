import type { FastifyInstance } from "fastify"
import { z } from "zod"

import { CalendarService } from "../application/services/calendar-service.js"
import {
  getDayRecordResponseSchema,
  getMonthViewQuerySchema,
  getMonthViewResponseSchema,
  listCalendarsResponseSchema,
  meResponseSchema,
  patchDayRecordBodySchema,
} from "../contracts/calendar.js"
import { localDateSchema } from "../contracts/common.js"
import { InputValidationError } from "../domain/errors.js"

const calendarParamsSchema = z.object({
  calendarId: z.string().uuid(),
})

const dayRecordParamsSchema = calendarParamsSchema.extend({
  localDate: localDateSchema,
})

export async function registerRoutes(
  app: FastifyInstance,
  service: CalendarService
) {
  app.get("/health", async () => ({
    status: "ok",
  }))

  app.get("/v1/me", async () =>
    validateResponse(meResponseSchema, await service.getMe())
  )

  app.get("/v1/calendars", async () =>
    validateResponse(listCalendarsResponseSchema, await service.listCalendars())
  )

  app.get("/v1/calendars/:calendarId/month-view", async (request) => {
    const params = parseOrThrow(calendarParamsSchema, request.params)
    const query = parseOrThrow(getMonthViewQuerySchema, request.query)

    return validateResponse(
      getMonthViewResponseSchema,
      await service.getMonthView({
        calendarId: params.calendarId,
        layer: query.layer ?? "PHOTO",
        month: query.month,
      })
    )
  })

  app.get("/v1/calendars/:calendarId/day-records/:localDate", async (request) => {
    const params = parseOrThrow(dayRecordParamsSchema, request.params)

    return validateResponse(
      getDayRecordResponseSchema,
      await service.getDayRecord({
        calendarId: params.calendarId,
        localDate: params.localDate,
      })
    )
  })

  app.patch("/v1/calendars/:calendarId/day-records/:localDate", async (request) => {
    const params = parseOrThrow(dayRecordParamsSchema, request.params)
    const body = parseOrThrow(patchDayRecordBodySchema, request.body)

    return validateResponse(
      getDayRecordResponseSchema,
      await service.patchDayRecord({
        calendarId: params.calendarId,
        localDate: params.localDate,
        patch: body,
      })
    )
  })
}

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input)

  if (!result.success) {
    throw new InputValidationError("Request validation failed", {
      fieldErrors: result.error.flatten().fieldErrors,
      formErrors: result.error.flatten().formErrors,
    })
  }

  return result.data
}

function validateResponse<T>(schema: z.ZodType<T>, output: unknown): T {
  const result = schema.safeParse(output)

  if (!result.success) {
    throw new Error(`Response contract validation failed: ${result.error.message}`)
  }

  return result.data
}
