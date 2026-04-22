import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import { buildApiApp } from "../src/app.js"

const resources: Array<{ close: () => Promise<void>; directory: string }> = []

afterEach(async () => {
  await Promise.all(
    resources.splice(0).map(async ({ close, directory }) => {
      await close()
      await rm(directory, { force: true, recursive: true })
    })
  )
})

describe("API routes", () => {
  it("returns a 422 error with the shared error shape for invalid month queries", async () => {
    const { app, calendarId } = await createApp()

    const response = await app.inject({
      method: "GET",
      url: `/v1/calendars/${calendarId}/month-view?month=2026-13&layer=TEXT`,
    })

    expect(response.statusCode).toBe(422)
    expect(response.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
      },
    })
  })

  it("persists day-record updates through the HTTP boundary", async () => {
    const { app, calendarId } = await createApp()

    const patchResponse = await app.inject({
      method: "PATCH",
      payload: {
        text: {
          body: "Closed the laptop before midnight.",
        },
      },
      url: `/v1/calendars/${calendarId}/day-records/2026-04-22`,
    })

    expect(patchResponse.statusCode).toBe(200)
    expect(patchResponse.json()).toMatchObject({
      dayRecord: {
        calendarId,
        id: expect.any(String),
        localDate: "2026-04-22",
        slots: [
          {
            body: "Closed the laptop before midnight.",
            title: null,
            type: "TEXT",
          },
        ],
        timezone: "Asia/Seoul",
      },
    })

    const getResponse = await app.inject({
      method: "GET",
      url: `/v1/calendars/${calendarId}/day-records/2026-04-22`,
    })

    expect(getResponse.statusCode).toBe(200)
    expect(getResponse.json()).toEqual(patchResponse.json())
  })

  it("lists month records for the shared web client hydration path", async () => {
    const { app, calendarId } = await createApp()

    await app.inject({
      method: "PATCH",
      payload: {
        text: {
          body: "Closed the laptop before midnight.",
        },
      },
      url: `/v1/calendars/${calendarId}/day-records/2026-04-22`,
    })

    const response = await app.inject({
      method: "GET",
      url: `/v1/calendars/${calendarId}/day-records?month=2026-04`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      dayRecords: [
        {
          calendarId,
          localDate: "2026-04-22",
        },
      ],
      month: "2026-04",
    })
  })

  it("returns 404 when the requested calendar does not belong to the current user", async () => {
    const { app } = await createApp()

    const response = await app.inject({
      method: "GET",
      url: "/v1/calendars/20000000-0000-4000-8000-000000000099/day-records/2026-04-22",
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toMatchObject({
      error: {
        code: "CALENDAR_NOT_FOUND",
        message: "Calendar not found",
      },
    })
  })
})

async function createApp() {
  const directory = await mkdtemp(join(tmpdir(), "toda-api-routes-"))
  const { app } = await buildApiApp({
    env: {
      dataFilePath: join(directory, "store.json"),
      host: "127.0.0.1",
      port: 0,
    },
    logger: false,
  })

  resources.push({
    close: () => app.close(),
    directory,
  })

  const meResponse = await app.inject({
    method: "GET",
    url: "/v1/me",
  })

  return {
    app,
    calendarId: meResponse.json().defaultCalendarId as string,
  }
}
