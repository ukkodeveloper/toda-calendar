/* eslint-disable turbo/no-undeclared-env-vars */

import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const PREVIEW_TIMEOUT_MS = Number(process.env.DISCORD_PREVIEW_TIMEOUT_MS ?? 15 * 60_000)

function parseField(stdout: string, name: string) {
  const match = stdout.match(new RegExp(`^${name}=(.+)$`, "m"))
  return match?.[1]?.trim() ?? ""
}

export async function runVercelPreviewDeployment(worktreePath: string) {
  const { stdout, stderr } = await execFileAsync(
    "/bin/bash",
    ["-lc", "pnpm preview:vercel"],
    {
      cwd: worktreePath,
      timeout: PREVIEW_TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024,
    },
  )

  const combined = [stdout, stderr].filter(Boolean).join("\n")
  const url = parseField(combined, "preview_url")
  const readyValue = parseField(combined, "ready")

  if (!url) {
    throw new Error("Vercel preview URL을 찾지 못했어요.")
  }

  return {
    url,
    ready: readyValue === "yes",
    raw: combined.trim(),
  }
}
