import type { AccessTokenVerifier } from "../../application/ports/access-token-verifier.js"
import { InvalidAccessTokenError } from "../../domain/auth-errors.js"

export class MockAccessTokenVerifier implements AccessTokenVerifier {
  async verify(accessToken: string) {
    const [prefix, subject, ...emailParts] = accessToken.split(":")

    if (prefix !== "dev" || !subject) {
      throw new InvalidAccessTokenError(
        "Mock access tokens must use the dev:<subject>[:email] format"
      )
    }

    return {
      email: emailParts.length > 0 ? emailParts.join(":") : null,
      source: "DEVELOPMENT" as const,
      subject,
    }
  }
}
