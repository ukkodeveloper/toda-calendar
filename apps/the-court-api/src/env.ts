import { existsSync } from "node:fs"
import { resolve } from "node:path"

import { z } from "zod"

const envSchema = z.object({
  HOST: z.string().trim().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  // Railway Postgres. 지금은 optional — DB 실연결은 슬라이스 02/05(worker-db·infra).
  DATABASE_URL: z.string().trim().optional(),
  // Redis(Socket.IO 수평확장 adapter). optional — 없으면 in-memory 단일 replica.
  //   설정 시 index.ts 가 @socket.io/redis-adapter 를 동적 부착(fail-open).
  REDIS_URL: z.string().trim().optional(),
  // 정확 오리진 콤마 구분.
  CORS_ORIGINS: z.string().trim().default("http://localhost:3100"),
  // Vercel preview 등 동적 오리진(선택). 정규식 문자열.
  CORS_ORIGIN_PREVIEW_REGEX: z.string().trim().optional(),
})

function loadLocalEnvFiles() {
  for (const fileName of [".env.local", ".env"]) {
    const filePath = resolve(process.cwd(), fileName)
    if (existsSync(filePath)) {
      process.loadEnvFile(filePath)
    }
  }
}

export type CorsConfig = {
  exact: string[]
  previewRegex?: RegExp
}

export type AppEnvConfig = {
  host: string
  port: number
  databaseUrl?: string
  redisUrl?: string
  cors: CorsConfig
}

export function loadEnv(): AppEnvConfig {
  loadLocalEnvFiles()
  const parsed = envSchema.parse(process.env)

  const exact = parsed.CORS_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    host: parsed.HOST,
    port: parsed.PORT,
    databaseUrl: parsed.DATABASE_URL,
    redisUrl: parsed.REDIS_URL,
    cors: {
      exact,
      previewRegex: parsed.CORS_ORIGIN_PREVIEW_REGEX
        ? new RegExp(parsed.CORS_ORIGIN_PREVIEW_REGEX)
        : undefined,
    },
  }
}
