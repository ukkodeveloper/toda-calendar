import type {
  AuthenticatedUser,
  VerifiedAccessTokenIdentity,
} from "../../domain/authenticated-user.js"

export type ResolveAuthenticatedUserInput = {
  authIdentityId: string
  identity: VerifiedAccessTokenIdentity
  newDefaultCalendar: {
    id: string
    name: string
    slug: string | null
  }
  newUser: {
    defaultCalendarId: string
    displayName: string | null
    id: string
    locale: string
    timezone: string
  }
  nowIso: string
}

export interface AuthRepository {
  resolveAuthenticatedUser(
    input: ResolveAuthenticatedUserInput
  ): Promise<AuthenticatedUser>
}
