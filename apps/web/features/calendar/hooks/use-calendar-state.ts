"use client"

import * as React from "react"

import { createApiCalendarRecordRepository } from "../data/api-calendar-record-repository"
import {
  calendarReducer,
  createInitialCalendarState,
  getRecordForDate,
} from "../model/calendar-state"
import type { CalendarDayRecord, ContentType } from "../model/types"
import { releaseReplacedSessionPhoto } from "../utils/session-photo"

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "The calendar could not connect to the API."
}

export function useCalendarState(months: string[]) {
  const [repository] = React.useState(() =>
    createApiCalendarRecordRepository()
  )
  const [state, dispatch] = React.useReducer(
    calendarReducer,
    undefined,
    () => createInitialCalendarState([])
  )
  const [calendarId, setCalendarId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = React.useState(true)
  const [isHydrating, setIsHydrating] = React.useState(false)
  const [loadedMonths, setLoadedMonths] = React.useState<string[]>([])
  const [reloadToken, setReloadToken] = React.useState(0)
  const pendingMonthsRef = React.useRef(new Set<string>())
  const monthSignature = Array.from(new Set(months)).sort().join("|")

  const selectedRecord = state.selectedDate
    ? getRecordForDate(state.recordsByDate, state.selectedDate)
    : null

  React.useEffect(() => {
    let cancelled = false

    dispatch({ type: "reset-records" })
    pendingMonthsRef.current.clear()
    setCalendarId(null)
    setLoadedMonths([])
    setError(null)
    setIsBootstrapping(true)

    repository
      .getDefaultCalendarId()
      .then((nextCalendarId) => {
        if (cancelled) {
          return
        }

        setCalendarId(nextCalendarId)
      })
      .catch((nextError) => {
        if (cancelled) {
          return
        }

        setError(toErrorMessage(nextError))
      })
      .finally(() => {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken, repository])

  React.useEffect(() => {
    if (!calendarId) {
      return
    }

    const uniqueMonths = monthSignature ? monthSignature.split("|") : []
    const loadedMonthSet = new Set(loadedMonths)
    const missingMonths = uniqueMonths.filter(
      (month) =>
        !loadedMonthSet.has(month) && !pendingMonthsRef.current.has(month)
    )

    if (!missingMonths.length) {
      return
    }

    let cancelled = false

    missingMonths.forEach((month) => pendingMonthsRef.current.add(month))
    setIsHydrating(true)

    Promise.all(
      missingMonths.map((month) => repository.getMonthRecords(calendarId, month))
    )
      .then((responses) => {
        if (cancelled) {
          return
        }

        const merged = responses.flat()

        if (merged.length) {
          dispatch({
            type: "merge-records",
            records: merged,
          })
        }

        setLoadedMonths((current) =>
          Array.from(new Set([...current, ...missingMonths])).sort()
        )
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(toErrorMessage(nextError))
        }
      })
      .finally(() => {
        missingMonths.forEach((month) => pendingMonthsRef.current.delete(month))

        if (!cancelled) {
          setIsHydrating(pendingMonthsRef.current.size > 0)
        }
      })

    return () => {
      cancelled = true
    }
  }, [calendarId, loadedMonths, monthSignature, repository])

  const openDay = React.useCallback((date: string) => {
    dispatch({ type: "open-editor", date })
  }, [])

  const closeEditor = React.useCallback(() => {
    dispatch({ type: "close-editor" })
  }, [])

  const advancePreviewMode = React.useCallback(() => {
    dispatch({ type: "cycle-preview-mode" })
  }, [])

  const reload = React.useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  const togglePreviewFilter = React.useCallback((contentType: ContentType) => {
    dispatch({ type: "toggle-filter", contentType })
  }, [])

  const saveDayRecord = React.useCallback(
    async (record: CalendarDayRecord) => {
      if (!calendarId) {
        throw new Error("Calendar bootstrap is not finished yet.")
      }

      const previousRecord = state.recordsByDate[record.date] ?? null
      const nextRecord = await repository.commitDayRecord(calendarId, previousRecord, record)

      releaseReplacedSessionPhoto(record.photo, nextRecord?.photo)
      releaseReplacedSessionPhoto(previousRecord?.photo, nextRecord?.photo)

      dispatch({
        type: "save-record",
        date: record.date,
        record: nextRecord,
      })
    },
    [calendarId, repository, state.recordsByDate]
  )

  return {
    closeEditor,
    advancePreviewMode,
    error,
    isInitialLoading: isBootstrapping || (!loadedMonths.length && isHydrating),
    isSyncingMonths: isHydrating,
    openDay,
    reload,
    saveDayRecord,
    selectedRecord,
    state,
    togglePreviewFilter,
  }
}
