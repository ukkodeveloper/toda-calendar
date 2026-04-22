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

const persistedAuthIdentitySchema = z.object({
  createdAt: isoDateTimeSchema,
  email: z.string().email().nullable(),
  externalSubject: z.string().trim().min(1).max(255),
  id: z.string().uuid(),
  source: z.enum(["SUPABASE", "DEVELOPMENT"]),
  updatedAt: isoDateTimeSchema,
  userId: z.string().uuid(),
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
  authIdentities: z.array(persistedAuthIdentitySchema),
  calendars: z.array(persistedCalendarSchema),
  dayRecords: z.array(persistedDayRecordSchema),
  users: z.array(persistedUserSchema),
  version: z.literal(2),
})

const legacyStoreSchema = z.object({
  calendars: z.array(persistedCalendarSchema),
  dayRecords: z.array(persistedDayRecordSchema),
  user: persistedUserSchema,
})

export type PersistedStore = z.infer<typeof persistedStoreSchema>

export class JsonFileStore {
  private writeQueue = Promise.resolve()

  constructor(private readonly filePath: string) {}

  async read(): Promise<PersistedStore> {
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

  private async readFresh(): Promise<PersistedStore> {
    await this.ensureFile()

    const raw = await readFile(this.filePath, "utf8")
    const { didMigrate, state } = parsePersistedStore(raw)

    if (didMigrate) {
      await this.persist(state)
    }

    return state
  }
}

function createInitialStore(): PersistedStore {
  return {
    authIdentities: [],
    calendars: [],
    dayRecords: [],
    users: [],
    version: 2,
  }
}

function parsePersistedStore(raw: string): {
  state: PersistedStore
  didMigrate: boolean
} {
  const parsed = JSON.parse(raw)
  const current = persistedStoreSchema.safeParse(parsed)

  if (current.success) {
    return {
      didMigrate: false,
      state: current.data,
    }
  }

  const legacy = legacyStoreSchema.parse(parsed)

  return {
    didMigrate: true,
    state: migrateLegacyStore(legacy),
  }
}

function migrateLegacyStore(legacy: z.infer<typeof legacyStoreSchema>): PersistedStore {
  const now = new Date().toISOString()

  return {
    authIdentities: [
      {
        createdAt: now,
        email: null,
        externalSubject: legacy.user.id,
        id: randomUUID(),
        source: "DEVELOPMENT",
        updatedAt: now,
        userId: legacy.user.id,
      },
    ],
    calendars: legacy.calendars,
    dayRecords: legacy.dayRecords,
    users: [legacy.user],
    version: 2,
  }
}
