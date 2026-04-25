import fs from "node:fs"

import { loadEnv } from "./env.js"
import type { BridgeHealthSnapshot } from "./health.js"
import { getBridgeHealthFile } from "./runtime-files.js"

function isProcessAlive(pid: number) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function main() {
  const env = loadEnv()
  const healthFile = getBridgeHealthFile(env.repoRoot)

  if (!fs.existsSync(healthFile)) {
    console.log("bridge=missing")
    console.log(`health_file=${healthFile}`)
    process.exitCode = 1
    return
  }

  const snapshot = JSON.parse(fs.readFileSync(healthFile, "utf8")) as BridgeHealthSnapshot
  const heartbeatAgeMs = Date.now() - new Date(snapshot.heartbeatAt).getTime()
  const processAlive = isProcessAlive(snapshot.pid)
  const healthy = processAlive && snapshot.status !== "stopping" && heartbeatAgeMs < 30_000

  console.log(`bridge=${healthy ? "healthy" : "unhealthy"}`)
  console.log(`pid=${snapshot.pid}`)
  console.log(`status=${snapshot.status}`)
  console.log(`started_at=${snapshot.startedAt}`)
  console.log(`heartbeat_at=${snapshot.heartbeatAt}`)
  console.log(`heartbeat_age_ms=${heartbeatAgeMs}`)
  console.log(`process_alive=${processAlive}`)
  console.log(`health_file=${healthFile}`)

  if (!healthy) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error("Discord health check failed.")
  console.error(error)
  process.exitCode = 1
})
