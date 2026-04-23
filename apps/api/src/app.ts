import { randomUUID } from "node:crypto"

import Fastify from "fastify"

import { AuthContextService } from "./application/services/auth-context-service.js"
import { CalendarService } from "./application/services/calendar-service.js"
import { loadApiEnv, type ApiEnv } from "./config/env.js"
import type { AuthenticatedUser } from "./domain/authenticated-user.js"
import { AppError } from "./domain/errors.js"
import { createAccessTokenVerifier } from "./infrastructure/auth/create-access-token-verifier.js"
import { FileAuthRepository } from "./infrastructure/persistence/file-auth-repository.js"
import { registerRoutes } from "./http/routes.js"
import { FileCalendarRepository } from "./infrastructure/persistence/file-calendar-repository.js"
import { JsonFileStore } from "./infrastructure/persistence/file-store.js"

export type BuildApiAppOptions = {
  allowPublicAccess?: boolean
  env?: Partial<ApiEnv>
  logger?: boolean
}

export async function buildApiApp(options: BuildApiAppOptions = {}) {
  const env = loadApiEnv(options.env)
  const store = new JsonFileStore(env.dataFilePath)
  const authRepository = new FileAuthRepository(store)
  const repository = new FileCalendarRepository(store)
  const accessTokenVerifier = createAccessTokenVerifier(env)
  const authContextService = new AuthContextService(accessTokenVerifier, authRepository, {
    clock: () => new Date().toISOString(),
    defaultCalendarName: env.defaultCalendarName,
    defaultLocale: env.defaultLocale,
    defaultTimezone: env.defaultTimezone,
    idGenerator: () => randomUUID(),
  })
  const service = new CalendarService(repository, {
    clock: () => new Date().toISOString(),
    idGenerator: () => randomUUID(),
  })
  const app = Fastify({
    bodyLimit: 20 * 1024 * 1024,
    logger: options.logger ?? true,
  })

  app.decorateRequest("authenticatedUser", null as unknown as AuthenticatedUser)

  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin

    reply.header("Access-Control-Allow-Origin", origin ?? "*")
    reply.header("Access-Control-Allow-Headers", env.corsAllowedHeaders)
    reply.header("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS")
    reply.header("Vary", "Origin")

    if (request.method === "OPTIONS") {
      return reply.status(204).send()
    }
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

  await registerRoutes(app, authContextService, service, {
    allowPublicFallbackAuth: options.allowPublicAccess ?? env.authMode === "mock",
  })

  return {
    app,
    env,
  }
}
