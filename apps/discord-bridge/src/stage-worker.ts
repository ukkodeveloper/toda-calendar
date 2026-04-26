/* eslint-disable turbo/no-undeclared-env-vars */

import { execFile } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import type { SprintStage, SprintThreadState } from "./types.js"
import { ensureSprintAssetsDir, ensureSprintDoc, getSprintAssetsDirRelativePath, getSprintDocRelativePath } from "./sprint-files.js"

const execFileAsync = promisify(execFile)
const CODEX_MODEL = process.env.DISCORD_CODEX_MODEL?.trim() || "gpt-5.4"

function readPositiveNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

const DEFAULT_CODEX_STAGE_TIMEOUT_MS = readPositiveNumberEnv("DISCORD_CODEX_STAGE_TIMEOUT_MS", 90 * 60_000)
const SHORT_CODEX_STAGE_TIMEOUT_MS = readPositiveNumberEnv("DISCORD_CODEX_SHORT_STAGE_TIMEOUT_MS", 5 * 60_000)

function shellEscape(value: string) {
  return `'${value.replace(/'/g, `'"'"'`)}'`
}

export function getCodexStageTimeoutMs(stage: SprintStage) {
  switch (stage) {
    case "DESIGN_PACK":
    case "DEMO_BUILD":
    case "IMPLEMENTATION":
    case "MERGE":
      return DEFAULT_CODEX_STAGE_TIMEOUT_MS
    case "TECHNICAL_FREEZE":
    case "PREVIEW_REVIEW":
    default:
      return SHORT_CODEX_STAGE_TIMEOUT_MS
  }
}

function stageTaskLabel(stage: SprintStage) {
  switch (stage) {
    case "DESIGN_PACK":
      return "핵심 흐름 정리"
    case "DEMO_BUILD":
      return "데모 구현"
    case "TECHNICAL_FREEZE":
      return "기술 범위 확정"
    case "IMPLEMENTATION":
      return "구현"
    case "PREVIEW_REVIEW":
      return "배포 확인"
    case "MERGE":
      return "반영"
    default:
      return stage
  }
}

