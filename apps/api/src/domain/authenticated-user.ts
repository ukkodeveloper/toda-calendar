import type { UserProfile } from "./models.js"

export const authIdentitySources = ["SUPABASE", "DEVELOPMENT"] as const

export type AuthIdentitySource = (typeof authIdentitySources)[number]

export type VerifiedAccessTokenIdentity = {
  source: AuthIdentitySource
  subject: string
  email: string | null
}

export type AuthIdentity = {
  id: string
  source: AuthIdentitySource
  externalSubject: string
  email: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

export type AuthenticatedUser = {
  identity: AuthIdentity
  user: UserProfile
}
