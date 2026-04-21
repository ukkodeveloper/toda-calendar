import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { dayQueryKey, monthQueryPrefix } from "@/lib/query-keys"
import { calendarStore } from "@/services/calendar-store"
import { triggerSaveHaptic } from "@/services/haptics"
import type { DoodleStroke, SaveState } from "@/types/calendar"

export function useDayRecord(calendarId: string, localDate: string) {
  const queryClient = useQueryClient()
  const [saveState, setSaveState] = useState<SaveState>("idle")

  const query = useQuery({
    queryKey: dayQueryKey(calendarId, localDate),
    queryFn: () => calendarStore.getDayRecord(calendarId, localDate),
  })

  useEffect(() => {
    if (saveState !== "saved") {
      return
    }

    const timeoutId = setTimeout(() => {
      setSaveState("idle")
    }, 1400)

    return () => clearTimeout(timeoutId)
  }, [saveState])

  async function commitSave(task: () => Promise<Awaited<ReturnType<typeof calendarStore.getDayRecord>>>) {
    setSaveState("saving")

    try {
      const next = await task()
      queryClient.setQueryData(dayQueryKey(calendarId, localDate), next)
      await queryClient.invalidateQueries({ queryKey: monthQueryPrefix(calendarId) })
      setSaveState("saved")
      void triggerSaveHaptic()
      return next
    } catch (error) {
      setSaveState("error")
      throw error
    }
  }

  return {
    ...query,
    saveState,
    saveNote(note: string) {
      return commitSave(() => calendarStore.saveNote(calendarId, localDate, note))
    },
    savePhoto(photoUri: string | null) {
      return commitSave(() => calendarStore.savePhoto(calendarId, localDate, photoUri))
    },
    saveDoodle(doodleStrokes: DoodleStroke[]) {
      return commitSave(() => calendarStore.saveDoodle(calendarId, localDate, doodleStrokes))
    },
  }
}
