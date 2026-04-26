/* eslint-disable turbo/no-undeclared-env-vars */

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { z } from "zod"

const envSchema = z.object({
  DISCORD_BOT_TOKEN: z.string().min(1, "DISCORD_BOT_TOKEN is required"),
  DISCORD_APPLICATION_ID: z.string().min(1, "DISCORD_APPLICATION_ID is required"),
  DISCORD_GUILD_ID: z.string().min(1, "DISCORD_GUILD_ID is required"),
  DISCORD_SPRINT_CHANNEL_ID: z.string().min(1, "DISCORD_SPRINT_CHANNEL_ID is required"),
  DISCORD_DEFAULT_SPRINT_ID: z.string().min(1).default("sprint1"),
  DISCORD_BRIDGE_STATE_FILE: z.string().min(1).default(".data/discord-bridge-state.json"),
  DISCORD_WORKTREE_ROOT: z.string().min(1).default(path.join(os.homedir(), ".codex/worktrees/discord")),
  DISCORD_LOCAL_DEV_ORIGIN: z.string().url().default("http://localhost:3000"),
  DISCORD_AUTONOMOUS_STAGE_CONCURRENCY: z.coerce.number().int().positive().default(2),
  TODA_REPO_ROOT: z.string().optional(),
})

function resolveRepoRoot() {
  const configured = process.env.TODA_REPO_ROOT?.trim()

  if (configured) {
    return path.resolve(configured)
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(moduleDir, "../../..")
}

export function loadEnv() {
  const repoRoot = resolveRepoRoot()
  const envFilePath = path.join(repoRoot, "apps/discord-bridge/.env")

  if (fs.existsSync(envFilePath)) {
    const envLines = fs.readFileSync(envFilePath, "utf8").split(/\r?\n/)

    for (const line of envLines) {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith("#")) {
        continue
      }

      const separatorIndex = trimmed.indexOf("=")

      if (separatorIndex === -1) {
        continue
      }

      const key = trimmed.slice(0, separatorIndex).trim()
      const value = trimmed.slice(separatorIndex + 1).trim()

      if (!value) {
        continue
      }

      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
  }

  const parsed = envSchema.parse(process.env)

  return {
    ...parsed,
    repoRoot,
    worktreeRoot: path.isAbsolute(parsed.DISCORD_WORKTREE_ROOT)
      ? parsed.DISCORD_WORKTREE_ROOT
      : path.join(repoRoot, parsed.DISCORD_WORKTREE_ROOT),
    stateFile: path.isAbsolute(parsed.DISCORD_BRIDGE_STATE_FILE)
      ? parsed.DISCORD_BRIDGE_STATE_FILE
      : path.join(repoRoot, parsed.DISCORD_BRIDGE_STATE_FILE),
  }
}
