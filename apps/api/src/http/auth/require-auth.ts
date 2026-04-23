import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify"

import { AuthContextService } from "../../application/services/auth-context-service.js"
import type { AuthenticatedUser } from "../../domain/authenticated-user.js"
import { AuthRequiredError } from "../../domain/auth-errors.js"
import { getBearerToken } from "./get-bearer-token.js"

const DEVELOPMENT_FALLBACK_ACCESS_TOKEN = "dev:web-local-user:web@example.com"

type RequireAuthOptions = {
  allowDevelopmentFallbackAuth?: boolean
}

declare module "fastify" {
  interface FastifyRequest {
    authenticatedUser: AuthenticatedUser
  }
}

export function createRequireAuth(
  authContextService: AuthContextService,
  options: RequireAuthOptions = {}
): preHandlerHookHandler {
  return async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    void reply
    const accessToken =
      getBearerToken(request.headers.authorization) ??
      resolveDevelopmentFallbackAccessToken(request, options)

    if (!accessToken) {
      throw new AuthRequiredError()
    }

    request.authenticatedUser = await authContextService.authenticate(accessToken)
  }
}

function resolveDevelopmentFallbackAccessToken(
  request: FastifyRequest,
  options: RequireAuthOptions
) {
  if (!options.allowDevelopmentFallbackAuth) {
    return null
  }

  if (!isLoopbackHostname(request.hostname)) {
    return null
  }

  const origin = request.headers.origin

  if (origin && !isLoopbackOrigin(origin)) {
    return null
  }

  return DEVELOPMENT_FALLBACK_ACCESS_TOKEN
}

function isLoopbackOrigin(origin: string | string[]) {
  const value = Array.isArray(origin) ? origin[0] : origin

  if (!value) {
    return false
  }

  try {
    return isLoopbackHostname(new URL(value).hostname)
  } catch {
    return false
  }
}

function isLoopbackHostname(hostname: string) {
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1"
}
