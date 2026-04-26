/* eslint-disable turbo/no-undeclared-env-vars */

import { execFile } from "node:child_process"
import fs from "node:fs"
import { promisify } from "node:util"

import type { SprintThreadState } from "./types.js"

const execFileAsync = promisify(execFile)
const COMMAND_TIMEOUT_MS = Number(process.env.DISCORD_MERGE_COMMAND_TIMEOUT_MS ?? 20 * 60_000)

type CommandResult = {
  command: string
  ok: boolean
  output: string
}

type MergeOperatorParams = {
  repoRoot: string
  state: SprintThreadState
}

function summarizeOutput(output: string, maxLength = 1200) {
  const compact = output.replace(/\s+/g, " ").trim()
  return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength - 3)}...`
}

function formatCommand(command: string, args: string[]) {
  return [command, ...args].join(" ")
}

async function run(command: string, args: string[], cwd: string) {
  const formatted = formatCommand(command, args)

  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd,
      timeout: COMMAND_TIMEOUT_MS,
      maxBuffer: 20 * 1024 * 1024,
    })

    return {
      command: formatted,
      ok: true,
      output: [stdout, stderr].filter(Boolean).join("\n").trim(),
    } satisfies CommandResult
  } catch (error) {
    const record = typeof error === "object" && error !== null ? (error as Record<string, unknown>) : {}
    const stdout = typeof record.stdout === "string" ? record.stdout : ""
    const stderr = typeof record.stderr === "string" ? record.stderr : ""
    const message = error instanceof Error ? error.message : "command failed"

    return {
      command: formatted,
      ok: false,
      output: [stdout, stderr, message].filter(Boolean).join("\n").trim(),
    } satisfies CommandResult
  }
}

async function mustRun(command: string, args: string[], cwd: string) {
  const result = await run(command, args, cwd)

  if (!result.ok) {
    throw new Error(`${result.command}\n${summarizeOutput(result.output)}`)
  }

  return result
}

function buildWorktreeCommitMessage(state: SprintThreadState) {
  if (state.workflowKind === "design_system") {
    return `feat(design-system): add ${state.featureSlug} example`
  }

  return `feat(${state.sprintId}/${state.featureSlug}): implement sprint work`
}

async function ensureWorktreeCommit(state: SprintThreadState) {
  const status = await mustRun("git", ["status", "--porcelain"], state.worktreePath)

  if (!status.output) {
    return "worktree 변경사항 없음"
  }

  await mustRun("git", ["add", "-A"], state.worktreePath)
  await mustRun("git", ["commit", "-m", buildWorktreeCommitMessage(state)], state.worktreePath)

  return "worktree 변경사항 커밋 완료"
}

async function ensureDependencies(worktreePath: string) {
  if (fs.existsSync(`${worktreePath}/node_modules`)) {
    return null
  }

  const install = await run("pnpm", ["install", "--frozen-lockfile"], worktreePath)

  if (!install.ok) {
    throw new Error(`${install.command}\n${summarizeOutput(install.output)}`)
  }

  return "의존성 설치 완료"
}

async function getChangedFiles(state: SprintThreadState) {
  const result = await mustRun("git", ["diff", "--name-only", "main...HEAD"], state.worktreePath)
  return result.output.split(/\r?\n/).filter(Boolean)
}

function getValidationCommands(files: string[]) {
  const commands: Array<[string, string[]]> = [["git", ["diff", "--check", "main...HEAD"]]]
  const touchesUi = files.some((file) => file.startsWith("packages/ui/"))
  const touchesWeb = files.some((file) => file.startsWith("apps/web/"))
  const touchesApi = files.some((file) => file.startsWith("apps/api/"))
  const touchesMobile = files.some((file) => file.startsWith("apps/mobile/"))
  const touchesShared = files.some(
    (file) =>
      file.startsWith("packages/contracts/") ||
      file.startsWith("packages/app-core/") ||
      file === "package.json" ||
      file === "pnpm-lock.yaml" ||
      file === "turbo.json" ||
      file === "pnpm-workspace.yaml",
  )

  if (touchesUi) {
    commands.push(
      ["pnpm", ["--filter", "@workspace/ui", "lint"]],
      ["pnpm", ["--filter", "@workspace/ui", "typecheck"]],
      ["pnpm", ["--filter", "web", "lint"]],
      ["pnpm", ["--filter", "web", "typecheck"]],
      ["pnpm", ["--filter", "web", "build"]],
    )
    return commands
  }

  if (touchesWeb) {
    commands.push(
      ["pnpm", ["--filter", "web", "lint"]],
      ["pnpm", ["--filter", "web", "typecheck"]],
      ["pnpm", ["--filter", "web", "test"]],
      ["pnpm", ["--filter", "web", "build"]],
    )
  }

  if (touchesApi) {
    commands.push(
      ["pnpm", ["--filter", "api", "lint"]],
      ["pnpm", ["--filter", "api", "typecheck"]],
      ["pnpm", ["--filter", "api", "test"]],
      ["pnpm", ["--filter", "api", "build"]],
    )
  }

  if (touchesMobile) {
    commands.push(
      ["pnpm", ["--filter", "mobile", "lint"]],
      ["pnpm", ["--filter", "mobile", "typecheck"]],
      ["pnpm", ["--filter", "mobile", "build"]],
    )
  }

  if (touchesShared) {
    commands.push(["pnpm", ["lint"]], ["pnpm", ["typecheck"]])
  }

  return commands
}

async function runValidation(worktreePath: string, files: string[]) {
  const results: CommandResult[] = []

  for (const [command, args] of getValidationCommands(files)) {
    const result = await run(command, args, worktreePath)
    results.push(result)

    if (!result.ok) {
      throw new Error(`${result.command}\n${summarizeOutput(result.output)}`)
    }
  }

  return results.map((result) => result.command)
}

async function ensureCleanMain(repoRoot: string) {
  const status = await mustRun("git", ["status", "--porcelain"], repoRoot)

  if (status.output) {
    throw new Error(`local main 작업공간이 clean하지 않아요.\n${status.output}`)
  }
}

export async function runMainMergeOperator({ repoRoot, state }: MergeOperatorParams) {
  await ensureCleanMain(repoRoot)
  const worktreeCommitLine = await ensureWorktreeCommit(state)
  const dependencyLine = await ensureDependencies(state.worktreePath)
  const files = await getChangedFiles(state)
  const validationCommands = await runValidation(state.worktreePath, files)

  await ensureCleanMain(repoRoot)
  const merge = await run("git", ["merge", "--no-edit", state.branchName], repoRoot)

  if (!merge.ok) {
    await run("git", ["merge", "--abort"], repoRoot)
    throw new Error(`main merge 충돌이나 실패가 있어요.\n${summarizeOutput(merge.output)}`)
  }

  const latestCommit = await mustRun("git", ["log", "--oneline", "--max-count=1"], repoRoot)

  return {
    reply: [
      "반영을 마쳤어요.",
      `- ${worktreeCommitLine}`,
      ...(dependencyLine ? [`- ${dependencyLine}`] : []),
      `- 검증: ${validationCommands.join(", ")}`,
      `- main: ${latestCommit.output}`,
    ].join("\n"),
  }
}
