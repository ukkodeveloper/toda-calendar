import { NextResponse } from "next/server"

import { buildLoginPath } from "@/lib/auth/session"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { hasSupabaseAuthEnv } from "@/lib/supabase/config"

export const dynamic = "force-dynamic"

function withNoStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

export async function GET(request: Request) {
  if (hasSupabaseAuthEnv()) {
    const supabase = await createSupabaseServerClient()
    await supabase?.auth.signOut()
  }

  return withNoStore(
    NextResponse.redirect(new URL(buildLoginPath(), request.url))
  )
}
