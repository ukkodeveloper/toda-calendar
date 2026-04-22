import type {
  AuthRepository,
  ResolveAuthenticatedUserInput,
} from "../../application/ports/auth-repository.js"
import type { AuthenticatedUser } from "../../domain/authenticated-user.js"
import type { CalendarSummary } from "../../domain/models.js"
import { JsonFileStore } from "./file-store.js"

export class FileAuthRepository implements AuthRepository {
  constructor(private readonly store: JsonFileStore) {}

  async resolveAuthenticatedUser(
    input: ResolveAuthenticatedUserInput
  ): Promise<AuthenticatedUser> {
    return this.store.mutate((state) => {
      const identityIndex = state.authIdentities.findIndex(
        (identity) =>
          identity.source === input.identity.source &&
          identity.externalSubject === input.identity.subject
      )

      if (identityIndex === -1) {
        const calendar = {
          createdAt: input.nowIso,
          id: input.newDefaultCalendar.id,
          isDefault: true,
          name: input.newDefaultCalendar.name,
          ownerUserId: input.newUser.id,
          slug: input.newDefaultCalendar.slug,
          updatedAt: input.nowIso,
        }
        const user = {
          defaultCalendarId: calendar.id,
          displayName: input.newUser.displayName,
          id: input.newUser.id,
          locale: input.newUser.locale,
          timezone: input.newUser.timezone,
        }
        const identity = {
          createdAt: input.nowIso,
          email: input.identity.email,
          externalSubject: input.identity.subject,
          id: input.authIdentityId,
          source: input.identity.source,
          updatedAt: input.nowIso,
          userId: user.id,
        }

        state.users.push(user)
        state.calendars.push(calendar)
        state.authIdentities.push(identity)

        return {
          identity,
          user,
        }
      }

      const storedIdentity = state.authIdentities[identityIndex]!
      const identity =
        storedIdentity.email === input.identity.email
          ? storedIdentity
          : {
              ...storedIdentity,
              email: input.identity.email,
              updatedAt: input.nowIso,
            }

      state.authIdentities[identityIndex] = identity

      const userIndex = state.users.findIndex((user) => user.id === identity.userId)
      const existingUser = userIndex === -1 ? null : state.users[userIndex]
      const defaultCalendar = selectDefaultCalendar(state.calendars, identity.userId)
      const user = existingUser ?? {
        defaultCalendarId: defaultCalendar?.id ?? input.newDefaultCalendar.id,
        displayName: input.newUser.displayName,
        id: identity.userId,
        locale: input.newUser.locale,
        timezone: input.newUser.timezone,
      }

      if (userIndex === -1) {
        state.users.push(user)
      }

      const ensuredDefaultCalendar =
        defaultCalendar ??
        createDefaultCalendar({
          calendarId: user.defaultCalendarId,
          nowIso: input.nowIso,
          ownerUserId: user.id,
          template: input.newDefaultCalendar,
        })

      if (!defaultCalendar) {
        state.calendars.push(ensuredDefaultCalendar)
      }

      const nextUser =
        user.defaultCalendarId === ensuredDefaultCalendar.id
          ? user
          : {
              ...user,
              defaultCalendarId: ensuredDefaultCalendar.id,
            }

      if (userIndex !== -1) {
        state.users[userIndex] = nextUser
      } else if (nextUser !== user) {
        state.users[state.users.length - 1] = nextUser
      }

      return {
        identity,
        user: nextUser,
      }
    })
  }
}

function selectDefaultCalendar(
  calendars: CalendarSummary[],
  ownerUserId: string
): CalendarSummary | null {
  return (
    calendars.find((calendar) => calendar.ownerUserId === ownerUserId && calendar.isDefault) ??
    null
  )
}

function createDefaultCalendar(input: {
  ownerUserId: string
  calendarId: string
  nowIso: string
  template: {
    name: string
    slug: string | null
  }
}): CalendarSummary {
  return {
    createdAt: input.nowIso,
    id: input.calendarId,
    isDefault: true,
    name: input.template.name,
    ownerUserId: input.ownerUserId,
    slug: input.template.slug,
    updatedAt: input.nowIso,
  }
}
