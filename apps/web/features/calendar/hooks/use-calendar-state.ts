"use client"

import * as React from "react"

import { createSeedCalendarRecordRepository } from "../data/calendar-record-repository"
import {
  calendarReducer,
  createInitialCalendarState,
  getRecordForDate,
} from "../model/calendar-state"
import { createDayRecordPatch } from "../model/day-record-mutation"
import type { CalendarDayRecord } from "../model/types"
import { releaseReplacedSessionPhoto } from "../utils/session-photo"

export function useCalendarState() {
  const [repository] = React.useState(() =>
    createSeedCalendarRecordRepository()
  )

  const [state, dispatch] = React.useReducer(
    calendarReducer,
    undefined,
    () => createInitialCalendarState(repository.getInitialRecords())
  )

  const selectedRecord = state.selectedDate
    ? getRecordForDate(state.recordsByDate, state.selectedDate)
    : null

  const openDay = React.useCallback((date: string) => {
    dispatch({ type: "open-editor", date })
  }, [])

  const closeEditor = React.useCallback(() => {
    dispatch({ type: "close-editor" })
  }, [])

  const advancePreviewMode = React.useCallback(() => {
    dispatch({ type: "cycle-preview-mode" })
  }, [])

  const saveDayRecord = React.useCallback(
    async (record: CalendarDayRecord) => {
      const previousRecord = state.recordsByDate[record.date] ?? null
      const patch = createDayRecordPatch(previousRecord, record)

      if (record.photo) {
        repository.registerPhotoAsset(record.photo)
      }

      const nextRecord = await repository.commitDayRecord(
        record.date,
        patch,
        record.currentPreviewType
      )

      releaseReplacedSessionPhoto(previousRecord?.photo, nextRecord?.photo)

      dispatch({
        type: "save-record",
        date: record.date,
        record: nextRecord,
      })
    },
    [repository, state.recordsByDate]
  )

  return {
    closeEditor,
    advancePreviewMode,
    openDay,
    saveDayRecord,
    selectedRecord,
    state,
  }
}
