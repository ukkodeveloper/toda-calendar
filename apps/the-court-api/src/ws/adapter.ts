import type { Server as IOServer } from "socket.io"

import type { AppEnvConfig } from "../env.js"
import { log } from "../log.js"

// Socket.IO 수평확장 이음매 — REDIS_URL 있으면 redis pub/sub adapter 부착(교차노드 브로드캐스트),
// 없으면 in-memory(단일 replica). import 는 동적+게이팅 → REDIS_URL 미설정이면 redis 패키지를
// 런타임에 아예 로드하지 않는다. fail-open: 부착 실패(패키지 없음·연결 실패)면 로그 후 단일노드 지속.
export async function attachRedisAdapter(
  io: IOServer,
  env: AppEnvConfig
): Promise<void> {
  if (!env.redisUrl) {
    log.info("ws_adapter", { mode: "in-memory" })
    return
  }
  try {
    const [{ createAdapter }, { createClient }] = await Promise.all([
      import("@socket.io/redis-adapter"),
      import("redis"),
    ])
    const pub = createClient({ url: env.redisUrl })
    const sub = pub.duplicate()
    pub.on("error", (e: unknown) =>
      log.error("redis_pub_error", { err: String(e) })
    )
    sub.on("error", (e: unknown) =>
      log.error("redis_sub_error", { err: String(e) })
    )
    await Promise.all([pub.connect(), sub.connect()])
    io.adapter(createAdapter(pub, sub))
    log.info("ws_adapter", { mode: "redis" })
  } catch (err) {
    // 단일노드로 계속 — write 경로는 in-memory adapter 로 정상 동작.
    log.error("ws_adapter_fallback", { err: String(err) })
  }
}
