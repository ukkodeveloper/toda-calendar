/* eslint-disable turbo/no-undeclared-env-vars */

import { execFile } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const PREVIEW_TIMEOUT_MS = Number(process.env.DISCORD_PREVIEW_TIMEOUT_MS ?? 15 * 60_000)
const VERCEL_IGNORE_ADDITIONS = [
  ".data",
  ".turbo",
  "node_modules",
  "apps/*/dist",
  "apps/*/.next",
  "apps/*/.expo",
]

function parseField(stdout: string, name: string) {
  const match = stdout.match(new RegExp(`^${name}=(.+)$`, "m"))
  return match?.[1]?.trim() ?? ""
}

export async function runVercelPreviewDeployment(
  worktreePath: string,
  options: { previewScriptPath?: string } = {},
) {
  const restoreVercelIgnore = await ensurePreviewVercelIgnore(worktreePath)
  const command = options.previewScriptPath
    ? `bash ${shellEscape(options.previewScriptPath)}`
    : "pnpm preview:vercel"

  try {
    const { stdout, stderr } = await execFileAsync(
      "/bin/bash",
      ["-lc", command],
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
  } finally {
    await restoreVercelIgnore()
  }
}

function shellEscape(value: string) {
  return `'${value.replace(/'/g, `'"'"'`)}'`
}

async function ensurePreviewVercelIgnore(worktreePath: string) {
  const ignorePath = path.join(worktreePath, ".vercelignore")
  let original: string | null = null

  try {
    original = await fs.readFile(ignorePath, "utf8")
  } catch (error) {
    if (!isFileMissingError(error)) {
      throw error
    }
  }

  const current = original ?? ""
  const existingLines = new Set(
    current
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  )
  const additions = VERCEL_IGNORE_ADDITIONS.filter((line) => !existingLines.has(line))

  if (additions.length > 0) {
    const separator = current.trim().length > 0 ? "\n" : ""
    await fs.writeFile(ignorePath, `${current}${separator}${additions.join("\n")}\n`)
  }

  return async () => {
    if (original === null) {
      await fs.rm(ignorePath, { force: true })
      return
    }

    await fs.writeFile(ignorePath, original)
  }
}

function isFileMissingError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  )
}
