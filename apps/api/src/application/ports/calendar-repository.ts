import type { CalendarSummary, DayRecord, DayRecordSlot } from "../../domain/models.js"

export type UpsertDayRecordInput = {
  id?: string
  calendarId: string
  ownerUserId: string
  localDate: string
  timezone: string
  createdAt?: string
  updatedAt: string
  slots: DayRecordSlot[]
}

export interface CalendarRepository {
  deleteDayRecord(ownerUserId: string, calendarId: string, localDate: string): Promise<void>
  findCalendarById(ownerUserId: string, calendarId: string): Promise<CalendarSummary | null>
  findDayRecord(ownerUserId: string, calendarId: string, localDate: string): Promise<DayRecord | null>
  listCalendars(ownerUserId: string): Promise<CalendarSummary[]>
  listDayRecordsForDateRange(
    ownerUserId: string,
    calendarId: string,
    startLocalDate: string,
    endLocalDate: string
  ): Promise<DayRecord[]>
  upsertDayRecord(input: UpsertDayRecordInput): Promise<DayRecord>
}
