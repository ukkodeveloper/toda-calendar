import type { CalendarRepository, UpsertDayRecordInput } from "../../application/ports/calendar-repository.js"
import { JsonFileStore } from "./file-store.js"

export class FileCalendarRepository implements CalendarRepository {
  constructor(private readonly store: JsonFileStore) {}

  async deleteDayRecord(ownerUserId: string, calendarId: string, localDate: string) {
    await this.store.mutate((state) => {
      const index = state.dayRecords.findIndex(
        (record) =>
          record.ownerUserId === ownerUserId &&
          record.calendarId === calendarId &&
          record.localDate === localDate
      )

      if (index !== -1) {
        state.dayRecords.splice(index, 1)
      }
    })
  }

  async findCalendarById(ownerUserId: string, calendarId: string) {
    const state = await this.store.read()

    return (
      state.calendars.find(
        (calendar) =>
          calendar.ownerUserId === ownerUserId && calendar.id === calendarId
      ) ?? null
    )
  }

  async findDayRecord(ownerUserId: string, calendarId: string, localDate: string) {
    const state = await this.store.read()

    return (
      state.dayRecords.find(
        (record) =>
          record.ownerUserId === ownerUserId &&
          record.calendarId === calendarId &&
          record.localDate === localDate
      ) ?? null
    )
  }

  async getCurrentUser() {
    const state = await this.store.read()

    return state.user
  }

  async listCalendars(ownerUserId: string) {
    const state = await this.store.read()

    return state.calendars
      .filter((calendar) => calendar.ownerUserId === ownerUserId)
      .sort(
        (left, right) =>
          Number(right.isDefault) - Number(left.isDefault) ||
          left.createdAt.localeCompare(right.createdAt)
      )
  }

  async listDayRecordsForDateRange(
    ownerUserId: string,
    calendarId: string,
    startLocalDate: string,
    endLocalDate: string
  ) {
    const state = await this.store.read()

    return state.dayRecords
      .filter(
        (record) =>
          record.ownerUserId === ownerUserId &&
          record.calendarId === calendarId &&
          record.localDate >= startLocalDate &&
          record.localDate <= endLocalDate
      )
      .sort((left, right) => left.localDate.localeCompare(right.localDate))
  }

  async upsertDayRecord(input: UpsertDayRecordInput) {
    return this.store.mutate((state) => {
      const index = state.dayRecords.findIndex(
        (record) =>
          record.ownerUserId === input.ownerUserId &&
          record.calendarId === input.calendarId &&
          record.localDate === input.localDate
      )
      const existing = index === -1 ? null : state.dayRecords[index]
      const id = existing?.id ?? input.id

      if (!id) {
        throw new Error("Day record id is required for upsert")
      }

      const nextRecord = {
        calendarId: input.calendarId,
        createdAt: existing?.createdAt ?? input.createdAt ?? input.updatedAt,
        id,
        localDate: input.localDate,
        ownerUserId: input.ownerUserId,
        slots: input.slots,
        timezone: input.timezone,
        updatedAt: input.updatedAt,
      }

      if (index === -1) {
        state.dayRecords.push(nextRecord)
      } else {
        state.dayRecords[index] = nextRecord
      }

      return nextRecord
    })
  }
}
