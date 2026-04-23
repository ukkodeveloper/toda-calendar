import { z } from "zod"

import { appCopy } from "@/lib/copy"

export const appAuthProviderSchema = z.enum(["kakao", "apple", "google"])

export type AppAuthProvider = z.infer<typeof appAuthProviderSchema>

export type AppAuthProviderDefinition = {
  actionLabel: string
  description: string
  id: AppAuthProvider
  mark: string
}

export const APP_AUTH_PROVIDERS: readonly AppAuthProviderDefinition[] = [
  {
    ...appCopy.auth.providers.kakao,
    id: "kakao",
  },
  {
    ...appCopy.auth.providers.apple,
    id: "apple",
  },
  {
    ...appCopy.auth.providers.google,
    id: "google",
  },
] as const

const supabaseProviderMap = {
  apple: "apple",
  google: "google",
  kakao: "kakao",
} as const

export function parseAppAuthProvider(
  value?: string | null
): AppAuthProvider | null {
  const parsed = appAuthProviderSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function toSupabaseProvider(provider: AppAuthProvider) {
  return supabaseProviderMap[provider]
}
