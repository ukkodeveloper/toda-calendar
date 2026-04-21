import type { CalendarSummary, DayRecord, DayRecordSlot, UserProfile } from "../../domain/models.js"

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
  getCurrentUser(): Promise<UserProfile>
  listCalendars(ownerUserId: string): Promise<CalendarSummary[]>
  listDayRecordsForMonth(
    ownerUserId: string,
    calendarId: string,
    month: string
  ): Promise<DayRecord[]>
  upsertDayRecord(input: UpsertDayRecordInput): Promise<DayRecord>
}
