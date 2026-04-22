import type { AccessTokenVerifier } from "../ports/access-token-verifier.js"
import type { AuthRepository } from "../ports/auth-repository.js"
import type { AuthenticatedUser } from "../../domain/authenticated-user.js"
import { AuthBootstrapError } from "../../domain/auth-errors.js"
import { AppError } from "../../domain/errors.js"

type AuthContextServiceDependencies = {
  clock: () => string
  defaultCalendarName: string
  defaultLocale: string
  defaultTimezone: string
  idGenerator: () => string
}

export class AuthContextService {
  constructor(
    private readonly accessTokenVerifier: AccessTokenVerifier,
    private readonly authRepository: AuthRepository,
    private readonly dependencies: AuthContextServiceDependencies
  ) {}

  async authenticate(accessToken: string): Promise<AuthenticatedUser> {
    const identity = await this.accessTokenVerifier.verify(accessToken)
    const nowIso = this.dependencies.clock()
    const userId = this.dependencies.idGenerator()
    const defaultCalendarId = this.dependencies.idGenerator()

    try {
      return await this.authRepository.resolveAuthenticatedUser({
        authIdentityId: this.dependencies.idGenerator(),
        identity,
        newDefaultCalendar: {
          id: defaultCalendarId,
          name: this.dependencies.defaultCalendarName,
          slug: toSlug(this.dependencies.defaultCalendarName),
        },
        newUser: {
          defaultCalendarId,
          displayName: null,
          id: userId,
          locale: this.dependencies.defaultLocale,
          timezone: this.dependencies.defaultTimezone,
        },
        nowIso,
      })
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      throw new AuthBootstrapError(undefined, {
        cause: error instanceof Error ? error.message : String(error),
        subject: identity.subject,
      })
    }
  }
}

function toSlug(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return slug.length > 0 ? slug : null
}
