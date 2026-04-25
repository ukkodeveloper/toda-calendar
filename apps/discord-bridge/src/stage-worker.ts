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

function shellEscape(value: string) {
  return `'${value.replace(/'/g, `'"'"'`)}'`
}

function timeoutForStage(stage: SprintStage) {
  switch (stage) {
    case "DESIGN_PACK":
      return 180_000
    case "TECHNICAL_FREEZE":
      return 180_000
    case "IMPLEMENTATION":
      return 900_000
    case "MERGE":
      return 600_000
    default:
      return 180_000
  }
}

function stageTaskLabel(stage: SprintStage) {
  switch (stage) {
    case "DESIGN_PACK":
      return "핵심 흐름 정리"
    case "TECHNICAL_FREEZE":
      return "기술 범위 확정"
    case "IMPLEMENTATION":
      return "구현"
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
        "- Demo Review 전에 봐야 할 핵심 흐름이 문서에 정리되어 있다.",
        "- 사용자가 어떤 화면 3~5개를 확인하면 되는지 분명하다.",
        "",
        "마지막 답변 형식",
        "- 첫 줄: `핵심 흐름 정리를 끝냈어요.`",
        "- 다음 줄들: 무엇을 정리했는지, 확인할 파일 경로, 데모 리뷰 준비 여부",
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
    case "MERGE":
      return [
        ...common,
        "",
        "이번 단계 목표",
        "- 현재 worktree 결과를 local main에 안전하게 반영할 수 있는지 점검한다.",
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
      timeout: timeoutForStage(params.state.stage),
      maxBuffer: 10 * 1024 * 1024,
    })

    return {
      reply: fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8").trim() : `${stageTaskLabel(params.state.stage)} 작업을 끝냈어요.`,
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}
