export type AuthIdentity = {
  email: string | null
  source: "supabase"
  subject: string
}

export type AppSessionRuntime = "bypass" | "configured"

export type AppSession = {
  identity: AuthIdentity | null
  isAuthenticated: boolean
  runtime: AppSessionRuntime
}

export function createAuthenticatedAppSession(
  identity: AuthIdentity
): AppSession {
  return {
    identity,
    isAuthenticated: true,
    runtime: "configured",
  }
}

export function createGuestAppSession(): AppSession {
  return {
    identity: null,
    isAuthenticated: false,
    runtime: "configured",
  }
}

export function createBypassAppSession(): AppSession {
  return {
    identity: null,
    isAuthenticated: false,
    runtime: "bypass",
  }
}
