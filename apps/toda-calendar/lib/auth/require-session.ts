import { redirect } from "next/navigation"

import { getAppSession, buildLoginPath } from "./session"

type RequireSessionOptions = {
  next?: string | null
}

export async function requireSession(options?: RequireSessionOptions) {
  const session = await getAppSession()

  if (session.runtime === "bypass") {
    return session
  }

  if (!session.isAuthenticated) {
    redirect(
      buildLoginPath({
        next: options?.next,
      })
    )
  }

  return session
}
