import { randomUUID } from "node:crypto"

import Fastify from "fastify"

import { CalendarService } from "./application/services/calendar-service.js"
import { loadApiEnv, type ApiEnv } from "./config/env.js"
import { AppError } from "./domain/errors.js"
import { registerRoutes } from "./http/routes.js"
import { FileCalendarRepository } from "./infrastructure/persistence/file-calendar-repository.js"
import { JsonFileStore } from "./infrastructure/persistence/file-store.js"

export type BuildApiAppOptions = {
  env?: Partial<ApiEnv>
  logger?: boolean
}

export async function buildApiApp(options: BuildApiAppOptions = {}) {
  const env = loadApiEnv(options.env)
  const store = new JsonFileStore(env.dataFilePath)
  const repository = new FileCalendarRepository(store)
  const service = new CalendarService(repository, {
    clock: () => new Date().toISOString(),
    idGenerator: () => randomUUID(),
  })
  const app = Fastify({
    logger: options.logger ?? true,
  })

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          ...(error.details !== undefined ? { details: error.details } : {}),
          message: error.message,
        },
      })
    }

    app.log.error(error)

    return reply.status(500).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected server error",
      },
    })
  })

  await registerRoutes(app, service)

  return {
    app,
    env,
  }
}
