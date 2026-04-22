import type { CalendarRepository } from "../ports/calendar-repository.js"
import { applyDayRecordPatch, buildMonthViewCells, type DayRecordPatch } from "../../domain/calendar-rules.js"
import { NotFoundError } from "../../domain/errors.js"
import { getMonthGridRange, listLocalDatesForMonth } from "../../domain/local-date.js"
import type { DayRecord, MonthLayer, UserProfile } from "../../domain/models.js"

type CalendarServiceDependencies = {
  clock: () => string
  idGenerator: () => string
}

export class CalendarService {
  constructor(
    private readonly repository: CalendarRepository,
    private readonly dependencies: CalendarServiceDependencies
  ) {}

  async getMe(user: UserProfile) {
    return {
      defaultCalendarId: user.defaultCalendarId,
      user: {
        displayName: user.displayName,
        id: user.id,
        locale: user.locale,
        timezone: user.timezone,
      },
    }
  }

  async listCalendars(user: UserProfile) {
    const calendars = await this.repository.listCalendars(user.id)

    return {
      calendars: calendars.map((calendar) => ({
        id: calendar.id,
        isDefault: calendar.isDefault,
        name: calendar.name,
        slug: calendar.slug,
      })),
    }
  }

  async getMonthView(input: {
    user: UserProfile
    calendarId: string
    month: string
    layer: MonthLayer
  }) {
    const visibleRange = getMonthGridRange(input.month)

    await this.getCalendarOrThrow(input.user.id, input.calendarId)

    const records = await this.repository.listDayRecordsForDateRange(
      input.user.id,
      input.calendarId,
      visibleRange.startLocalDate,
      visibleRange.endLocalDate
    )

    return {
      cells: buildMonthViewCells(input.month, input.layer, records),
      layer: input.layer,
      month: input.month,
    }
  }

  async listDayRecords(input: {
    user: UserProfile
    calendarId: string
    month: string
  }) {
    const monthDates = listLocalDatesForMonth(input.month)
    const startLocalDate = monthDates[0]
    const endLocalDate = monthDates.at(-1)

    await this.getCalendarOrThrow(input.user.id, input.calendarId)

    if (!startLocalDate || !endLocalDate) {
      return {
        dayRecords: [],
        month: input.month,
      }
    }

    return {
      dayRecords: (await this.repository.listDayRecordsForDateRange(
        input.user.id,
        input.calendarId,
        startLocalDate,
        endLocalDate
      )).map((record) => this.serializeDayRecord(record)),
      month: input.month,
    }
  }

  async getDayRecord(input: {
    user: UserProfile
    calendarId: string
    localDate: string
  }) {
    await this.getCalendarOrThrow(input.user.id, input.calendarId)

    const record = await this.repository.findDayRecord(
      input.user.id,
      input.calendarId,
      input.localDate
    )

    return {
      dayRecord: record
        ? this.serializeDayRecord(record)
        : {
            calendarId: input.calendarId,
            id: null,
            localDate: input.localDate,
            slots: [],
            timezone: input.user.timezone,
          },
    }
  }

  async patchDayRecord(input: {
    user: UserProfile
    calendarId: string
    localDate: string
    patch: DayRecordPatch
  }) {
    await this.getCalendarOrThrow(input.user.id, input.calendarId)

    const existingRecord = await this.repository.findDayRecord(
      input.user.id,
      input.calendarId,
      input.localDate
    )

    const nextRecord = applyDayRecordPatch({
      calendarId: input.calendarId,
      existing: existingRecord,
      idGenerator: this.dependencies.idGenerator,
      localDate: input.localDate,
      nowIso: this.dependencies.clock(),
      ownerUserId: input.user.id,
      patch: input.patch,
      timezone: existingRecord?.timezone ?? input.user.timezone,
    })

    if (!nextRecord) {
      if (existingRecord) {
        await this.repository.deleteDayRecord(
          input.user.id,
          input.calendarId,
          input.localDate
        )
      }

      return {
        dayRecord: {
          calendarId: input.calendarId,
          id: null,
          localDate: input.localDate,
          slots: [],
          timezone: existingRecord?.timezone ?? input.user.timezone,
        },
      }
    }

    const savedRecord = await this.repository.upsertDayRecord(nextRecord)

    return {
      dayRecord: this.serializeDayRecord(savedRecord),
    }
  }

  private async getCalendarOrThrow(userId: string, calendarId: string) {
    const calendar = await this.repository.findCalendarById(userId, calendarId)

    if (!calendar) {
      throw new NotFoundError("CALENDAR_NOT_FOUND", "Calendar not found", {
        calendarId,
      })
    }

    return calendar
  }

  private serializeDayRecord(record: DayRecord) {
    return {
      calendarId: record.calendarId,
      id: record.id,
      localDate: record.localDate,
      slots: record.slots,
      timezone: record.timezone,
    }
  }
}