function buildStagePrompt(params: {
  state: SprintThreadState
  worktreePath: string
  transcript: string
}) {
  const sprintDocPath = getSprintDocRelativePath(params.state)
  const assetsDir = getSprintAssetsDirRelativePath(params.state)

  const common = [
    "너는 toda-calendar Discord sprint의 자동 작업 워커다.",
    "대상 기능을 실제로 진행해야 한다.",
    "답변은 한국어로만 한다.",
    "토스 라이팅 원칙처럼 짧고 분명하게 쓴다.",
    "마지막 답변에는 작업 요약만 남긴다.",
    `스프린트: ${params.state.sprintId}/${params.state.featureSlug}`,
    `현재 단계: ${params.state.stage}`,
    `작업 루트: ${params.worktreePath}`,
    `스프린트 문서: ${sprintDocPath}`,
    `에셋 디렉터리: ${assetsDir}`,
    "",
    "공통 규칙",
    "- 필요한 파일을 직접 읽고 수정한다.",
    "- 스프린트 문서는 반드시 최신 상태로 갱신한다.",
    "- 불필요한 범위 확장은 하지 않는다.",
    "- 막히는 점이 있으면 숨기지 말고 마지막 답변에 명확히 적는다.",
    "",
    "최근 Discord 문맥",
    params.transcript || "없음",
  ]

  switch (params.state.stage) {
    case "DESIGN_PACK":
      return [
        ...common,
        "",
        "이번 단계 목표",
        "- Discovery 대화를 바탕으로 스프린트 문서의 `Discovery`, `PRD Lite`, `UX Decisions`를 정리한다.",
        "- 정말 애매한 핵심 경로만 좁혀서 정리한다.",
        "- 필요하면 assets 디렉터리에 아주 가벼운 Mermaid/Markdown 자료를 만든다.",
        "- 아직 제품 코드 구현은 하지 않는다.",
        "",
        "완료 기준",
        "- Demo Build 전에 봐야 할 핵심 흐름이 문서에 정리되어 있다.",
        "- 사용자가 어떤 진입점과 화면 3~5개를 확인하면 되는지 분명하다.",
        "",
        "마지막 답변 형식",
        "- 첫 줄: `핵심 흐름 정리를 끝냈어요.`",
        "- 다음 줄들: 무엇을 정리했는지, 확인할 파일 경로, 데모 구현 준비 여부",
      ].join("\n")
    case "DEMO_BUILD":
      return [
        ...common,
        "",
        "이번 단계 목표",
        `- 스프린트 데모를 \`/design-system/examples/${params.state.sprintKey}\`에서 확인 가능하게 만든다.`,
        "- 데모는 예쁜 화면 하나가 아니라, 기능 진입점부터 완료/취소 이후 위치까지 이어지는 작은 사용 시나리오여야 한다.",
        "- 새 데모는 `apps/web/app/design-system/examples/<sprint-key>/` 아래에 고유 폴더로 만든다.",
        "- 새 데모 폴더에는 최소 `demo.json`과 `page.tsx`를 둔다.",
        "- `page.tsx`는 기본적으로 `DemoExamplePage`를 재사용해도 되고, 꼭 필요한 경우에만 고유 UI를 만든다.",
        "- 고유 UI, helper, fixture, asset이 필요하면 같은 `<sprint-key>` 폴더 안에 둔다.",
        "- demo metadata에는 entryPoints, flowSteps, screens, designSystem, reviewChecklist를 채운다.",
        "- API, auth, persistence, production business logic은 넣지 않는다.",
        "- 디자인 시스템 컴포넌트와 토큰을 우선 쓰고, 새 패턴이 필요하면 reviewChecklist나 designSystem.notes에 남긴다.",
        "",
        "검증",
        "- 가능하면 `pnpm --filter web lint`와 `pnpm --filter web typecheck`를 실행한다.",
        "- 가능하면 `pnpm preview:vercel`을 실행해서 preview URL을 마지막 답변에 포함한다.",
        "- preview 배포가 환경 문제로 실패해도 demo route와 실패 원인을 명확히 남긴다.",
        "",
        "마지막 답변 형식",
        "- 첫 줄: `데모를 준비했어요.`",
        `- 다음 줄들: \`/design-system/examples/${params.state.sprintKey}\` 위치, 포함된 진입점/화면, 검증 결과, preview URL이 있으면 URL`,
      ].join("\n")
    case "TECHNICAL_FREEZE":
      return [
        ...common,
        "",
        "이번 단계 목표",
        "- 스프린트 문서의 `Technical Freeze`를 완성한다.",
        "- 구현 범위, surface ownership, shared contracts, validation plan, merge guardrails를 정리한다.",
        "- `Delivery Notes`의 초기 상태도 준비한다.",
        "- 아직 본격 제품 코드 수정은 하지 않는다.",
        "",
        "마지막 답변 형식",
        "- 첫 줄: `기술 범위를 확정했어요.`",
        "- 다음 줄들: 구현 범위 요약, 검증 계획 요약, 바로 구현 가능한지 여부",
      ].join("\n")
    case "IMPLEMENTATION":
      return [
        ...common,
        "",
        "이번 단계 목표",
        "- `docs/ai/pipeline.md`와 스프린트 문서의 `Technical Freeze`를 기준으로 기능을 실제 구현한다.",
        "- 필요한 코드 수정, 테스트/검증, Delivery Notes 갱신까지 처리한다.",
        "- 관련 lint, typecheck, test 중 필요한 최소 검증을 직접 실행한다.",
        "",
        "마지막 답변 형식",
        "- 첫 줄: `구현과 1차 검증을 끝냈어요.`",
        "- 다음 줄들: 바뀐 핵심, 검증 결과, 남은 리스크",
      ].join("\n")
    case "PREVIEW_REVIEW":
      return [
        ...common,
        "",
        "지금은 배포 확인 단계다.",
        "- 여기서는 실제 구현 작업을 하지 않는다.",
        "- 사용자가 preview에서 어떤 점을 다시 고치고 싶은지 정리하는 단계다.",
      ].join("\n")
    case "MERGE":
      return [
        ...common,
        "",
        "이번 단계 목표",
        "- preview 확인이 끝난 현재 worktree 결과를 local main에 안전하게 반영할 수 있는지 점검한다.",
        "- 가능한 경우 squash merge 준비 또는 실제 반영을 진행한다.",
        "- 반영이 어렵다면 정확한 blocker를 남긴다.",
        "",
        "추가 규칙",
        "- commit 메시지는 `feat(sprint번호/feature-slug): 기능 이름` 형식을 우선한다.",
        "- 로컬 main이 더럽거나 merge가 위험하면 억지로 진행하지 말고 blocker로 남긴다.",
        "",
        "마지막 답변 형식",
        "- 첫 줄: `반영을 마쳤어요.` 또는 `여기서 사람이 확인해야 해요.`",
        "- 다음 줄들: merge 결과 또는 blocker 요약",
      ].join("\n")
    default:
      return common.join("\n")
  }
}

export async function runCodexStageWorker(params: {
  worktreePath: string
  state: SprintThreadState
  transcript: string
  signal?: AbortSignal
}) {
  ensureSprintDoc(params.worktreePath, params.state)
  ensureSprintAssetsDir(params.worktreePath, params.state)

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "discord-stage-worker-"))
  const inputFile = path.join(tempDir, "prompt.txt")
  const outputFile = path.join(tempDir, "last-message.txt")
  const prompt = buildStagePrompt(params)
  fs.writeFileSync(inputFile, prompt, "utf8")

  try {
    const command = [
      "codex exec",
      `-m ${shellEscape(CODEX_MODEL)}`,
      `-C ${shellEscape(params.worktreePath)}`,
      "--full-auto",
      "--ephemeral",
      "--color never",
      `-o ${shellEscape(outputFile)}`,
      "-",
      `< ${shellEscape(inputFile)}`,
    ].join(" ")

    await execFileAsync("/bin/bash", ["-lc", command], {
      cwd: params.worktreePath,
      timeout: getCodexStageTimeoutMs(params.state.stage),
      maxBuffer: 10 * 1024 * 1024,
      signal: params.signal,
    })

    return {
      reply: fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8").trim() : `${stageTaskLabel(params.state.stage)} 작업을 끝냈어요.`,
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}
