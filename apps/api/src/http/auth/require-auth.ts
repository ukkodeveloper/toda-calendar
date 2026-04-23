import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify"

import { AuthContextService } from "../../application/services/auth-context-service.js"
import type { AuthenticatedUser } from "../../domain/authenticated-user.js"
import { AuthRequiredError } from "../../domain/auth-errors.js"
import { getBearerToken } from "./get-bearer-token.js"

const PUBLIC_MOCK_ACCESS_TOKEN = "dev:public-calendar:public@toda.local"

type RequireAuthOptions = {
  allowPublicFallbackAuth?: boolean
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
      resolvePublicFallbackAccessToken(options)

    if (!accessToken) {
      throw new AuthRequiredError()
    }

    request.authenticatedUser = await authContextService.authenticate(accessToken)
  }
}

function resolvePublicFallbackAccessToken(options: RequireAuthOptions) {
  if (!options.allowPublicFallbackAuth) {
    return null
  }

  return PUBLIC_MOCK_ACCESS_TOKEN
}
