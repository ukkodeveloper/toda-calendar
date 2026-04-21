import { randomUUID } from "node:crypto"
import { rm, mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import { CalendarService } from "../src/application/services/calendar-service.js"
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
    const { calendarId, service } = await createService()

    const response = await service.getDayRecord({
      calendarId,
      localDate: "2026-04-10",
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
    const { calendarId, service } = await createService()

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
    const { calendarId, service } = await createService()

    await service.patchDayRecord({
      calendarId,
      localDate: "2026-04-05",
      patch: {
        text: {
          body: "A quiet Sunday.",
        },
      },
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
    })

    const response = await service.getMonthView({
      calendarId,
      layer: "TEXT",
      month: "2026-04",
    })

    expect(response.cells).toHaveLength(30)
    expect(response.cells[4]).toEqual({
      hasContent: true,
      localDate: "2026-04-05",
      preview: {
        body: "A quiet Sunday.",
        title: null,
        type: "TEXT",
      },
    })
    expect(response.cells[6]).toEqual({
      hasContent: true,
      localDate: "2026-04-07",
      preview: null,
    })
  })
})

async function createService() {
  const tempDirectory = await mkdtemp(join(tmpdir(), "toda-api-service-"))

  tempDirectories.push(tempDirectory)

  const repository = new FileCalendarRepository(
    new JsonFileStore(join(tempDirectory, "store.json"))
  )
  const service = new CalendarService(repository, {
    clock: () => "2026-04-22T10:00:00.000Z",
    idGenerator: () => randomUUID(),
  })
  const me = await service.getMe()

  return {
    calendarId: me.defaultCalendarId,
    service,
  }
}
