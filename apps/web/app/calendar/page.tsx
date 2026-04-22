import { requireSession } from "@/lib/auth/require-session"
import { CalendarApp } from "@/features/calendar/components/calendar-app"

export default async function CalendarPage() {
  const session = await requireSession({
    next: "/calendar",
  })

  return <CalendarApp session={session} />
}
