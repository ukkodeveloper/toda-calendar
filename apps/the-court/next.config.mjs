import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.join(__dirname, "../..")

// REST·WS 는 NEXT_PUBLIC_API_URL/NEXT_PUBLIC_WS_URL 로 절대 URL + CORS 직접 호출한다.
// (기존 /api·/ws rewrite 프록시는 제거 — dev CORS 는 백엔드가 localhost:3100 허용.)
/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
  // 공유 계약(zod) 을 소스에서 트랜스파일.
  transpilePackages: ["@workspace/contracts"],
}

export default nextConfig
