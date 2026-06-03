"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  getSupabasePublicConfig,
  requireSupabasePublicConfig,
} from "./config"

let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  const config = requireSupabasePublicConfig()

  if (!browserClient) {
    browserClient = createBrowserClient(config.url, config.publishableKey)
  }

  return browserClient
}

export async function getBrowserAccessToken() {
  if (!getSupabasePublicConfig()) {
    return null
  }

  const { data, error } = await getSupabaseBrowserClient().auth.getSession()

  if (error) {
    return null
  }

  return data.session?.access_token ?? null
}
