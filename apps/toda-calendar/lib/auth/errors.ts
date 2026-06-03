import { appCopy } from "@/lib/copy"

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
> = appCopy.auth.errors

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
