/* eslint-disable turbo/no-undeclared-env-vars */

import { execFile } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import type { SprintStage, SprintStatus } from "./types.js"

const execFileAsync = promisify(execFile)
const CODEX_MODEL = process.env.DISCORD_CODEX_MODEL?.trim() || "gpt-5.4"
const CODEX_TIMEOUT_MS = Number(process.env.DISCORD_CODEX_TIMEOUT_MS ?? 120000)

function looksLikeExploratoryDiscoveryQuestion(content: string) {
  const normalized = content.toLowerCase()

  return [
    "다른 서비스",
    "경쟁",
    "사례",
    "goal",
    "목표",
    "지표",
    "kpi",
    "유저 플로우",
    "flow",
    "어떻게 정",
    "어떻게 잡",
    "비교",
    "장단점",
    "정책",
    "전략",
    "포지션",
    "언제",
    "왜",
    "법",
    "무료",
    "요금",
    "pricing",
    "세션",
    "보안",
    "로그",
    "로깅",
    "이벤트",
    "analytics",
    "추적",
  ].some((token) => normalized.includes(token))
}

function stageGuide(stage: SprintStage) {
  switch (stage) {
    case "DISCOVERY_WORKSHOP":
      return [
        "지금은 Discovery 단계다.",
        "사용자와 같이 의사결정을 내려야 한다.",
        "지금은 PM처럼 기획을 구체화하는 대화가 중요하다.",
        "문제를 어떻게 정의할지, 목표를 어떻게 둘지, 다른 선택지와 비교하면 어떤지까지 같이 생각한다.",
        "이미 했던 말을 그대로 반복하지 말고, 최신 질문에 맞게 답한다.",
      ].join("\n")
    case "DEMO_REVIEW":
      return [
        "지금은 Demo Review 단계다.",
        "완성도 평가보다 기능 진입점, 화면 흐름, 완료/취소 위치, 디자인 일관성 확인이 중요하다.",
        "유지할 것, 바꿀 것, 지금 바로 결정할 것을 나눠서 말한다.",
      ].join("\n")
    case "PREVIEW_REVIEW":
      return [
        "지금은 Preview Review 단계다.",
        "배포된 결과를 보고 수정할지, 이대로 반영할지 함께 정하는 단계다.",
        "눈에 띄는 문제, 수정 우선순위, 지금 반영해도 되는지 판단을 같이 준다.",
      ].join("\n")
    case "DESIGN_PACK":
    case "DEMO_BUILD":
    case "TECHNICAL_FREEZE":
    case "IMPLEMENTATION":
    case "MERGE":
      return [
        "지금은 AI가 주도하는 자동 진행 단계다.",
        "사용자가 질문하면 직접 답한다.",
        "진행 상태만 반복하지 말고, 질문에 필요한 핵심 판단을 준다.",
      ].join("\n")
    case "DONE":
      return "이미 완료된 스프린트다. 필요하면 짧게 회고나 다음 포인트를 말한다."
  }
}

function responseStyleGuide(params: { stage: SprintStage; latestMessage: string }) {
  if (params.stage === "DISCOVERY_WORKSHOP") {
    if (looksLikeExploratoryDiscoveryQuestion(params.latestMessage)) {
      return [
        "이번 질문은 탐색형 Discovery 질문이다.",
        "너무 빨리 결론만 내리지 말고, 맥락을 넓혀서 생각한다.",
        "필요하면 아래 중 맞는 것만 골라서 쓴다.",
        "- 문제 정의",
        "- 사용자 관점 해석",
        "- 보통 다른 서비스가 택하는 방식",
        "- 선택지 비교",
        "- 추천 목표/성공지표",
        "- 지금 확정할 것과 나중에 미뤄도 되는 것",
        "섹션은 꼭 고정하지 말고 질문에 맞게 자연스럽게 구성한다.",
        "내용이 필요하면 평소보다 조금 길어져도 된다.",
      ].join("\n")
    }

    return [
      "이번 질문은 일반 Discovery 질문이다.",
      "결론을 먼저 말하되, 필요하면 이유와 다음 결정 포인트를 붙인다.",
      "짧게 끝낼 수 있으면 짧게 끝낸다.",
    ].join("\n")
  }

  if (params.stage === "DEMO_REVIEW") {
    return [
      "지금은 Demo Review다.",
      "완성도 감상보다 진입점, 화면 이동, 완료/취소 상태, 디자인 시스템 일관성을 중심으로 답한다.",
    ].join("\n")
  }

  if (params.stage === "PREVIEW_REVIEW") {
    return [
      "지금은 Preview Review다.",
      "배포 링크에서 본 문제를 기준으로 수정할 것과 지금 반영해도 되는 것을 나눠서 답한다.",
      "필요하면 우선순위까지 짧게 정리한다.",
    ].join("\n")
  }

  return [
    "자동 진행 단계다.",
    "질문에 직접 답하고, 필요하면 현재 진행과 연결해서 짧게 설명한다.",
  ].join("\n")
}

