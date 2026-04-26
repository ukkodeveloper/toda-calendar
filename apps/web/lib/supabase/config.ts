function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

export type SupabasePublicConfig = {
  publishableKey: string
  url: string
}

function firstConfiguredValue(...values: Array<string | undefined>) {
  for (const value of values) {
    const normalized = value?.trim()

    if (normalized) {
      return normalized
    }
  }

  return null
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const publishableKey = firstConfiguredValue(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  if (!url || !publishableKey) {
    return null
  }

  return {
    publishableKey,
    url: trimTrailingSlash(url),
  }
}

export function hasSupabaseAuthEnv() {
  return getSupabasePublicConfig() !== null
}

export function requireSupabasePublicConfig() {
  const config = getSupabasePublicConfig()

  if (!config) {
    throw new Error(
      "Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    )
  }

  return config
}
