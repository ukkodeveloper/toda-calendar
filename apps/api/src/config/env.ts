import { resolve } from "node:path"

import { z } from "zod"

const envSchema = z.object({
  HOST: z.string().trim().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3030),
  TODA_API_DATA_FILE: z.string().trim().min(1).optional(),
})

export type ApiEnv = {
  host: string
  port: number
  dataFilePath: string
}

export function loadApiEnv(overrides: Partial<ApiEnv> = {}): ApiEnv {
  const environment = envSchema.parse(process.env)

  return {
    dataFilePath:
      overrides.dataFilePath ??
      resolve(process.cwd(), environment.TODA_API_DATA_FILE ?? ".data/store.json"),
    host: overrides.host ?? environment.HOST,
    port: overrides.port ?? environment.PORT,
  }
}
