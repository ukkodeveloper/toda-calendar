import { resolve } from "node:path"

import { z } from "zod"

const envSchema = z.object({
  HOST: z.string().trim().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3030),
  TODA_API_AUTH_MODE: z.enum(["mock", "supabase"]).optional(),
  TODA_API_CORS_ALLOWED_HEADERS: z
    .string()
    .trim()
    .min(1)
    .default("Content-Type, Authorization"),
  TODA_API_DATA_FILE: z.string().trim().min(1).optional(),
  TODA_API_DEFAULT_CALENDAR_NAME: z.string().trim().min(1).default("My Calendar"),
  TODA_API_DEFAULT_LOCALE: z.string().trim().min(1).default("en"),
  TODA_API_DEFAULT_TIMEZONE: z.string().trim().min(1).default("Asia/Seoul"),
  TODA_API_SUPABASE_JWKS_URL: z.string().url().optional(),
  TODA_API_SUPABASE_JWT_AUDIENCE: z.string().trim().min(1).optional(),
  TODA_API_SUPABASE_JWT_ISSUER: z.string().url().optional(),
  TODA_API_SUPABASE_PROJECT_URL: z.string().url().optional(),
})

export type ApiEnv = {
  authMode: "mock" | "supabase"
  corsAllowedHeaders: string
  host: string
  port: number
  dataFilePath: string
  defaultCalendarName: string
  defaultLocale: string
  defaultTimezone: string
  supabaseJwksUrl?: string
  supabaseJwtAudience?: string
  supabaseJwtIssuer?: string
  supabaseProjectUrl?: string
}

export function loadApiEnv(overrides: Partial<ApiEnv> = {}): ApiEnv {
  const environment = envSchema.parse(process.env)
  const projectUrl =
    overrides.supabaseProjectUrl ?? environment.TODA_API_SUPABASE_PROJECT_URL
  const jwtIssuer =
    overrides.supabaseJwtIssuer ??
    environment.TODA_API_SUPABASE_JWT_ISSUER ??
    (projectUrl ? new URL("/auth/v1", projectUrl).toString().replace(/\/$/, "") : undefined)
  const jwksUrl =
    overrides.supabaseJwksUrl ??
    environment.TODA_API_SUPABASE_JWKS_URL ??
    (jwtIssuer ? new URL(".well-known/jwks.json", `${jwtIssuer}/`).toString() : undefined)
  const authMode =
    overrides.authMode ?? environment.TODA_API_AUTH_MODE ?? "mock"

  if (authMode === "supabase" && (!projectUrl || !jwtIssuer || !jwksUrl)) {
    throw new Error(
      "Supabase auth mode requires TODA_API_SUPABASE_PROJECT_URL and derivable issuer/JWKS settings"
    )
  }

  return {
    authMode,
    corsAllowedHeaders:
      overrides.corsAllowedHeaders ?? environment.TODA_API_CORS_ALLOWED_HEADERS,
    dataFilePath:
      overrides.dataFilePath ??
      resolve(process.cwd(), environment.TODA_API_DATA_FILE ?? ".data/store.json"),
    defaultCalendarName:
      overrides.defaultCalendarName ?? environment.TODA_API_DEFAULT_CALENDAR_NAME,
    defaultLocale: overrides.defaultLocale ?? environment.TODA_API_DEFAULT_LOCALE,
    defaultTimezone:
      overrides.defaultTimezone ?? environment.TODA_API_DEFAULT_TIMEZONE,
    host: overrides.host ?? environment.HOST,
    port: overrides.port ?? environment.PORT,
    supabaseJwksUrl: jwksUrl,
    supabaseJwtAudience:
      overrides.supabaseJwtAudience ?? environment.TODA_API_SUPABASE_JWT_AUDIENCE,
    supabaseJwtIssuer: jwtIssuer,
    supabaseProjectUrl: projectUrl,
  }
}
