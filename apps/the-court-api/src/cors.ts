import type { CorsConfig } from "./env.js"

// REST(Hono) · WS(Socket.IO) 공용 오리진 판정.
// 정확 오리진 allowlist + Vercel preview 정규식(선택).
export const CORS_ALLOWED_HEADERS = ["Content-Type", "X-User-Uuid"]
export const CORS_ALLOWED_METHODS = ["GET", "POST", "OPTIONS"]

export function makeOriginChecker(cfg: CorsConfig) {
  return (origin: string | undefined | null): boolean => {
    if (!origin) return false
    if (cfg.exact.includes(origin)) return true
    if (cfg.previewRegex?.test(origin)) return true
    return false
  }
}