function buildPrompt(params: {
  sprintId: string
  featureSlug: string
  stage: SprintStage
  status: SprintStatus
  transcript: string
  latestMessage: string
}) {
  return [
    "너는 toda-calendar Discord 스프린트 스레드에 붙은 Codex 대화 브릿지다.",
    "이번 작업은 대화 응답만 하는 것이고, 파일을 수정하거나 구현하지 않는다.",
    "한국어로만 답한다.",
    "토스 라이팅 원칙처럼 짧고 분명하게 쓴다.",
    "애매한 빈말, 메타 설명, 내부 도구 설명은 하지 않는다.",
    "반드시 최신 사용자 질문에 직접 답한다.",
    "이전 답을 반복하지 말고, 필요하면 그 위에 새로운 판단을 쌓는다.",
    "이 환경에서는 웹 검색이나 외부 조사 도구를 쓸 수 없다.",
    "절대로 `web search:` 같은 문구를 출력하지 않는다.",
    "실시간 법률 검토나 최신 요금 확인이 필요한 질문이어도, 현재 문맥과 일반적인 제품/보안 원칙 안에서 답한다.",
    "최신 정보 확정이 필요하면 단정하지 말고 `이건 따로 확인이 필요하다`고 짧게 밝힌다.",
    "",
    `스프린트: ${params.sprintId}/${params.featureSlug}`,
    `현재 단계: ${params.stage}`,
    `현재 상태: ${params.status}`,
    "",
    stageGuide(params.stage),
    "",
    responseStyleGuide(params),
    "",
    "답변 형식 규칙",
    "- 첫 문장에서 바로 결론이나 추천을 말한다.",
    "- Discovery에서는 질문에 따라 더 풍부하게 설명해도 된다.",
    "- 필요하면 `이유`, `추천안`, `선택지 비교`, `다른 서비스 패턴`, `목표/지표`, `지금 정할 것` 중 맞는 것만 쓴다.",
    "- 매번 같은 섹션 이름을 반복하지 않는다.",
    "- 표는 쓰지 않는다.",
    "- 같은 문장을 반복하지 않는다.",
    "- 일반적으로는 6~14줄 정도를 선호하지만, Discovery 탐색 질문은 더 길어져도 괜찮다.",
    "- 외부 사실을 확신할 수 없으면 `보통은`, `일반적으로는`처럼 불확실성을 드러낸다.",
    "",
    "최근 스레드 문맥",
    params.transcript || "없음",
    "",
    "최신 사용자 메시지",
    params.latestMessage,
  ].join("\n")
}

function shellEscape(value: string) {
  return `'${value.replace(/'/g, `'"'"'`)}'`
}

function stageSummaryGuide(stage: SprintStage) {
  switch (stage) {
    case "DISCOVERY_WORKSHOP":
      return [
        "- 문제 정의와 왜 지금 해야 하는지",
        "- 목표 또는 성공 지표",
        "- 이번 스프린트 범위와 비범위",
        "- 중요 정책 결정이나 선호 방향",
      ].join("\n")
    case "DESIGN_PACK":
      return [
        "- 핵심 사용자 흐름",
        "- 기능 진입점",
        "- 꼭 필요한 화면 또는 상태",
        "- 데모에서 확인할 포인트",
      ].join("\n")
    case "DEMO_BUILD":
      return [
        "- `/design-system` 데모 위치",
        "- 사용자가 기능에 진입하는 지점",
        "- 화면 사이 이동과 완료/취소 상태",
        "- 디자인 시스템 컴포넌트와 토큰 사용",
      ].join("\n")
    case "DEMO_REVIEW":
      return [
        "- 유지할 것",
        "- 바꿀 것",
        "- 지금 확정한 방향",
      ].join("\n")
    case "PREVIEW_REVIEW":
      return [
        "- preview에서 확인한 핵심 이슈",
        "- 바로 고칠 것",
        "- 이대로 반영 가능한지 여부",
      ].join("\n")
    case "TECHNICAL_FREEZE":
      return [
        "- 구현 범위와 surface ownership",
        "- auth/data/contracts 같은 핵심 기술 결정",
        "- 검증 계획",
      ].join("\n")
    case "IMPLEMENTATION":
      return [
        "- 실제로 바뀐 영역",
        "- 검증 결과",
        "- 남은 리스크 또는 follow-up",
      ].join("\n")
    case "MERGE":
      return [
        "- 반영 결과",
        "- 남은 확인 사항",
        "- 다음 운영 포인트",
      ].join("\n")
    case "DONE":
      return "- 최종 결과와 후속 작업"
  }
}

