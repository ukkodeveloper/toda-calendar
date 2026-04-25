import fs from "node:fs"
import path from "node:path"

export function getRuntimeDir(repoRoot: string) {
  return path.join(repoRoot, ".data", "discord-bridge")
}

export function ensureRuntimeDir(repoRoot: string) {
  const runtimeDir = getRuntimeDir(repoRoot)
  fs.mkdirSync(runtimeDir, { recursive: true })
  return runtimeDir
}

export function getBridgeHealthFile(repoRoot: string) {
  return path.join(getRuntimeDir(repoRoot), "health.json")
}

export function getBridgeJobLogFile(repoRoot: string) {
  return path.join(getRuntimeDir(repoRoot), "jobs.jsonl")
}
