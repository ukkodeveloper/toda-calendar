export type CalendarLayer = "all" | "photo" | "doodle" | "text"

export type DayEditorMode = Exclude<CalendarLayer, "all">

export type SaveState = "idle" | "saving" | "saved" | "error"

export type DoodlePoint = {
  x: number
  y: number
}

export type DoodleStroke = {
  id: string
  color: string
  width: number
  points: DoodlePoint[]
}

export type DayRecord = {
  localDate: string
  note: string
  photoUri: string | null
  doodleStrokes: DoodleStroke[]
  updatedAt: string
}

export type DayRecordSummary = {
  localDate: string
  hasPhoto: boolean
  hasDoodle: boolean
  hasText: boolean
  intensity: number
}

export type MonthCell = {
  localDate: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  summary: DayRecordSummary | null
}

export type MonthView = {
  calendarId: string
  month: string
  monthLabel: string
  todayLocalDate: string
  weeks: MonthCell[][]
  stats: {
    recordedDays: number
    photoDays: number
    doodleDays: number
    textDays: number
  }
}
