/* eslint-disable turbo/no-undeclared-env-vars */

import { execFile } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import type { SprintReferenceAttachment, SprintThreadState } from "./types.js"

const execFileAsync = promisify(execFile)
const CODEX_MODEL = process.env.DISCORD_CODEX_MODEL?.trim() || "gpt-5.4"

function readPositiveNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

const DESIGN_SYSTEM_TIMEOUT_MS = readPositiveNumberEnv("DISCORD_DESIGN_SYSTEM_TIMEOUT_MS", 90 * 60_000)

export function getDesignSystemStageTimeoutMs() {
  return DESIGN_SYSTEM_TIMEOUT_MS
}

function shellEscape(value: string) {
  return `'${value.replace(/'/g, `'"'"'`)}'`
}

function isImageReference(reference: SprintReferenceAttachment) {
  if (reference.contentType?.startsWith("image/")) {
    return true
  }

  return /\.(png|jpe?g|webp|gif)$/i.test(reference.name)
}

function safeFileName(reference: SprintReferenceAttachment, index: number) {
  const ext = path.extname(reference.name) || ".png"
  const base = path
    .basename(reference.name, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return `${String(index + 1).padStart(2, "0")}-${base || "reference"}${ext}`
}

async function downloadReferenceImages(references: SprintReferenceAttachment[], tempDir: string) {
  const imageDir = path.join(tempDir, "images")
  fs.mkdirSync(imageDir, { recursive: true })
  const imagePaths: string[] = []

  for (const [index, reference] of references.filter(isImageReference).entries()) {
    try {
      const response = await fetch(reference.url)

      if (!response.ok) {
        continue
      }

      const filePath = path.join(imageDir, safeFileName(reference, index))
      const buffer = Buffer.from(await response.arrayBuffer())
      fs.writeFileSync(filePath, buffer)
      imagePaths.push(filePath)
    } catch {
      continue
    }
  }

  return imagePaths
}

function formatReferenceList(references: SprintReferenceAttachment[]) {
  if (references.length === 0) {
    return "없음"
  }

  return references
    .map((reference) =>
      [
        `- ${reference.name}`,
        `  - type: ${reference.contentType ?? "unknown"}`,
        `  - size: ${reference.size ?? "unknown"}`,
        `  - url: ${reference.url}`,
      ].join("\n"),
    )
    .join("\n")
}

function buildDesignSystemPrompt(params: {
  state: SprintThreadState
  transcript: string
  references: SprintReferenceAttachment[]
}) {
  const exampleSlug = params.state.featureSlug

  return [
    "너는 toda-calendar 디자인 시스템 전문 구현 agent다.",
    "사용자가 Discord에 올린 스크린샷, 설명, 참고 자료를 바탕으로 실제 `/design-system/examples` 예제를 만든다.",
    "답변은 한국어로만 한다.",
    "",
    "핵심 원칙",
    "- 스크린샷이 앱 페이지라면 같은 레이아웃과 핵심 동작을 가진 page example을 만든다.",
    "- 기존 목적이 같은 컴포넌트가 있으면 반드시 먼저 재사용한다.",
    "- 기존 컴포넌트와 거의 같지만 형태만 조금 다르면 새 컴포넌트보다 기존 컴포넌트 variant 추가를 우선한다.",
    "- 정말 없는 패턴이면 `packages/ui/src/components`에 작고 범용적인 컴포넌트를 추가한다.",
    "- 토큰이 필요한 경우 `packages/ui/src/styles/globals.css`나 `packages/ui/src/lib/design-system.ts`의 기존 체계와 맞춰 최소로 추가한다.",
    "- 디자인 시스템 예제는 production data, API, auth, persistence에 의존하지 않는다.",
    "- 화면만 비슷하게 베끼는 데서 멈추지 말고, entry point, 상태 변화, fallback, interaction contract를 `demo.json`에 기록한다.",
    "",
    "반드시 확인할 경로",
    "- `apps/web/app/design-system`",
    "- `apps/web/app/design-system/examples`",
    "- `apps/web/features/design-system`",
    "- `packages/ui/src/components`",
    "- `packages/ui/src/lib/design-system.ts`",
    "- `packages/ui/src/styles/globals.css`",
    "- `packages/ui/package.json`",
    "",
    "구현 대상",
    `- example slug: ${exampleSlug}`,
    `- example route: /design-system/examples/${exampleSlug}`,
    `- example folder: apps/web/app/design-system/examples/${exampleSlug}`,
    "",
    "완료 기준",
    "- `demo.json`과 `page.tsx`를 만든다.",
    "- 페이지 스크린샷이면 실제 page layout이 review 가능한 수준으로 구현되어 있다.",
    "- 필요한 shared UI variant/component/token 변경이 있다면 함께 반영한다.",
    "- 가능하면 `pnpm --filter web lint`와 `pnpm --filter web typecheck`를 실행한다.",
    "- 검증을 못 돌렸거나 실패하면 원인을 마지막 답변에 남긴다.",
    "",
    "초기 brief",
    params.state.sourceBrief?.trim() || "없음",
    "",
    "Discord 문맥",
    params.transcript || "없음",
    "",
    "참고 첨부",
    formatReferenceList(params.references),
    "",
    "마지막 답변 형식",
    "- 첫 줄: `디자인 시스템 example을 준비했어요.`",
    "- 다음 줄들: 생성/수정한 route, 주요 컴포넌트/variant/token 판단, 검증 결과, 남은 리스크",
  ].join("\n")
}

function buildMergePrompt(params: { state: SprintThreadState; transcript: string }) {
  return [
    "너는 toda-calendar 디자인 시스템 example의 main 반영을 맡은 agent다.",
    "현재 worktree 결과를 점검하고, 안전하면 local main 반영을 준비하거나 진행한다.",
    "한국어로만 답한다.",
    "",
    "규칙",
    "- 먼저 변경 범위와 검증 상태를 확인한다.",
    "- local main이나 repo root에 무관한 변경이 있으면 억지로 merge하지 말고 blocker로 남긴다.",
    "- 안전하게 반영할 수 있을 때만 진행한다.",
    "- destructive git 명령은 쓰지 않는다.",
    "- commit 메시지는 `feat(design-system): add <slug> example` 형식을 우선한다.",
    "",
    `- example slug: ${params.state.featureSlug}`,
    `- branch: ${params.state.branchName}`,
    `- worktree path: ${params.state.worktreePath}`,
    "",
    "최근 Discord 문맥",
    params.transcript || "없음",
    "",
    "마지막 답변 형식",
    "- 첫 줄: `반영을 마쳤어요.` 또는 `여기서 사람이 확인해야 해요.`",
    "- 다음 줄들: 반영 결과 또는 blocker, 검증 결과, 후속 확인 사항",
  ].join("\n")
}

export async function runDesignSystemStageWorker(params: {
  worktreePath: string
  state: SprintThreadState
  transcript: string
  references: SprintReferenceAttachment[]
  signal?: AbortSignal
}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "discord-design-system-worker-"))
  const inputFile = path.join(tempDir, "prompt.txt")
  const outputFile = path.join(tempDir, "last-message.txt")

  try {
    const imagePaths = await downloadReferenceImages(params.references, tempDir)
    const prompt =
      params.state.stage === "MERGE"
        ? buildMergePrompt({ state: params.state, transcript: params.transcript })
        : buildDesignSystemPrompt({
            state: params.state,
            transcript: params.transcript,
            references: params.references,
          })

    fs.writeFileSync(inputFile, prompt, "utf8")

    const imageArgs = imagePaths.map((filePath) => `--image ${shellEscape(filePath)}`)
    const command = [
      "codex exec",
      `-m ${shellEscape(CODEX_MODEL)}`,
      `-C ${shellEscape(params.worktreePath)}`,
      "--full-auto",
      "--ephemeral",
      "--color never",
      `-o ${shellEscape(outputFile)}`,
      ...imageArgs,
      "-",
      `< ${shellEscape(inputFile)}`,
    ].join(" ")

    await execFileAsync("/bin/bash", ["-lc", command], {
      cwd: params.worktreePath,
      timeout: getDesignSystemStageTimeoutMs(),
      maxBuffer: 10 * 1024 * 1024,
      signal: params.signal,
    })

    return {
      reply: fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8").trim() : "디자인 시스템 example 작업을 끝냈어요.",
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}
