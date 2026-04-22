import { z } from "zod"

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
    actionLabel: "Continue with Kakao",
    description: "The fastest entry for Korea-first usage.",
    id: "kakao",
    mark: "K",
  },
  {
    actionLabel: "Continue with Apple",
    description: "A private, low-friction path for calm journaling.",
    id: "apple",
    mark: "A",
  },
  {
    actionLabel: "Continue with Google",
    description: "A familiar fallback for cross-device continuity.",
    id: "google",
    mark: "G",
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
