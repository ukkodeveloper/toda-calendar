import { CalendarApp } from "@/features/calendar/components/calendar-app"
import { getAppSession } from "@/lib/auth/session"

export default async function Page() {
  const session = await getAppSession()

  return <CalendarApp session={session} />
}
