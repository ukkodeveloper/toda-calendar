import type { AccessTokenVerifier } from "../../application/ports/access-token-verifier.js"
import type { ApiEnv } from "../../config/env.js"
import { MockAccessTokenVerifier } from "./mock-access-token-verifier.js"
import { SupabaseJwksVerifier } from "./supabase-jwks-verifier.js"

export function createAccessTokenVerifier(env: ApiEnv): AccessTokenVerifier {
  if (env.authMode === "mock") {
    return new MockAccessTokenVerifier()
  }

  return new SupabaseJwksVerifier({
    audience: env.supabaseJwtAudience,
    issuer: env.supabaseJwtIssuer!,
    jwksUrl: env.supabaseJwksUrl!,
  })
}