function extractReplyFromStdout(stdout: string) {
  const trimmed = stdout.trim()

  if (!trimmed) {
    return ""
  }

  const tokensMarker = "\ntokens used\n"
  const tokensIndex = trimmed.lastIndexOf(tokensMarker)

  if (tokensIndex !== -1) {
    const afterTokens = trimmed.slice(tokensIndex + tokensMarker.length)
    const lines = afterTokens.split(/\r?\n/)

    if (lines.length >= 2 && /^[\d,]+$/.test(lines[0]?.trim() ?? "")) {
      return lines.slice(1).join("\n").trim()
    }
  }

  const codexMarker = "\ncodex\n"
  const codexIndex = trimmed.lastIndexOf(codexMarker)

  if (codexIndex !== -1) {
    return trimmed.slice(codexIndex + codexMarker.length).trim()
  }

  return trimmed
}

function extractThreadIdFromJson(stdout: string) {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as { type?: string; thread_id?: string }

      if (parsed.type === "thread.started" && parsed.thread_id) {
        return parsed.thread_id
      }
    } catch {
      continue
    }
  }

  return ""
}

function buildResumePrompt(params: {
  sprintId: string
  featureSlug: string
  stage: SprintStage
  status: SprintStatus
  latestMessage: string
}) {
  return [
    "이전 Discord 스프린트 대화를 이어간다.",
    "반드시 최신 사용자 질문에 직접 답한다.",
    "한국어로만 답한다.",
    "토스 라이팅 원칙처럼 짧고 분명하게 쓴다.",
    "이미 했던 말을 반복하지 말고, 필요하면 그 위에 새로운 판단을 쌓는다.",
    `스프린트: ${params.sprintId}/${params.featureSlug}`,
    `현재 단계: ${params.stage}`,
    `현재 상태: ${params.status}`,
    "",
    responseStyleGuide({ stage: params.stage, latestMessage: params.latestMessage }),
    "",
    "최신 사용자 메시지",
    params.latestMessage,
  ].join("\n")
}

function buildStageTransitionSummaryPrompt(params: {
  sprintId: string
  featureSlug: string
  fromStage: SprintStage
  toStage?: SprintStage
  transcript: string
  stageReply?: string
}) {
  return [
    "너는 toda-calendar Discord 스프린트의 handoff summary 작성기다.",
    "한 단계가 끝나고 다음 단계로 넘길 때, 이미 결정된 내용을 짧게 요약한다.",
    "한국어로만 쓴다.",
    "토스 라이팅 원칙처럼 짧고 분명하게 쓴다.",
    "반드시 bullet만 출력한다.",
    "각 줄은 `- `로 시작한다.",
    "3~6개 bullet만 쓴다.",
    "표, 번호 목록, 서론, 결론 문장은 쓰지 않는다.",
    "상태 안내 문구나 반복적인 운영 메시지는 무시한다.",
    "실제로 결정되었거나 거의 합의된 내용만 쓴다.",
    "아직 열린 쟁점이 하나 있다면 마지막 bullet에 `- 남은 쟁점: ...` 형식으로 적는다.",
    "",
    `스프린트: ${params.sprintId}/${params.featureSlug}`,
    `요약할 단계: ${params.fromStage}`,
    `다음 단계: ${params.toStage ?? "없음"}`,
    "",
    "이 단계에서 특히 챙길 것",
    stageSummaryGuide(params.fromStage),
    "",
    "최근 stage 문맥",
    params.transcript || "없음",
    "",
    "자동 작업 결과 요약",
    params.stageReply?.trim() || "없음",
  ].join("\n")
}

