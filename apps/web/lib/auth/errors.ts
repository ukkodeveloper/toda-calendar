export const AUTH_UI_ERROR_CODES = [
  "AUTH_NOT_CONFIGURED",
  "AUTH_PROVIDER_NOT_SUPPORTED",
  "AUTH_SIGN_IN_START_FAILED",
  "OAUTH_CODE_MISSING",
  "SESSION_EXCHANGE_FAILED",
] as const

export type AuthUiErrorCode = (typeof AUTH_UI_ERROR_CODES)[number]

export const AUTH_ERROR_COPY: Record<
  AuthUiErrorCode,
  { description: string; title: string }
> = {
  AUTH_NOT_CONFIGURED: {
    description:
      "The OAuth flow is wired, but the public Supabase keys are not configured in this environment yet.",
    title: "Auth setup is still pending",
  },
  AUTH_PROVIDER_NOT_SUPPORTED: {
    description:
      "That social sign-in entry does not exist in this build. Head back and choose Kakao, Apple, or Google.",
    title: "Unsupported provider",
  },
  AUTH_SIGN_IN_START_FAILED: {
    description:
      "Toda could not hand off to the social provider. Please try the same button again in a moment.",
    title: "The provider handoff did not start",
  },
  OAUTH_CODE_MISSING: {
    description:
      "The callback returned without a valid authorization code, so the session could not be finished.",
    title: "The callback came back incomplete",
  },
  SESSION_EXCHANGE_FAILED: {
    description:
      "The provider returned, but Toda could not exchange the callback for a web session cookie.",
    title: "The session could not be completed",
  },
}

export function toAuthUiErrorCode(
  value?: string | null
): AuthUiErrorCode | null {
  if (!value) {
    return null
  }

  return AUTH_UI_ERROR_CODES.includes(value as AuthUiErrorCode)
    ? (value as AuthUiErrorCode)
    : null
}
