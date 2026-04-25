import fs from "node:fs"
import path from "node:path"

import type { SprintThreadState } from "./types.js"

const TEMPLATE_PATH = "/Users/kimyoukwon/Desktop/toda-calendar/docs/sprints/templates/sprint-feature.md"

export function getSprintDocRelativePath(state: SprintThreadState) {
  return path.join("docs", "sprints", state.sprintId, `${state.sprintId}-${state.featureSlug}.md`)
}

export function getSprintDocAbsolutePath(worktreePath: string, state: SprintThreadState) {
  return path.join(worktreePath, getSprintDocRelativePath(state))
}

export function getSprintAssetsDirRelativePath(state: SprintThreadState) {
  return path.join("docs", "sprints", state.sprintId, "assets", state.featureSlug)
}

export function getSprintAssetsDirAbsolutePath(worktreePath: string, state: SprintThreadState) {
  return path.join(worktreePath, getSprintAssetsDirRelativePath(state))
}

export function ensureSprintDoc(worktreePath: string, state: SprintThreadState) {
  const docPath = getSprintDocAbsolutePath(worktreePath, state)

  if (fs.existsSync(docPath)) {
    return docPath
  }

  fs.mkdirSync(path.dirname(docPath), { recursive: true })
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8")
  const filled = template.replaceAll("<sprint-id>", state.sprintId).replaceAll("<feature-slug>", state.featureSlug)
  fs.writeFileSync(docPath, `${filled}\n`, "utf8")
  return docPath
}

export function ensureSprintAssetsDir(worktreePath: string, state: SprintThreadState) {
  const assetsDir = getSprintAssetsDirAbsolutePath(worktreePath, state)
  fs.mkdirSync(assetsDir, { recursive: true })
  return assetsDir
}
