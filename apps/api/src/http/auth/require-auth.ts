import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify"

import { AuthContextService } from "../../application/services/auth-context-service.js"
import type { AuthenticatedUser } from "../../domain/authenticated-user.js"
import { AuthRequiredError } from "../../domain/auth-errors.js"
import { getBearerToken } from "./get-bearer-token.js"

declare module "fastify" {
  interface FastifyRequest {
    authenticatedUser: AuthenticatedUser
  }
}

export function createRequireAuth(
  authContextService: AuthContextService
): preHandlerHookHandler {
  return async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    void reply
    const accessToken = getBearerToken(request.headers.authorization)

    if (!accessToken) {
      throw new AuthRequiredError()
    }

    request.authenticatedUser = await authContextService.authenticate(accessToken)
  }
}
