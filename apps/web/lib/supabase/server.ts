import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getSupabasePublicConfig } from "./config"

export async function createSupabaseServerClient() {
  const config = getSupabasePublicConfig()

  if (!config) {
    return null
  }

  const cookieStore = await cookies()

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components may read auth cookies without being able to
          // persist refreshes. Route handlers still write them correctly.
        }
      },
    },
  })
}
