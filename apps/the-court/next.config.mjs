import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.join(__dirname, "../..")

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8080"

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
      // WebSocket also proxied through Vercel so browsers don't hit the dev tunnel directly
      {
        source: "/ws",
        destination: `${API_ORIGIN}/ws`,
      },
    ]
  },
}

export default nextConfig
