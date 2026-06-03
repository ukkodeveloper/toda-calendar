import { NextResponse } from "next/server"

import { buildAuthErrorPath, buildLoginPath, sanitizeNextPath } from "@/lib/auth/session"
import { parseAppAuthProvider, toSupabaseProvider } from "@/lib/auth/providers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { hasSupabaseAuthEnv } from "@/lib/supabase/config"

export const dynamic = "force-dynamic"

function withNoStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await params
  const nextPath = sanitizeNextPath(
    new URL(request.url).searchParams.get("next")
  )
  const provider = parseAppAuthProvider(rawProvider)

  if (!provider) {
    return withNoStore(
      NextResponse.redirect(
        new URL(
          buildAuthErrorPath({
            code: "AUTH_PROVIDER_NOT_SUPPORTED",
            next: nextPath,
          }),
          request.url
        )
      )
    )
  }

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

  const callbackUrl = new URL("/auth/callback", request.url)
  callbackUrl.searchParams.set("next", nextPath)

  const { data, error } = await supabase.auth.signInWithOAuth({
    options: {
      redirectTo: callbackUrl.toString(),
    },
    provider: toSupabaseProvider(provider),
  })

  if (error || !data.url) {
    return withNoStore(
      NextResponse.redirect(
        new URL(
          buildLoginPath({
            error: "AUTH_SIGN_IN_START_FAILED",
            next: nextPath,
          }),
          request.url
        )
      )
    )
  }

  return withNoStore(NextResponse.redirect(new URL(data.url)))
}
