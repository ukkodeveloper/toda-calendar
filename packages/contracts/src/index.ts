export {
  apiErrorSchema,
  authErrorCodeSchema,
  localDateSchema,
  monthKeySchema,
} from "./common.js"
export {
  calendarSummarySchema,
  dayRecordSchema,
  dayRecordSlotSchema,
  doodleSlotSchema,
  getDayRecordResponseSchema,
  getMonthViewQuerySchema,
  getMonthViewResponseSchema,
  listCalendarsResponseSchema,
  listDayRecordsQuerySchema,
  listDayRecordsResponseSchema,
  meResponseSchema,
  monthLayerSchema,
  patchDayRecordBodySchema,
  photoSlotSchema,
  textSlotSchema,
} from "./calendar.js"
export type {
  CalendarSummary,
  DayRecord,
  DayRecordSlot,
  DoodleStroke,
  GetDayRecordResponse,
  GetMonthViewResponse,
  ListCalendarsResponse,
  ListDayRecordsResponse,
  MeResponse,
  MonthLayer,
  PatchDayRecordBody,
} from "./calendar.js"
export type { ApiErrorResponse, AuthErrorCode } from "./common.js"

// 현행범(the-court) 계약 — REST DTO + WS 이벤트 SoT.
export * from "./the-court/index.js"
