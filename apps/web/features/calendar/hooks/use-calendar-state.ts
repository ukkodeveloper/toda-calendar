"use client"

import * as React from "react"

import { loadCalendarSeed } from "../data/calendar-seed"
import {
  calendarReducer,
  createInitialCalendarState,
  getRecordForDate,
} from "../model/calendar-state"

export function useCalendarState() {
  const [state, dispatch] = React.useReducer(
    calendarReducer,
    undefined,
    () => createInitialCalendarState(loadCalendarSeed())
  )

  const selectedRecord = state.selectedDate
    ? getRecordForDate(state.recordsByDate, state.selectedDate)
    : null

  return {
    state,
    dispatch,
    selectedRecord,
  }
}
