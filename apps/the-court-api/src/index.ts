import type { Server as HttpServer } from "node:http"

import { serve } from "@hono/node-server"
import { Server as IOServer } from "socket.io"

import { buildApp } from "./app.js"
import { makeOriginChecker } from "./cors.js"
import { prisma } from "./db.js"
import { loadEnv } from "./env.js"
import { log } from "./log.js"
import { attachRedisAdapter } from "./ws/adapter.js"
import { setSocketServer } from "./ws/hub.js"
import { registerSocket } from "./ws/register.js"

// 단일 서비스: Hono(REST) + Socket.IO(WS) 를 같은 http.Server·같은 포트에 얹는다.
const env = loadEnv()
const app = buildApp(env)
const isAllowed = makeOriginChecker(env.cors)

const server = serve(
  { fetch: app.fetch, hostname: env.host, port: env.port },
  (info) => {
    log.info("listening", { port: info.port })
  }
)

// @hono/node-server 가 노출한 http.Server 에 Socket.IO attach.
const io = new IOServer(server as unknown as HttpServer, {
  cors: {
    origin: (origin, cb) => cb(null, !origin || isAllowed(origin)),
    allowedHeaders: ["X-User-Uuid"],
    credentials: false,
  },
  // 배포 중 짧은 끊김(수초)은 rooms+누락패킷 자동복구(보조 — 진짜 갭복구는 REST seq-sync).
  connectionStateRecovery: {},
})

setSocketServer(io)
registerSocket(io)

// Redis adapter 이음매(수평확장) — REDIS_URL 없으면 in-memory. 실패해도 단일노드로 계속(fail-open).
void attachRedisAdapter(io, env)

// ── graceful shutdown ────────────────────────────────────────────────────────
// SIGTERM/SIGINT → io.close(소켓 정리) → server.close(HTTP 배수) → prisma 연결 해제 → exit.
let shuttingDown = false
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true
  log.info("shutdown_begin", { signal })
  try {
    await new Promise<void>((resolve) => io.close(() => resolve()))
    await new Promise<void>((resolve, reject) =>
      server.close((err?: Error) => (err ? reject(err) : resolve()))
    )
    await prisma.$disconnect()
    log.info("shutdown_done", { signal })
    process.exit(0)
  } catch (err) {
    log.error("shutdown_error", { err: String(err) })
    process.exit(1)
  }
}
process.on("SIGTERM", () => void shutdown("SIGTERM"))
process.on("SIGINT", () => void shutdown("SIGINT"))
