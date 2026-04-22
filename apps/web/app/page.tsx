import { requireSession } from "@/lib/auth/require-session"
import { CalendarApp } from "@/features/calendar/components/calendar-app"

export default async function Page() {
  const session = await requireSession({
    next: "/",
  })

  return <CalendarApp session={session} />
}
