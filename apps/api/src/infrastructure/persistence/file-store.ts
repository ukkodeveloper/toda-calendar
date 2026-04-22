import { randomUUID } from "node:crypto"
import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

import { dayRecordSlotSchema, localDateSchema } from "@workspace/contracts"
import { z } from "zod"

const isoDateTimeSchema = z.string().datetime()

const persistedUserSchema = z.object({
  defaultCalendarId: z.string().uuid(),
  displayName: z.string().nullable(),
  id: z.string().uuid(),
  locale: z.string().min(1).max(20),
  timezone: z.string().min(1).max(100),
})

const persistedCalendarSchema = z.object({
  createdAt: isoDateTimeSchema,
  id: z.string().uuid(),
  isDefault: z.boolean(),
  name: z.string().min(1).max(80),
  ownerUserId: z.string().uuid(),
  slug: z.string().nullable(),
  updatedAt: isoDateTimeSchema,
})

const persistedDayRecordSchema = z.object({
  calendarId: z.string().uuid(),
  createdAt: isoDateTimeSchema,
  id: z.string().uuid(),
  localDate: localDateSchema,
  ownerUserId: z.string().uuid(),
  slots: z.array(dayRecordSlotSchema),
  timezone: z.string().min(1).max(100),
  updatedAt: isoDateTimeSchema,
})

const persistedStoreSchema = z.object({
  calendars: z.array(persistedCalendarSchema),
  dayRecords: z.array(persistedDayRecordSchema),
  user: persistedUserSchema,
})

export type PersistedStore = z.infer<typeof persistedStoreSchema>

const DEFAULT_USER_ID = "00000000-0000-4000-8000-000000000001"
const DEFAULT_CALENDAR_ID = "10000000-0000-4000-8000-000000000001"

export class JsonFileStore {
  private writeQueue = Promise.resolve()

  constructor(private readonly filePath: string) {}

  async read() {
    return this.readFresh()
  }

  async mutate<T>(mutation: (state: PersistedStore) => Promise<T> | T): Promise<T> {
    const operation = this.writeQueue.then(async () => {
      const state = await this.readFresh()
      const result = await mutation(state)

      await this.persist(state)

      return result
    })

    this.writeQueue = operation.then(
      () => undefined,
      () => undefined
    )

    return operation
  }

  private async ensureFile() {
    await mkdir(dirname(this.filePath), { recursive: true })

    try {
      await access(this.filePath)
    } catch {
      await this.persist(createInitialStore())
    }
  }

  private async persist(state: PersistedStore) {
    const tempFilePath = `${this.filePath}.${randomUUID()}.tmp`

    await writeFile(tempFilePath, JSON.stringify(state, null, 2), "utf8")
    await rename(tempFilePath, this.filePath)
  }

  private async readFresh() {
    await this.ensureFile()

    const raw = await readFile(this.filePath, "utf8")

    return persistedStoreSchema.parse(JSON.parse(raw))
  }
}

function createInitialStore(): PersistedStore {
  const now = new Date().toISOString()

  return {
    calendars: [
      {
        createdAt: now,
        id: DEFAULT_CALENDAR_ID,
        isDefault: true,
        name: "My Calendar",
        ownerUserId: DEFAULT_USER_ID,
        slug: "my-calendar",
        updatedAt: now,
      },
    ],
    dayRecords: [],
    user: {
      defaultCalendarId: DEFAULT_CALENDAR_ID,
      displayName: "Toda Demo",
      id: DEFAULT_USER_ID,
      locale: "ko-KR",
      timezone: "Asia/Seoul",
    },
  }
}
