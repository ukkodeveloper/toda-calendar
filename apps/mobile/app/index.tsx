import { Redirect } from "expo-router"

import { getMonthKey } from "@/lib/calendar"
import { DEFAULT_CALENDAR_ID } from "@/services/calendar-store"

export default function IndexRoute() {
  return <Redirect href={`/calendar/${DEFAULT_CALENDAR_ID}?month=${getMonthKey(new Date())}`} />
}
