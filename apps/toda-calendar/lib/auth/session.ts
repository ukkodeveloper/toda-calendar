import { cache } from "react"

import type { AuthUiErrorCode } from "./errors"
import {
  createAuthenticatedAppSession,
  createBypassAppSession,
  createGuestAppSession,
  type AppSession,
} from "./app-session"
import { createSupabaseServerClient } from "../supabase/server"
import { hasSupabaseAuthEnv } from "../supabase/config"

type SearchParamValue = string | string[] | undefined

function readEmail(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null
}

function readSubject(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null
}

export function getFirstQueryValue(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

export function sanitizeNextPath(value?: string | null) {
  const normalized = value?.trim()

  if (!normalized || !normalized.startsWith("/") || normalized.startsWith("//")) {
    return "/"
  }

  return normalized
}

export function buildLoginPath(options?: {
  error?: AuthUiErrorCode | null
  next?: string | null
}) {
  const params = new URLSearchParams()
  const nextPath = sanitizeNextPath(options?.next)

  if (nextPath !== "/") {
    params.set("next", nextPath)
  }

  if (options?.error) {
    params.set("error", options.error)
  }

  const query = params.toString()
  return query ? `/login?${query}` : "/login"
}

export function buildAuthErrorPath(options?: {
  code?: AuthUiErrorCode | null
  next?: string | null
}) {
  const params = new URLSearchParams()
  const nextPath = sanitizeNextPath(options?.next)

  if (options?.code) {
    params.set("code", options.code)
  }

  if (nextPath !== "/") {
    params.set("next", nextPath)
  }

  const query = params.toString()
  return query ? `/auth/error?${query}` : "/auth/error"
}

export const getAppSession = cache(async (): Promise<AppSession> => {
  if (!hasSupabaseAuthEnv()) {
    return createBypassAppSession()
  }

  const supabase = await createSupabaseServerClient()

  if (!supabase) {
    return createBypassAppSession()
  }

  const { data, error } = await supabase.auth.getClaims()
  const subject = readSubject(data?.claims?.sub)

  if (error || !subject) {
    return createGuestAppSession()
  }

  return createAuthenticatedAppSession({
    email: readEmail(data?.claims?.email),
    source: "supabase",
    subject,
  })
})
