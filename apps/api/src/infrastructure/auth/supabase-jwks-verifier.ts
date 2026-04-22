import { createRemoteJWKSet, errors, jwtVerify } from "jose"

import type { AccessTokenVerifier } from "../../application/ports/access-token-verifier.js"
import { InvalidAccessTokenError } from "../../domain/auth-errors.js"

type SupabaseJwksVerifierOptions = {
  audience?: string
  issuer: string
  jwksUrl: string
}

export class SupabaseJwksVerifier implements AccessTokenVerifier {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>

  constructor(private readonly options: SupabaseJwksVerifierOptions) {
    this.jwks = createRemoteJWKSet(new URL(options.jwksUrl))
  }

  async verify(accessToken: string) {
    try {
      const { payload } = await jwtVerify(accessToken, this.jwks, {
        audience: this.options.audience,
        issuer: this.options.issuer,
      })
      const subject = payload.sub

      if (!subject) {
        throw new InvalidAccessTokenError("Access token subject is missing")
      }

      return {
        email: typeof payload.email === "string" ? payload.email : null,
        source: "SUPABASE" as const,
        subject,
      }
    } catch (error) {
      if (error instanceof InvalidAccessTokenError) {
        throw error
      }

      if (
        error instanceof errors.JOSEError ||
        error instanceof TypeError ||
        error instanceof Error
      ) {
        throw new InvalidAccessTokenError("Access token verification failed", {
          cause: error.message,
        })
      }

      throw new InvalidAccessTokenError("Access token verification failed")
    }
  }
}
