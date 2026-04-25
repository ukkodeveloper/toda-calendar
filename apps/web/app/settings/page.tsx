import { SettingsPageShell } from "@/components/settings/settings-page-shell"
import { getAppSession } from "@/lib/auth/session"

export default async function SettingsPage() {
  const session = await getAppSession()

  return <SettingsPageShell session={session} />
}
