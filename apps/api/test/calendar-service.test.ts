import { randomUUID } from "node:crypto"
import { rm, mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import { AuthContextService } from "../src/application/services/auth-context-service.js"
import { CalendarService } from "../src/application/services/calendar-service.js"
import { MockAccessTokenVerifier } from "../src/infrastructure/auth/mock-access-token-verifier.js"
import { FileAuthRepository } from "../src/infrastructure/persistence/file-auth-repository.js"
import { FileCalendarRepository } from "../src/infrastructure/persistence/file-calendar-repository.js"
import { JsonFileStore } from "../src/infrastructure/persistence/file-store.js"

const tempDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true })
    )
  )
})

describe("CalendarService", () => {
  it("returns an empty day record when no record exists yet", async () => {
    const { calendarId, currentUser, service } = await createService()

    const response = await service.getDayRecord({
      calendarId,
      localDate: "2026-04-10",
      user: currentUser,
    })

    expect(response).toEqual({
      dayRecord: {
        calendarId,
        id: null,
        localDate: "2026-04-10",
        slots: [],
        timezone: "Asia/Seoul",
      },
    })
  })

  it("creates, merges, and removes slots without leaking transport concerns", async () => {
    const { calendarId, currentUser, service } = await createService()

    const created = await service.patchDayRecord({
      calendarId,
      localDate: "2026-04-21",
      patch: {
        photo: {
          alt: "Morning light",
          assetUrl: "/photos/morning-light.jpg",
        },
        text: {
          body: "Coffee before the rain.",
          title: "Morning",
        },
      },
      user: currentUser,
    })

    expect(created.dayRecord.id).not.toBeNull()
    expect(created.dayRecord.slots).toEqual([
      {
        alt: "Morning light",
        assetUrl: "/photos/morning-light.jpg",
        type: "PHOTO",
      },
      {
        body: "Coffee before the rain.",
        title: "Morning",
        type: "TEXT",
      },
    ])

    const updated = await service.patchDayRecord({
      calendarId,
      localDate: "2026-04-21",
      patch: {
        text: {
          body: "Tea instead of coffee.",
        },
      },
      user: currentUser,
    })

    expect(updated.dayRecord.slots).toEqual([
      {
        alt: "Morning light",
        assetUrl: "/photos/morning-light.jpg",
        type: "PHOTO",
      },
      {
        body: "Tea instead of coffee.",
        title: "Morning",
        type: "TEXT",
      },
    ])

    const removed = await service.patchDayRecord({
      calendarId,
      localDate: "2026-04-21",
      patch: {
        photo: null,
        text: null,
      },
      user: currentUser,
    })

    expect(removed).toEqual({
      dayRecord: {
        calendarId,
        id: null,
        localDate: "2026-04-21",
        slots: [],
        timezone: "Asia/Seoul",
      },
    })
  })

  it("builds a stable month view with full-month coverage and layer-specific previews", async () => {
    const { calendarId, currentUser, service } = await createService()

    await service.patchDayRecord({
      calendarId,
      localDate: "2026-03-29",
      patch: {
        text: {
          body: "Month grid starts here.",
        },
      },
      user: currentUser,
    })

    await service.patchDayRecord({
      calendarId,
      localDate: "2026-04-05",
      patch: {
        text: {
          body: "A quiet Sunday.",
        },
      },
      user: currentUser,
    })

    await service.patchDayRecord({
      calendarId,
      localDate: "2026-04-07",
      patch: {
        doodle: {
          strokes: [
            {
              color: "#111827",
              points: [
                { x: 10, y: 10 },
                { x: 16, y: 18 },
              ],
              width: 2,
            },
          ],
        },
      },
      user: currentUser,
    })

    const response = await service.getMonthView({
      calendarId,
      layer: "TEXT",
      month: "2026-04",
      user: currentUser,
    })

    expect(response.cells).toHaveLength(42)
    expect(response.cells[0]).toEqual({
      hasContent: true,
      isCurrentMonth: false,
      localDate: "2026-03-29",
      preview: {
        body: "Month grid starts here.",
        title: null,
        type: "TEXT",
      },
    })
    expect(response.cells[7]).toEqual({
      hasContent: true,
      isCurrentMonth: true,
      localDate: "2026-04-05",
      preview: {
        body: "A quiet Sunday.",
        title: null,
        type: "TEXT",
      },
    })
    expect(response.cells[9]).toEqual({
      hasContent: true,
      isCurrentMonth: true,
      localDate: "2026-04-07",
      preview: null,
    })
    expect(response.cells[41]).toEqual({
      hasContent: false,
      isCurrentMonth: false,
      localDate: "2026-05-09",
      preview: null,
    })
  })
})

async function createService() {
  const tempDirectory = await mkdtemp(join(tmpdir(), "toda-api-service-"))
  const store = new JsonFileStore(join(tempDirectory, "store.json"))

  tempDirectories.push(tempDirectory)

  const authContextService = new AuthContextService(
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
  const repository = new FileCalendarRepository(store)
  const service = new CalendarService(repository, {
    clock: () => "2026-04-22T10:00:00.000Z",
    idGenerator: () => randomUUID(),
  })
  const authenticatedUser = await authContextService.authenticate(
    "dev:calendar-service-user:calendar@example.com"
  )
  const me = await service.getMe(authenticatedUser.user)

  return {
    currentUser: authenticatedUser.user,
    calendarId: me.defaultCalendarId,
    service,
  }
}