export type CodexDiscussionResult = {
  reply: string
  sessionId: string
  mode: "created" | "resumed"
}

export async function runCodexStageTransitionSummary(params: {
  repoRoot: string
  sprintId: string
  featureSlug: string
  fromStage: SprintStage
  toStage?: SprintStage
  transcript: string
  stageReply?: string
}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "discord-codex-summary-"))
  const inputFile = path.join(tempDir, "prompt.txt")
  const outputFile = path.join(tempDir, "last-message.txt")
  const prompt = buildStageTransitionSummaryPrompt(params)
  fs.writeFileSync(inputFile, prompt, "utf8")

  try {
    const command = [
      "codex exec",
      `-m ${shellEscape(CODEX_MODEL)}`,
      `-C ${shellEscape(params.repoRoot)}`,
      "--sandbox read-only",
      "--color never",
      `-o ${shellEscape(outputFile)}`,
      "-",
      `< ${shellEscape(inputFile)}`,
    ].join(" ")

    const { stdout } = await execFileAsync(
      "/bin/bash",
      ["-lc", command],
      {
        cwd: params.repoRoot,
        timeout: 60_000,
        maxBuffer: 10 * 1024 * 1024,
      },
    )

    if (fs.existsSync(outputFile)) {
      return fs.readFileSync(outputFile, "utf8").trim()
    }

    return extractReplyFromStdout(stdout)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

export async function runCodexDiscussionReply(params: {
  repoRoot: string
  sprintId: string
  featureSlug: string
  stage: SprintStage
  status: SprintStatus
  transcript: string
  latestMessage: string
  sessionId?: string
}): Promise<CodexDiscussionResult> {
  const latestMessage = params.latestMessage.trim()
  const latestMessageCompact = latestMessage.length > 400 ? `${latestMessage.slice(0, 397)}...` : latestMessage
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "discord-codex-"))
  const inputFile = path.join(tempDir, "prompt.txt")
  const outputFile = path.join(tempDir, "last-message.txt")
  const prompt = params.sessionId
    ? buildResumePrompt(params)
    : buildPrompt(params)
  fs.writeFileSync(inputFile, prompt, "utf8")

  try {
    const command = params.sessionId
      ? [
          "codex exec resume",
          "--json",
          `-m ${shellEscape(CODEX_MODEL)}`,
          `-o ${shellEscape(outputFile)}`,
          shellEscape(params.sessionId),
          "-",
          `< ${shellEscape(inputFile)}`,
        ].join(" ")
      : [
          "codex exec",
          "--json",
          `-m ${shellEscape(CODEX_MODEL)}`,
          `-C ${shellEscape(params.repoRoot)}`,
          "--sandbox read-only",
          "--color never",
          `-o ${shellEscape(outputFile)}`,
          "-",
          `< ${shellEscape(inputFile)}`,
        ].join(" ")

    const { stdout } = await execFileAsync(
      "/bin/bash",
      ["-lc", command],
      {
        cwd: params.repoRoot,
        timeout: CODEX_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024,
      },
    )

    const sessionIdFromJson = extractThreadIdFromJson(stdout)
    const resolvedSessionId = sessionIdFromJson || params.sessionId || ""

    if (!fs.existsSync(outputFile)) {
      const stdoutReply = extractReplyFromStdout(stdout)

      if (stdoutReply) {
        console.error(`[discord-bridge] codex reply via stdout (${params.sprintId}/${params.featureSlug} ${params.stage}, ${params.sessionId ? "resumed" : "created"}): ${latestMessageCompact}`)
        return {
          reply: stdoutReply,
          sessionId: resolvedSessionId,
          mode: params.sessionId ? "resumed" : "created",
        }
      }

      throw new Error("Codex did not produce an output file.")
    }

    const reply = fs.readFileSync(outputFile, "utf8").trim()
    console.error(`[discord-bridge] codex reply via output file (${params.sprintId}/${params.featureSlug} ${params.stage}, ${params.sessionId ? "resumed" : "created"}): ${latestMessageCompact}`)
    return {
      reply,
      sessionId: resolvedSessionId,
      mode: params.sessionId ? "resumed" : "created",
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}
