import type { CalendarRepository } from "../ports/calendar-repository.js"
import { applyDayRecordPatch, buildMonthViewCells, type DayRecordPatch } from "../../domain/calendar-rules.js"
import { NotFoundError } from "../../domain/errors.js"
import type { DayRecord, MonthLayer } from "../../domain/models.js"

type CalendarServiceDependencies = {
  clock: () => string
  idGenerator: () => string
}

export class CalendarService {
  constructor(
    private readonly repository: CalendarRepository,
    private readonly dependencies: CalendarServiceDependencies
  ) {}

  async getMe() {
    const user = await this.repository.getCurrentUser()

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

  async listCalendars() {
    const user = await this.repository.getCurrentUser()
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
    calendarId: string
    month: string
    layer: MonthLayer
  }) {
    const user = await this.repository.getCurrentUser()

    await this.getCalendarOrThrow(user.id, input.calendarId)

    const records = await this.repository.listDayRecordsForMonth(
      user.id,
      input.calendarId,
      input.month
    )

    return {
      cells: buildMonthViewCells(input.month, input.layer, records),
      layer: input.layer,
      month: input.month,
    }
  }

  async getDayRecord(input: { calendarId: string; localDate: string }) {
    const user = await this.repository.getCurrentUser()

    await this.getCalendarOrThrow(user.id, input.calendarId)

    const record = await this.repository.findDayRecord(
      user.id,
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
            timezone: user.timezone,
          },
    }
  }

  async patchDayRecord(input: {
    calendarId: string
    localDate: string
    patch: DayRecordPatch
  }) {
    const user = await this.repository.getCurrentUser()

    await this.getCalendarOrThrow(user.id, input.calendarId)

    const existingRecord = await this.repository.findDayRecord(
      user.id,
      input.calendarId,
      input.localDate
    )

    const nextRecord = applyDayRecordPatch({
      calendarId: input.calendarId,
      existing: existingRecord,
      idGenerator: this.dependencies.idGenerator,
      localDate: input.localDate,
      nowIso: this.dependencies.clock(),
      ownerUserId: user.id,
      patch: input.patch,
      timezone: existingRecord?.timezone ?? user.timezone,
    })

    if (!nextRecord) {
      if (existingRecord) {
        await this.repository.deleteDayRecord(user.id, input.calendarId, input.localDate)
      }

      return {
        dayRecord: {
          calendarId: input.calendarId,
          id: null,
          localDate: input.localDate,
          slots: [],
          timezone: existingRecord?.timezone ?? user.timezone,
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
