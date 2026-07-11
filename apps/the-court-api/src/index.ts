import type { Server as HttpServer } from "node:http"

import { serve } from "@hono/node-server"
import { Server as IOServer } from "socket.io"

import { buildApp } from "./app.js"
import { makeOriginChecker } from "./cors.js"
import { loadEnv } from "./env.js"
import { setSocketServer } from "./ws/hub.js"
import { registerSocket } from "./ws/register.js"

// 단일 서비스: Hono(REST) + Socket.IO(WS) 를 같은 http.Server·같은 포트에 얹는다.
const env = loadEnv()
const app = buildApp(env)
const isAllowed = makeOriginChecker(env.cors)

const server = serve(
  { fetch: app.fetch, hostname: env.host, port: env.port },
  (info) => {
    console.log(`[the-court-api] http+ws listening on :${info.port}`)
  }
)

// @hono/node-server 가 노출한 http.Server 에 Socket.IO attach.
const io = new IOServer(server as unknown as HttpServer, {
  cors: {
    origin: (origin, cb) => cb(null, !origin || isAllowed(origin)),
    allowedHeaders: ["X-User-Uuid"],
    credentials: false,
  },
})

setSocketServer(io)
registerSocket(io)
