import path from "node:path"
import fs from "node:fs"
import { execFileSync } from "node:child_process"

function slugifyPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function getSprintKey(sprintId: string, featureSlug: string) {
  return `${slugifyPart(sprintId)}-${slugifyPart(featureSlug)}`
}

export function getRunSprintKey(baseSprintKey: string, runNumber: number) {
  if (runNumber <= 1) {
    return baseSprintKey
  }

  return `${baseSprintKey}-${runNumber}`
}

export function getBranchName(runSprintKey: string) {
  return `codex/${runSprintKey}`
}

export function getWorktreeName(runSprintKey: string) {
  return runSprintKey
}

export function getWorktreePath(worktreeRoot: string, worktreeName: string) {
  return path.join(worktreeRoot, worktreeName)
}

function git(args: string[], cwd: string) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim()
}

function branchExists(repoRoot: string, branchName: string) {
  try {
    git(["show-ref", "--verify", `refs/heads/${branchName}`], repoRoot)
    return true
  } catch {
    return false
  }
}

export function ensureGitWorktree(params: {
  repoRoot: string
  branchName: string
  worktreePath: string
}) {
  const { repoRoot, branchName, worktreePath } = params
  const gitDir = path.join(worktreePath, ".git")

  if (fs.existsSync(gitDir)) {
    return
  }

  fs.mkdirSync(path.dirname(worktreePath), { recursive: true })

  if (fs.existsSync(worktreePath) && fs.readdirSync(worktreePath).length > 0) {
    throw new Error(`worktree path already exists and is not empty: ${worktreePath}`)
  }

  const args = branchExists(repoRoot, branchName)
    ? ["worktree", "add", worktreePath, branchName]
    : ["worktree", "add", "-b", branchName, worktreePath, "HEAD"]

  git(args, repoRoot)
}
