import { NextResponse } from "next/server"

import { buildLoginPath, sanitizeNextPath } from "@/lib/auth/session"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { hasSupabaseAuthEnv } from "@/lib/supabase/config"

export const dynamic = "force-dynamic"

function withNoStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const nextPath = sanitizeNextPath(url.searchParams.get("next"))
  const code = url.searchParams.get("code")
  const providerError = url.searchParams.get("error")

  if (!hasSupabaseAuthEnv()) {
    return withNoStore(
      NextResponse.redirect(
        new URL(
          buildLoginPath({
            error: "AUTH_NOT_CONFIGURED",
            next: nextPath,
          }),
          request.url
        )
      )
    )
  }

  if (providerError || !code) {
    return withNoStore(
      NextResponse.redirect(
        new URL(
          buildLoginPath({
            error: code ? "SESSION_EXCHANGE_FAILED" : "OAUTH_CODE_MISSING",
            next: nextPath,
          }),
          request.url
        )
      )
    )
  }

  const supabase = await createSupabaseServerClient()

  if (!supabase) {
    return withNoStore(
      NextResponse.redirect(
        new URL(
          buildLoginPath({
            error: "AUTH_NOT_CONFIGURED",
            next: nextPath,
          }),
          request.url
        )
      )
    )
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return withNoStore(
      NextResponse.redirect(
        new URL(
          buildLoginPath({
            error: "SESSION_EXCHANGE_FAILED",
            next: nextPath,
          }),
          request.url
        )
      )
    )
  }

  return withNoStore(
    NextResponse.redirect(new URL(nextPath, request.url))
  )
}
