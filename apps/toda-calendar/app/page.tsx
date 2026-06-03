import { CalendarApp } from "@/features/calendar/components/calendar-app"
import { resolveCalendarEntryDate } from "@/features/calendar/utils/date"
import { getAppSession } from "@/lib/auth/session"

type PageProps = {
  searchParams: Promise<{
    date?: string | string[]
  }>
}

function getFirstQueryValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

export default async function Page({ searchParams }: PageProps) {
  const query = await searchParams
  const session = await getAppSession()
  const { selectedDate } = resolveCalendarEntryDate(getFirstQueryValue(query.date))

  return <CalendarApp initialDate={selectedDate} session={session} />
}
