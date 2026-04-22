import { randomUUID } from "node:crypto"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import { AuthContextService } from "../src/application/services/auth-context-service.js"
import { MockAccessTokenVerifier } from "../src/infrastructure/auth/mock-access-token-verifier.js"
import { FileAuthRepository } from "../src/infrastructure/persistence/file-auth-repository.js"
import { JsonFileStore } from "../src/infrastructure/persistence/file-store.js"

const tempDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true })
    )
  )
})

describe("AuthContextService", () => {
  it("bootstraps an internal user once for repeated requests from the same identity", async () => {
    const service = await createAuthContextService()

    const [first, second] = await Promise.all([
      service.authenticate("dev:bootstrap-user:bootstrap@example.com"),
      service.authenticate("dev:bootstrap-user:bootstrap@example.com"),
    ])

    expect(first.user.id).toBe(second.user.id)
    expect(first.user.defaultCalendarId).toBe(second.user.defaultCalendarId)
    expect(first.identity.externalSubject).toBe("bootstrap-user")
    expect(second.identity.email).toBe("bootstrap@example.com")
  })

  it("recreates a missing default calendar when an identity signs in again", async () => {
    const directory = await mkdtemp(join(tmpdir(), "toda-auth-context-"))
    const store = new JsonFileStore(join(directory, "store.json"))
    const service = new AuthContextService(
      new MockAccessTokenVerifier(),
      new FileAuthRepository(store),
      {
        clock: () => "2026-04-22T10:00:00.000Z",
        defaultCalendarName: "My Calendar",
        defaultLocale: "en",
        defaultTimezone: "Asia/Seoul",
        idGenerator: () => randomUUID(),
      }
    )

    tempDirectories.push(directory)

    const authenticatedUser = await service.authenticate(
      "dev:repair-user:repair@example.com"
    )

    await store.mutate((state) => {
      state.calendars = state.calendars.filter(
        (calendar) => calendar.id !== authenticatedUser.user.defaultCalendarId
      )
    })

    const repaired = await service.authenticate("dev:repair-user:repair@example.com")
    const state = await store.read()

    expect(repaired.user.defaultCalendarId).toBe(authenticatedUser.user.defaultCalendarId)
    expect(
      state.calendars.some(
        (calendar) => calendar.id === authenticatedUser.user.defaultCalendarId
      )
    ).toBe(true)
  })
})

async function createAuthContextService() {
  const directory = await mkdtemp(join(tmpdir(), "toda-auth-context-"))

  tempDirectories.push(directory)

  return new AuthContextService(
    new MockAccessTokenVerifier(),
    new FileAuthRepository(new JsonFileStore(join(directory, "store.json"))),
    {
      clock: () => "2026-04-22T10:00:00.000Z",
      defaultCalendarName: "My Calendar",
      defaultLocale: "en",
      defaultTimezone: "Asia/Seoul",
      idGenerator: () => randomUUID(),
    }
  )
}
