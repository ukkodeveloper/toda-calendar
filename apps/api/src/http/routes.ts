import type { FastifyInstance } from "fastify"
import { z } from "zod"
import {
  getDayRecordResponseSchema,
  getMonthViewQuerySchema,
  getMonthViewResponseSchema,
  listCalendarsResponseSchema,
  listDayRecordsQuerySchema,
  listDayRecordsResponseSchema,
  localDateSchema,
  meResponseSchema,
  patchDayRecordBodySchema,
} from "@workspace/contracts"

import { AuthContextService } from "../application/services/auth-context-service.js"
import { CalendarService } from "../application/services/calendar-service.js"
import { InputValidationError } from "../domain/errors.js"
import { createRequireAuth } from "./auth/require-auth.js"

const calendarParamsSchema = z.object({
  calendarId: z.string().uuid(),
})

const dayRecordParamsSchema = calendarParamsSchema.extend({
  localDate: localDateSchema,
})

type CalendarParams = z.infer<typeof calendarParamsSchema>
type DayRecordParams = z.infer<typeof dayRecordParamsSchema>
type MonthViewQuery = z.infer<typeof getMonthViewQuerySchema>
type DayRecordsQuery = z.infer<typeof listDayRecordsQuerySchema>
type PatchDayRecordBody = z.infer<typeof patchDayRecordBodySchema>
type RegisterRoutesOptions = {
  allowPublicFallbackAuth?: boolean
}

export async function registerRoutes(
  app: FastifyInstance,
  authContextService: AuthContextService,
  service: CalendarService,
  options: RegisterRoutesOptions = {}
) {
  const requireAuth = createRequireAuth(authContextService, {
    allowPublicFallbackAuth: options.allowPublicFallbackAuth,
  })

  app.get("/health", async () => ({
    status: "ok",
  }))

  app.get("/v1/me", { preHandler: requireAuth }, async (request) =>
    validateResponse(
      meResponseSchema,
      await service.getMe(request.authenticatedUser.user)
    )
  )

  app.get("/v1/calendars", { preHandler: requireAuth }, async (request) =>
    validateResponse(
      listCalendarsResponseSchema,
      await service.listCalendars(request.authenticatedUser.user)
    )
  )

  app.get("/v1/calendars/:calendarId/month-view", { preHandler: requireAuth }, async (request) => {
    const params = parseOrThrow<CalendarParams>(calendarParamsSchema, request.params)
    const query = parseOrThrow<MonthViewQuery>(getMonthViewQuerySchema, request.query)

    return validateResponse(
      getMonthViewResponseSchema,
      await service.getMonthView({
        calendarId: params.calendarId,
        layer: query.layer ?? "PHOTO",
        month: query.month,
        user: request.authenticatedUser.user,
      })
    )
  })

  app.get("/v1/calendars/:calendarId/day-records", { preHandler: requireAuth }, async (request) => {
    const params = parseOrThrow<CalendarParams>(calendarParamsSchema, request.params)
    const query = parseOrThrow<DayRecordsQuery>(listDayRecordsQuerySchema, request.query)

    return validateResponse(
      listDayRecordsResponseSchema,
      await service.listDayRecords({
        calendarId: params.calendarId,
        month: query.month,
        user: request.authenticatedUser.user,
      })
    )
  })

  app.get(
    "/v1/calendars/:calendarId/day-records/:localDate",
    { preHandler: requireAuth },
    async (request) => {
      const params = parseOrThrow<DayRecordParams>(
        dayRecordParamsSchema,
        request.params
      )

      return validateResponse(
        getDayRecordResponseSchema,
        await service.getDayRecord({
          calendarId: params.calendarId,
          localDate: params.localDate,
          user: request.authenticatedUser.user,
        })
      )
    }
  )

  app.patch(
    "/v1/calendars/:calendarId/day-records/:localDate",
    { preHandler: requireAuth },
    async (request) => {
      const params = parseOrThrow<DayRecordParams>(
        dayRecordParamsSchema,
        request.params
      )
      const body = parseOrThrow<PatchDayRecordBody>(
        patchDayRecordBodySchema,
        request.body
      )

      return validateResponse(
        getDayRecordResponseSchema,
        await service.patchDayRecord({
          calendarId: params.calendarId,
          localDate: params.localDate,
          patch: body,
          user: request.authenticatedUser.user,
        })
      )
    }
  )
}

function parseOrThrow<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  input: unknown
): T {
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
