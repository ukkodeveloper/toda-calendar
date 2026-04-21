import AsyncStorage from "@react-native-async-storage/async-storage"

import {
  addDays,
  buildMonthView,
  createEmptyDayRecord,
  isRecordEmpty,
  toLocalDateKey,
} from "@/lib/calendar"
import type { DayRecord, DoodleStroke, MonthView } from "@/types/calendar"

const STORAGE_KEY = "toda-calendar/mobile-store/v1"

export const DEFAULT_CALENDAR_ID = "personal"

type CalendarStoreShape = {
  version: 1
  calendars: Record<
    string,
    {
      id: string
      name: string
      recordsByDate: Record<string, DayRecord>
    }
  >
}

type StoredCalendar = CalendarStoreShape["calendars"][string]

function createStroke(points: Array<[number, number]>, color: string): DoodleStroke {
  return {
    id: `seed-${points.length}-${color}`,
    color,
    width: 3,
    points: points.map(([x, y]) => ({ x, y })),
  }
}

function createSeedStore(): CalendarStoreShape {
  const today = new Date()
  const reflectionDate = toLocalDateKey(addDays(today, -2))
  const sketchDate = toLocalDateKey(addDays(today, -1))
  const intentionDate = toLocalDateKey(today)

  return {
    version: 1,
    calendars: {
      [DEFAULT_CALENDAR_ID]: {
        id: DEFAULT_CALENDAR_ID,
        name: "Personal",
        recordsByDate: {
          [reflectionDate]: {
            localDate: reflectionDate,
            note: "Slow breakfast, open window, and one clear thought worth keeping.",
            photoUri: null,
            doodleStrokes: [],
            updatedAt: new Date().toISOString(),
          },
          [sketchDate]: {
            localDate: sketchDate,
            note: "",
            photoUri: null,
            doodleStrokes: [
              createStroke(
                [
                  [12, 60],
                  [24, 44],
                  [38, 52],
                  [52, 30],
                  [66, 48],
                  [82, 24],
                ],
                "#2f6f93"
              ),
            ],
            updatedAt: new Date().toISOString(),
          },
          [intentionDate]: {
            localDate: intentionDate,
            note: "Capture one small detail before the day gets loud.",
            photoUri: null,
            doodleStrokes: [],
            updatedAt: new Date().toISOString(),
          },
        },
      },
    },
  }
}

async function writeStore(store: CalendarStoreShape) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

async function readStore() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)

  if (!raw) {
    const seeded = createSeedStore()
    await writeStore(seeded)
    return seeded
  }

  try {
    const parsed = JSON.parse(raw) as CalendarStoreShape

    if (parsed.version !== 1 || !parsed.calendars) {
      throw new Error("Unexpected store version")
    }

    return parsed
  } catch {
    const seeded = createSeedStore()
    await writeStore(seeded)
    return seeded
  }
}

function ensureCalendar(store: CalendarStoreShape, calendarId: string) {
  const existing = store.calendars[calendarId]

  if (existing) {
    return existing
  }

  const created: StoredCalendar = {
    id: calendarId,
    name: "Personal",
    recordsByDate: {},
  }

  store.calendars[calendarId] = created
  return created
}

async function updateRecord(
  calendarId: string,
  localDate: string,
  updater: (current: DayRecord) => DayRecord
) {
  const store = await readStore()
  const calendar = ensureCalendar(store, calendarId)
  const current = calendar.recordsByDate[localDate] ?? createEmptyDayRecord(localDate)
  const next = {
    ...updater(current),
    localDate,
    updatedAt: new Date().toISOString(),
  }

  if (isRecordEmpty(next)) {
    delete calendar.recordsByDate[localDate]
    await writeStore(store)
    return createEmptyDayRecord(localDate)
  }

  calendar.recordsByDate[localDate] = next
  await writeStore(store)
  return next
}

export const calendarStore = {
  async getMonthView(calendarId: string, month: string): Promise<MonthView> {
    const store = await readStore()
    const calendar = ensureCalendar(store, calendarId)

    return buildMonthView({
      calendarId,
      month,
      recordsByDate: calendar.recordsByDate,
    })
  },

  async getDayRecord(calendarId: string, localDate: string): Promise<DayRecord> {
    const store = await readStore()
    const calendar = ensureCalendar(store, calendarId)

    return calendar.recordsByDate[localDate] ?? createEmptyDayRecord(localDate)
  },

  async saveNote(calendarId: string, localDate: string, note: string) {
    return updateRecord(calendarId, localDate, current => ({
      ...current,
      note: note.trim(),
    }))
  },

  async savePhoto(calendarId: string, localDate: string, photoUri: string | null) {
    return updateRecord(calendarId, localDate, current => ({
      ...current,
      photoUri,
    }))
  },

  async saveDoodle(calendarId: string, localDate: string, doodleStrokes: DoodleStroke[]) {
    return updateRecord(calendarId, localDate, current => ({
      ...current,
      doodleStrokes,
    }))
  },
}
