import fs from "node:fs"

import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  GatewayIntentBits,
  MessageFlags,
  Message,
  type Attachment,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type GuildTextBasedChannel,
  type ThreadChannel,
} from "discord.js"

import { loadEnv } from "./env.js"
import { BridgeHealthReporter } from "./health.js"
import { ensureRuntimeDir, getBridgeHealthFile, getBridgeJobLogFile } from "./runtime-files.js"
import { JobLogger } from "./job-log.js"
import { ThreadStore } from "./thread-store.js"
import type { SprintPreviewDeployment, SprintReferenceAttachment, SprintStage, SprintStageSummary, SprintStatus, SprintThreadState } from "./types.js"
import { getBranchName, getRunSprintKey, getSprintKey, getWorktreeName, getWorktreePath, ensureGitWorktree } from "./worktree.js"
import { runCodexDiscussionReply, runCodexStageTransitionSummary } from "./codex-runner.js"
import { runVercelPreviewDeployment } from "./preview-deployer.js"
import { getCodexStageTimeoutMs, runCodexStageWorker } from "./stage-worker.js"
import { getDesignSystemStageTimeoutMs, runDesignSystemStageWorker } from "./design-system-worker.js"
import { runMainMergeOperator } from "./merge-operator.js"
import { getSprintAssetsDirAbsolutePath, getSprintDocAbsolutePath } from "./sprint-files.js"

const env = loadEnv()
ensureRuntimeDir(env.repoRoot)

const store = new ThreadStore(env.stateFile)
const jobLogger = new JobLogger(getBridgeJobLogFile(env.repoRoot))
const health = new BridgeHealthReporter(getBridgeHealthFile(env.repoRoot), {
  applicationId: env.DISCORD_APPLICATION_ID,
  guildId: env.DISCORD_GUILD_ID,
  sprintChannelId: env.DISCORD_SPRINT_CHANNEL_ID,
})

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
})
const runningAutomationThreads = new Set<string>()
const automationAbortControllers = new Map<string, AbortController>()
const queuedAutomationThreads = new Set<string>()
const MAX_AUTONOMOUS_STAGE_WORKERS = env.DISCORD_AUTONOMOUS_STAGE_CONCURRENCY
let activeAutomationWorkerCount = 0
const DISCORD_MESSAGE_LIMIT = 1_900

const GATE_APPROVE_ID = "sprint:gate:approve"
const PREVIEW_REVISE_ID = "sprint:preview:revise"
const PREVIEW_APPROVE_ID = "sprint:preview:approve"
const NEXT_STAGE_ID = "sprint:stage:next"
const AUTONOMOUS_RETRY_ID = "sprint:job:retry"
const TERMINATE_REQUEST_ID = "sprint:terminate:request"
const TERMINATE_CONFIRM_PREFIX = "sprint:terminate:confirm"
const TERMINATE_CANCEL_PREFIX = "sprint:terminate:cancel"
const EXISTING_CONTINUE_PREFIX = "sprint:existing:continue"
const EXISTING_RESTART_PREFIX = "sprint:existing:restart"

function nowIso() {
  return new Date().toISOString()
}

function splitDiscordContent(content: string, maxLength = DISCORD_MESSAGE_LIMIT) {
  const normalized = content.trim()

  if (!normalized) {
    return []
  }

  if (normalized.length <= maxLength) {
    return [normalized]
  }

  const chunks: string[] = []
  const paragraphs = normalized.split(/\n{2,}/)
  let current = ""

  const pushCurrent = () => {
    const compact = current.trim()

    if (compact) {
      chunks.push(compact)
    }

    current = ""
  }

  for (const paragraph of paragraphs) {
    const part = paragraph.trim()

    if (!part) {
      continue
    }

    if (part.length > maxLength) {
      pushCurrent()

      let remaining = part

      while (remaining.length > maxLength) {
        chunks.push(remaining.slice(0, maxLength))
        remaining = remaining.slice(maxLength).trim()
      }

      if (remaining) {
        current = remaining
      }

      continue
    }

    const candidate = current ? `${current}\n\n${part}` : part

    if (candidate.length > maxLength) {
      pushCurrent()
      current = part
      continue
    }

    current = candidate
  }

  pushCurrent()
  return chunks
}

async function sendChunkedThreadMessage(thread: ThreadChannel, content: string) {
  const chunks = splitDiscordContent(content)

  for (const chunk of chunks) {
    await thread.send(chunk)
  }
}

function listFilesRecursively(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    return []
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const absolutePath = `${dirPath}/${entry.name}`

    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(absolutePath))
      continue
    }

    files.push(absolutePath)
  }

  return files
}

function buildDemoReviewAttachments(state: SprintThreadState) {
  const files: AttachmentBuilder[] = []
  const sprintDocPath = getSprintDocAbsolutePath(state.worktreePath, state)

  if (fs.existsSync(sprintDocPath)) {
    files.push(new AttachmentBuilder(sprintDocPath, { name: `${state.sprintId}-${state.featureSlug}.md` }))
  }

  const assetDir = getSprintAssetsDirAbsolutePath(state.worktreePath, state)
  const assetFiles = listFilesRecursively(assetDir)
    .filter((filePath) => /\.(md|html|txt|png|jpg|jpeg|webp)$/i.test(filePath))
    .slice(0, 6)

  for (const filePath of assetFiles) {
    files.push(new AttachmentBuilder(filePath))
  }

  return files
}

async function sendDemoReviewPack(thread: ThreadChannel, state: SprintThreadState) {
  const attachments = buildDemoReviewAttachments(state)

  const content = [
    "데모 확인 자료를 같이 보낼게요.",
    "- 스프린트 문서와 핵심 흐름 자료를 첨부했어요.",
    "- 문서 다운로드가 번거로우면 아래 요약만 보고 방향을 정해도 돼요.",
    ...buildLatestStageSummarySection(state.latestStageSummary),
  ].join("\n")

  if (attachments.length === 0) {
    await sendChunkedThreadMessage(thread, content)
    return
  }

  await thread.send({
    content,
    files: attachments,
  })
}

async function replyWithChunkedMessage(message: Message, content: string) {
  const chunks = splitDiscordContent(content)
  const [first, ...rest] = chunks

  if (!first) {
    return
  }

  await message.reply(first)

  for (const chunk of rest) {
    await message.reply(chunk)
  }
}

function stageLabel(stage: SprintStage) {
  switch (stage) {
    case "DISCOVERY_WORKSHOP":
      return "1. 방향 정리 [게이트]"
    case "DESIGN_PACK":
      return "2. 흐름 정리"
    case "DEMO_BUILD":
      return "3. 데모 구현"
    case "DEMO_REVIEW":
      return "4. 데모 확인 [게이트]"
    case "TECHNICAL_FREEZE":
      return "5. 구현 준비"
    case "IMPLEMENTATION":
      return "6. 구현"
    case "PREVIEW_REVIEW":
      return "7. 배포 확인 [게이트]"
    case "MERGE":
      return "8. main 반영"
    case "DONE":
      return "9. 완료"
  }
}

function stageSummary(stage: SprintStage) {
  switch (stage) {
    case "DISCOVERY_WORKSHOP":
      return "왜 필요한지, 성공 기준, 이번에 안 할 것을 정해요."
    case "DESIGN_PACK":
      return "핵심 흐름만 좁혀서 정리해요."
    case "DEMO_BUILD":
      return "진입점과 화면 흐름이 담긴 `/design-system` 데모를 만들어요."
    case "DEMO_REVIEW":
      return "진입점, 화면 이동, 완료 상태, 디자인 일관성을 보고 방향을 결정해요."
    case "TECHNICAL_FREEZE":
      return "구현 범위와 검증 기준을 확정해요."
    case "IMPLEMENTATION":
      return "기능 구현과 1차 검증을 진행해요."
    case "PREVIEW_REVIEW":
      return "배포된 결과를 보고 더 고칠지, 이대로 반영할지 정해요."
    case "MERGE":
      return "최종 확인 후 main에 반영해요."
    case "DONE":
      return "이 스프린트는 마무리됐어요."
  }
}

function nextHumanGate(stage: SprintStage): SprintStage | null {
  switch (stage) {
    case "DISCOVERY_WORKSHOP":
      return "DISCOVERY_WORKSHOP"
    case "DESIGN_PACK":
    case "DEMO_BUILD":
      return "DEMO_REVIEW"
    case "TECHNICAL_FREEZE":
    case "IMPLEMENTATION":
      return "PREVIEW_REVIEW"
    case "DEMO_REVIEW":
      return "DEMO_REVIEW"
    case "PREVIEW_REVIEW":
      return "PREVIEW_REVIEW"
    default:
      return null
  }
}

function statusLabel(status: SprintStatus) {
  switch (status) {
    case "ACTIVE":
      return "AI 진행 중"
    case "WAITING_FOR_APPROVAL":
      return "사람 결정 대기"
    case "PAUSED":
      return "일시 정지"
    case "BLOCKED":
      return "결정 필요"
    case "DONE":
      return "완료"
  }
}

function isAutonomousStage(stage: SprintStage) {
  return stage === "DESIGN_PACK" || stage === "DEMO_BUILD" || stage === "TECHNICAL_FREEZE" || stage === "IMPLEMENTATION" || stage === "MERGE"
}

function getStateBaseSprintKey(state: SprintThreadState) {
  return state.baseSprintKey ?? state.sprintKey
}

function getStateRunNumber(state: SprintThreadState) {
  return state.runNumber ?? 1
}

function formatRunLabel(state: SprintThreadState) {
  const runNumber = getStateRunNumber(state)
  return runNumber <= 1 ? "기본 실행" : `${runNumber}차 실행`
}

function formatUpdatedClock(iso?: string) {
  if (!iso) {
    return "방금 전"
  }

  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function statusFromStage(stage: SprintStage): SprintStatus {
  if (stage === "DONE") {
    return "DONE"
  }

  if (stage === "DISCOVERY_WORKSHOP" || stage === "DEMO_REVIEW" || stage === "PREVIEW_REVIEW") {
    return "WAITING_FOR_APPROVAL"
  }

  return "ACTIVE"
}

function nextAutomaticStage(stage: SprintStage): SprintStage | null {
  switch (stage) {
    case "DISCOVERY_WORKSHOP":
      return "DESIGN_PACK"
    case "DEMO_REVIEW":
      return "TECHNICAL_FREEZE"
    case "PREVIEW_REVIEW":
      return "MERGE"
    default:
      return null
  }
}

function nextTextCommandStage(stage: SprintStage): SprintStage | null {
  switch (stage) {
    case "DISCOVERY_WORKSHOP":
      return "DESIGN_PACK"
    case "DESIGN_PACK":
      return "DEMO_BUILD"
    case "DEMO_BUILD":
      return "DEMO_REVIEW"
    case "DEMO_REVIEW":
      return "TECHNICAL_FREEZE"
    case "TECHNICAL_FREEZE":
      return "IMPLEMENTATION"
    case "IMPLEMENTATION":
      return "PREVIEW_REVIEW"
    case "PREVIEW_REVIEW":
      return "MERGE"
    case "MERGE":
      return "DONE"
    default:
      return null
  }
}

type ThreadTextCommand = "NEXT_STAGE" | "RETRY_STAGE" | "PREVIEW_REVISE" | "PREVIEW_APPROVE"

function compactThreadCommand(content: string) {
  return content
    .trim()
    .toLowerCase()
    .replace(/[`'"“”‘’.,!?~…\s]/g, "")
}

function isShortThreadCommand(content: string) {
  const trimmed = content.trim()
  return trimmed.length > 0 && trimmed.length <= 80 && !trimmed.includes("\n")
}

function parseThreadTextCommand(content: string, state: SprintThreadState): ThreadTextCommand | null {
  if (!isShortThreadCommand(content)) {
    return null
  }

  const compact = compactThreadCommand(content)

  if (
    compact === "다시시도" ||
    compact === "재시도" ||
    compact === "retry" ||
    compact.includes("다시시도해") ||
    compact.includes("재시도해")
  ) {
    return "RETRY_STAGE"
  }

  if (state.stage === "PREVIEW_REVIEW") {
    if (compact.includes("수정더하기") || compact.includes("수정더해") || compact.includes("다시수정") || compact.startsWith("revise")) {
      return "PREVIEW_REVISE"
    }

    if (compact.includes("main반영") || compact.includes("메인반영") || compact.includes("완료main") || compact.includes("머지") || compact === "merge") {
      return "PREVIEW_APPROVE"
    }
  }

  const nextStageCommands = [
    "다음단계로",
    "다음단계진행",
    "다음단계넘어",
    "다음으로",
    "다음진행",
    "계속진행",
    "진행해줘",
    "진행해볼래",
    "넘어가",
    "넘겨줘",
  ]

  if (compact === "다음단계" || compact === "approve" || compact === "continue" || nextStageCommands.some((command) => compact.includes(command))) {
    return "NEXT_STAGE"
  }

  return null
}

function getGateConfig(stage: SprintStage) {
  switch (stage) {
    case "DISCOVERY_WORKSHOP":
      return {
        gateLabel: "Discovery 방향 정렬",
      }
    case "DEMO_REVIEW":
      return {
        gateLabel: "Demo 승인",
      }
    case "PREVIEW_REVIEW":
      return {
        gateLabel: "Preview 확인",
      }
    default:
      return null
  }
}

function isDesignSystemWorkflow(state: SprintThreadState) {
  return state.workflowKind === "design_system"
}

function workflowName(state: SprintThreadState) {
  return isDesignSystemWorkflow(state) ? "디자인 시스템 example" : "스프린트"
}

function workflowStageLabel(state: SprintThreadState, stage = state.stage) {
  if (!isDesignSystemWorkflow(state)) {
    return stageLabel(stage)
  }

  switch (stage) {
    case "IMPLEMENTATION":
      return "1. example 구현"
    case "PREVIEW_REVIEW":
      return "2. preview 확인 [게이트]"
    case "MERGE":
      return "3. main 반영"
    case "DONE":
      return "4. 완료"
    default:
      return stageLabel(stage)
  }
}

function workflowStageSummary(state: SprintThreadState) {
  if (!isDesignSystemWorkflow(state)) {
    return stageSummary(state.stage)
  }

  switch (state.stage) {
    case "IMPLEMENTATION":
      return "첨부와 설명을 분석해서 `/design-system/examples` page example을 구현해요."
    case "PREVIEW_REVIEW":
      return "배포된 example을 보고 더 고칠지, main에 반영할지 정해요."
    case "MERGE":
      return "최종 확인 후 main에 반영해요."
    case "DONE":
      return "이 디자인 시스템 example 작업은 마무리됐어요."
    default:
      return stageSummary(state.stage)
  }
}

function normalizeExampleSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function buildStageButtons(state: SprintThreadState, disabled = false) {
  if (state.stage === "DONE") {
    return []
  }

  const gate = getGateConfig(state.stage)
  const row = new ActionRowBuilder<ButtonBuilder>()

  if (state.stage === "PREVIEW_REVIEW") {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(PREVIEW_REVISE_ID)
        .setLabel("수정 더 하기")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(PREVIEW_APPROVE_ID)
        .setLabel("완료, main 반영")
        .setStyle(ButtonStyle.Success)
        .setDisabled(disabled),
    )
  } else if (gate) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(GATE_APPROVE_ID)
        .setLabel("다음 단계로 진행")
        .setStyle(ButtonStyle.Success)
        .setDisabled(disabled),
    )
  } else if (state.status === "BLOCKED" && isAutonomousStage(state.stage)) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(AUTONOMOUS_RETRY_ID)
        .setLabel(state.stage === "MERGE" ? "main 반영 다시 시도" : "같은 단계 다시 시도")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled),
    )
  }

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(TERMINATE_REQUEST_ID)
      .setLabel("파기 후 종료")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled),
  )

  return [row]
}

function formatPreviewReviewLine(preview?: SprintPreviewDeployment) {
  if (!preview) {
    return "preview URL이 아직 없어요."
  }

  return `preview: ${preview.url}${preview.ready ? "" : " (아직 준비 중일 수 있어요)"}`
}

function buildPreviewRouteUrl(preview: SprintPreviewDeployment, route: string) {
  return `${preview.url.replace(/\/$/, "")}${route.startsWith("/") ? route : `/${route}`}`
}

function buildLocalDevRouteUrl(route: string) {
  return `${env.DISCORD_LOCAL_DEV_ORIGIN.replace(/\/$/, "")}${route.startsWith("/") ? route : `/${route}`}`
}

function getDemoRoute(state: SprintThreadState) {
  return `/design-system/examples/${isDesignSystemWorkflow(state) ? state.featureSlug : state.sprintKey}`
}

function shouldDeployPreviewFromMessage(state: SprintThreadState, content: string) {
  if (state.stage !== "DEMO_REVIEW" && state.stage !== "PREVIEW_REVIEW") {
    return false
  }

  const compact = compactThreadCommand(content)

  if (!compact) {
    return false
  }

  return compact.includes("vercel") || compact.includes("외부") || compact.includes("배포")
}

function shouldReplyWithReviewUrl(state: SprintThreadState, content: string) {
  if (state.stage !== "DEMO_REVIEW" && state.stage !== "PREVIEW_REVIEW") {
    return false
  }

  const compact = compactThreadCommand(content)

  if (!compact) {
    return false
  }

  return (
    shouldDeployPreviewFromMessage(state, content) ||
    compact.includes("preview") ||
    compact.includes("프리뷰") ||
    compact.includes("url") ||
    compact.includes("링크") ||
    compact.includes("localhost") ||
    compact.includes("로컬")
  )
}

function buildReviewUrlReply(state: SprintThreadState) {
  const route = state.stage === "DEMO_REVIEW" || isDesignSystemWorkflow(state) ? getDemoRoute(state) : "/"
  const lines = [
    "맞아요. 확인 URL은 이걸 보면 돼요.",
    `- local: ${buildLocalDevRouteUrl(route)}`,
  ]

  if (state.stage === "DEMO_REVIEW") {
    lines.push(`- design-system: ${buildLocalDevRouteUrl("/design-system")}`)
  }

  if (state.preview?.url) {
    lines.push(`- external preview: ${buildPreviewRouteUrl(state.preview, route)}`)
  }

  return lines.join("\n")
}

function workflowStatusLabel(state: SprintThreadState) {
  if (state.status === "BLOCKED") {
    return "멈춤"
  }

  if (state.job?.status === "RUNNING") {
    switch (state.stage) {
      case "DESIGN_PACK":
        return "흐름 정리 중"
      case "DEMO_BUILD":
        return "데모 구현 중"
      case "TECHNICAL_FREEZE":
        return "구현 준비 중"
      case "IMPLEMENTATION":
        return isDesignSystemWorkflow(state) ? "example 구현 중" : "구현 중"
      case "MERGE":
        return "main 반영 중"
      default:
        return "작업 중"
    }
  }

  if (isAutonomousStage(state.stage) && state.status === "ACTIVE") {
    return "작업 준비 중"
  }

  return statusLabel(state.status)
}

function buildActivityCard(state: SprintThreadState) {
  const lines = [
    "**진행 현황**",
    `- 단계: ${workflowStageLabel(state)}`,
    `- 상태: ${workflowStatusLabel(state)}`,
  ]

  if (state.preview?.url) {
    lines.push(`- preview: ${state.preview.url}${state.preview.ready ? "" : " (준비 중일 수 있어요)"}`)
  }

  if (state.status === "WAITING_FOR_APPROVAL") {
    const gate = getGateConfig(state.stage)

    if (gate) {
      lines.push(`- 지금 정할 것: ${gate.gateLabel}`)
    }
  }

  if (state.job?.status === "RUNNING" && state.job.detailLines?.length) {
    lines.push("", "지금 하는 일")
    lines.push(...state.job.detailLines.map((line) => `- ${line}`))
  } else if (state.job?.status === "FAILED" && state.job.error) {
    lines.push("", "막힌 이유")
    lines.push(`- ${state.job.error}`)
    if (state.job.diagnosticLines?.length) {
      lines.push(...state.job.diagnosticLines.map((line) => `- ${line}`))
    }
  } else if (state.job?.summary) {
    lines.push("", "최근 작업")
    lines.push(`- ${state.job.summary}`)
  }

  if (state.latestStageSummary?.content) {
    lines.push("", `${workflowStageLabel(state, state.latestStageSummary.stage)}에서 정리된 내용`)
    lines.push(state.latestStageSummary.content)
  }

  lines.push("", `- 마지막 업데이트: ${formatUpdatedClock(state.job?.updatedAt ?? state.updatedAt)}`)
  return lines.join("\n")
}

async function syncActivityCard(thread: ThreadChannel, state: SprintThreadState) {
  const content = buildActivityCard(state)

  if (state.activityMessageId) {
    const existing = await thread.messages.fetch(state.activityMessageId).catch(() => null)

    if (existing) {
      await existing.edit({ content, components: [] })
      return state
    }
  }

  const message = await thread.send({ content, components: [] })
  const nextState = {
    ...state,
    activityMessageId: message.id,
  }
  store.upsert(nextState)
  return nextState
}

function withJobDetail(state: SprintThreadState, detailLines: string[]): SprintThreadState {
  return {
    ...state,
    job: {
      ...(state.job ?? { status: "IDLE" as const }),
      detailLines,
      updatedAt: nowIso(),
    },
    updatedAt: nowIso(),
  }
}

function buildStageControlCard(state: SprintThreadState) {
  if (state.stage === "DONE") {
    return null
  }

  const gate = getGateConfig(state.stage)

  return {
    content:
      state.stage === "PREVIEW_REVIEW"
        ? [
            `지금은 **${workflowStageLabel(state)}** 단계예요.`,
            ...buildLatestStageSummarySection(state.latestStageSummary),
            "",
            `- ${formatPreviewReviewLine(state.preview)}`,
            `- ${workflowStageSummary(state)}`,
            "",
            "배포된 화면을 보고 결정하면 돼요.",
            "- 더 고칠 게 있으면 `수정 더 하기`",
            "- 이대로 괜찮으면 `완료, main 반영`",
            "- 여기서 접고 싶으면 `파기 후 종료`",
          ].join("\n")
        : gate
          ? [
          `지금은 **${workflowStageLabel(state)}** 단계예요.`,
          ...buildLatestStageSummarySection(state.latestStageSummary),
          "",
          `지금 정할 것: ${gate.gateLabel}`,
          `- ${workflowStageSummary(state)}`,
          ...(state.stage === "DEMO_REVIEW"
            ? [
                "",
                `이번 데모: ${buildLocalDevRouteUrl(getDemoRoute(state))}`,
                `전체 목록: ${buildLocalDevRouteUrl("/design-system")}`,
              ]
            : []),
          ...(state.preview
            ? [
                "",
                `external preview: ${state.preview.url}${state.preview.ready ? "" : " (아직 준비 중일 수 있어요)"}`,
                ...(state.stage === "DEMO_REVIEW" ? [`이번 데모: ${buildPreviewRouteUrl(state.preview, getDemoRoute(state))}`] : []),
              ]
            : []),
          "",
          "계속 이야기하다가 방향이 정리되면 버튼을 눌러주세요.",
          "이번 스프린트를 여기서 접고 싶으면 `파기 후 종료`를 누르면 돼요.",
          ].join("\n")
          : [
            `지금은 **${workflowStageLabel(state)}** 단계예요.`,
            `상태: ${workflowStatusLabel(state)}`,
            `- ${workflowStageSummary(state)}`,
            ...buildLatestStageSummarySection(state.latestStageSummary),
            ...(state.job?.status === "RUNNING" && state.job.detailLines?.length
              ? ["", "지금 하는 일", ...state.job.detailLines.map((line) => `- ${line}`)]
              : []),
            "",
            "이 단계는 사람이 승인하는 게이트가 아니에요.",
            state.status === "BLOCKED" ? "필요한 방향을 스레드에 남기면 다시 이어갈게요." : "작업이 끝나면 다음 확인 단계로 자동 전환돼요.",
            "중단하려면 `파기 후 종료`로 정리할 수 있어요.",
          ].join("\n"),
    components: buildStageButtons(state),
  }
}

function buildExistingSprintChoice(state: SprintThreadState) {
  return {
    content: [
      `같은 ${workflowName(state)} 작업이 이미 열려 있어요.`,
      `- 스레드: <#${state.threadId}>`,
      `- 실행: ${formatRunLabel(state)}`,
      `- 단계: ${workflowStageLabel(state)}`,
      `- 상태: ${statusLabel(state.status)}`,
      "",
      "어떻게 할까요?",
    ].join("\n"),
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`${EXISTING_CONTINUE_PREFIX}:${state.threadId}`)
          .setLabel("이어서 하기")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`${EXISTING_RESTART_PREFIX}:${state.threadId}`)
          .setLabel("새로 시작하기")
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
  }
}

function formatDetailStatus(state: SprintThreadState) {
  const nextGate = nextHumanGate(state.stage)
  const jobLine = state.job
    ? `job: \`${state.job.status}\`${state.job.label ? ` (${state.job.label})` : ""}`
    : "job: `IDLE`"
  const jobSummaryLine = state.job?.summary ? `최근 작업 요약: ${state.job.summary}` : null
  const jobErrorLine = state.job?.error ? `최근 작업 오류: ${state.job.error}` : null
  const jobDetailLine = state.job?.detailLines?.length
    ? ["현재 작업 단계:", ...state.job.detailLines.map((line) => `- ${line}`)].join("\n")
    : null
  const jobDiagnosticLine = state.job?.diagnosticLines?.length
    ? ["오류 진단:", ...state.job.diagnosticLines.map((line) => `- ${line}`)].join("\n")
    : null
  const previewLine = state.preview ? `preview URL: ${state.preview.url}${state.preview.ready ? "" : " (준비 중일 수 있어요)"}` : null

  return [
    `${workflowName(state)}: \`${state.sprintId}/${state.featureSlug}\``,
    `실행: ${formatRunLabel(state)}`,
    `현재 단계: ${workflowStageLabel(state)}`,
    `상태: \`${state.status}\` (${statusLabel(state.status)})`,
    jobLine,
    `다음 사람 체크포인트: ${nextGate ? workflowStageLabel(state, nextGate) : "없음"}`,
    `worktree: \`${state.worktreeName}\``,
    `branch: \`${state.branchName}\``,
    `codex session: ${state.codexSessionId ? `\`${state.codexSessionId}\`` : "아직 생성 전"}`,
    `worktree path: \`${state.worktreePath}\``,
    `마지막 업데이트: \`${state.updatedAt}\``,
    previewLine,
    jobDetailLine,
    jobSummaryLine,
    jobErrorLine,
    jobDiagnosticLine,
    state.latestStageSummary?.content
      ? [`직전 단계 요약 (${workflowStageLabel(state, state.latestStageSummary.stage)}):`, state.latestStageSummary.content].join("\n")
      : null,
  ]
    .filter(Boolean)
    .join("\n")
}

function formatChannelSummary(states: SprintThreadState[]) {
  if (states.length === 0) {
    return "지금 등록된 스프린트가 없어요."
  }

  const sorted = [...states].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

  return [
    `현재 등록된 작업: ${sorted.length}개`,
    "",
    ...sorted.map((state) => {
      const nextGate = nextHumanGate(state.stage)

      return [
        `- <#${state.threadId}>`,
        `  실행: ${formatRunLabel(state)}`,
        `  단계: ${workflowStageLabel(state)} / 상태: ${statusLabel(state.status)}`,
        `  작업: ${state.job?.status ?? "IDLE"}${state.job?.label ? ` (${state.job.label})` : ""}`,
        `  다음 체크포인트: ${nextGate ? workflowStageLabel(state, nextGate) : "없음"}`,
        `  worktree: \`${state.worktreeName}\` / branch: \`${state.branchName}\``,
        ...(state.preview ? [`  preview: ${state.preview.url}`] : []),
      ].join("\n")
    }),
  ].join("\n")
}

function summarizeDecisionNote(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return ["정리할 내용이 아직 없어요."]
  }

  return lines.slice(0, 3).map((line) => (line.length <= 90 ? line : `${line.slice(0, 87)}...`))
}

function isLikelyQuestion(content: string) {
  const normalized = content.toLowerCase()

  if (content.includes("?")) {
    return true
  }

  return [
    "어떻게",
    "왜",
    "궁금",
    "추천",
    "비교",
    "vs",
    "할까",
    "할지",
    "맞을까",
    "맞나",
    "리스크",
    "장단점",
    "어때",
    "괜찮",
  ].some((token) => normalized.includes(token))
}

function isProgressRequest(content: string) {
  const normalized = content.toLowerCase().replace(/\s+/g, "")

  if (!normalized) {
    return false
  }

  return [
    "진행사항",
    "진행상황",
    "진행상태",
    "진척",
    "상태알려",
    "상황알려",
    "어디까지",
    "얼마나",
    "완성도",
    "남은작업",
    "뭐하고",
    "뭐하는",
    "progress",
    "status",
  ].some((token) => normalized.includes(token))
}

function buildDiscoveryFacilitatorReply(content: string) {
  const firstLine = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)

  const latestQuestion = firstLine && firstLine.length <= 100 ? firstLine : "방금 질문한 주제"

  return [
    "지금 질문은 바로 결론보다 선택지를 같이 정리하는 게 더 중요해요.",
    firstLine ? `- 지금 보고 있는 주제: ${latestQuestion}` : "- 지금 보고 있는 주제: 방금 질문한 내용",
    "",
    "우선 이렇게 나눠서 보면 좋아요.",
    "- 이 질문이 제품 목표에 미치는 영향",
    "- 지금 바로 정해야 하는 정책",
    "- 나중으로 미뤄도 되는 구현 디테일",
    "",
    "같이 먼저 정할 것",
    "- 사용자에게 어떤 기본 경험을 줄지",
    "- 서버 기준으로 어떤 정책을 가져갈지",
    "- 이번 스프린트에서 끝낼 범위를 어디까지 둘지",
  ].join("\n")
}

function buildDiscoveryNoteReply(content: string) {
  const bullets = summarizeDecisionNote(content)

  return [
    "이렇게 이해했어요.",
    ...bullets.map((line) => `- ${line}`),
    "",
    "지금 먼저 정하면 좋은 것",
    "- 이 기능을 꼭 해야 하는 이유 한 줄",
    "- 이번 스프린트의 성공 기준 1~2개",
    "- 이번엔 하지 않을 것",
  ].join("\n")
}

function buildDemoFacilitatorReply() {
  return [
    "지금은 화면 완성도보다 사용 흐름이 자연스러운지 보는 게 더 중요해요.",
    "",
    "지금 보면 좋은 것",
    "- 사용자가 어디서 이 기능을 처음 만나는지",
    "- 시작, 취소, 완료 후 돌아오는 위치가 자연스러운지",
    "- 화면 이동 사이에 빠진 상태가 없는지",
    "- 디자인 시스템 컴포넌트와 토큰을 일관되게 썼는지",
    "",
    "바꾸고 싶은 포인트를 그대로 말해주면, 유지할 것과 바꿀 것을 나눠서 다시 정리해볼게요.",
  ].join("\n")
}

function buildDemoNoteReply(content: string) {
  const bullets = summarizeDecisionNote(content)

  return [
    "데모 피드백으로 이렇게 정리할게요.",
    ...bullets.map((line) => `- ${line}`),
    "",
    "이번 단계에선 이 네 가지를 보면 돼요.",
    "- 진입점이 자연스러운지",
    "- 화면 이동이 끊기지 않는지",
    "- 완료/취소 후 위치가 어색하지 않은지",
    "- 디자인 시스템 사용이 일관적인지",
  ].join("\n")
}

function buildAutonomousStageReply(state: SprintThreadState) {
  const nextGate = nextHumanGate(state.stage)

  return [
    `지금은 **${workflowStageLabel(state)}** 단계예요.`,
    `- ${workflowStageSummary(state)}`,
    ...buildLatestStageSummarySection(state.latestStageSummary),
    "",
    "이 구간은 내가 알아서 진행할게요.",
    "중간에 계속 말 걸지 않아도 괜찮아요.",
    "아래처럼 중요한 순간에만 다시 알려드릴게요.",
    "- 막히는 결정이 생길 때",
    "- 검증이 끝났을 때",
    "- 사람이 확인해야 할 게 생길 때",
    `- 다음 체크포인트: ${nextGate ? workflowStageLabel(state, nextGate) : "없음"}`,
  ].join("\n")
}

function buildAutonomousStageStartReply(state: SprintThreadState) {
  switch (state.stage) {
    case "DESIGN_PACK":
      return [
        `좋아요. 이제 **${workflowStageLabel(state)}** 단계로 넘어가요.`,
        ...buildLatestStageSummarySection(state.latestStageSummary),
        "",
        "내가 지금 할 일",
        "- 핵심 경로만 좁혀서 정리하기",
        "- 데모에 꼭 필요한 진입점과 화면만 남기기",
        "- 데모 구현 단계로 넘길 흐름 계약 만들기",
        "",
        "다시 알려드릴 때",
        "- 데모 구현을 시작할 때",
        "- 범위를 줄여야 할 때",
        "- 방향이 갈릴 때",
      ].join("\n")
    case "DEMO_BUILD":
      return [
        `좋아요. 이제 **${workflowStageLabel(state)}** 단계로 넘어가요.`,
        ...buildLatestStageSummarySection(state.latestStageSummary),
        "",
        "내가 지금 할 일",
        `- \`/design-system/examples/${state.sprintKey}\` 데모 만들기`,
        "- 기능 진입점, 화면 이동, 완료/취소 상태 담기",
        "- 디자인 시스템 사용 지점을 함께 기록하기",
        "",
        "다시 알려드릴 때",
        "- 확인할 데모 URL이 준비됐을 때",
        "- 공통 디자인 시스템 수정이 필요해 보일 때",
        "- 데모 구현이 막혔을 때",
      ].join("\n")
    case "TECHNICAL_FREEZE":
      return [
        `좋아요. 이제 **${workflowStageLabel(state)}** 단계로 넘어가요.`,
        ...buildLatestStageSummarySection(state.latestStageSummary),
        "",
        "내가 지금 할 일",
        "- 구현 범위 확정하기",
        "- 프론트, 백엔드, 모바일 경계 나누기",
        "- 검증 기준 정리하기",
        "",
        "다시 알려드릴 때",
        "- 구현 범위가 갈릴 때",
        "- 사람 확인이 필요한 결정이 생길 때",
        "- 구현 단계로 넘길 준비가 끝났을 때",
      ].join("\n")
    case "IMPLEMENTATION":
    case "MERGE":
      return buildAutonomousStageReply(state)
    case "PREVIEW_REVIEW":
      return [
        `좋아요. 이제 **${workflowStageLabel(state)}** 단계예요.`,
        ...buildLatestStageSummarySection(state.latestStageSummary),
        "",
        `- ${formatPreviewReviewLine(state.preview)}`,
        "- 링크를 직접 보고 더 고칠지, 이대로 반영할지 정하면 돼요.",
      ].join("\n")
    case "DONE":
      return isDesignSystemWorkflow(state) ? "이 디자인 시스템 example 작업은 끝났어요." : "이번 스프린트는 끝났어요."
    case "DISCOVERY_WORKSHOP":
    case "DEMO_REVIEW":
      return `지금은 **${workflowStageLabel(state)}** 단계예요.`
  }
}

function buildConversationFallbackReply(state: SprintThreadState, content: string) {
  if (state.stage === "DISCOVERY_WORKSHOP") {
    if (isLikelyQuestion(content)) {
      return [
        "지금 답변 생성이 잠깐 꼬였어요.",
        "같은 말을 반복해서 답하지 않기 위해, 방금 질문 기준으로만 짧게 다시 잡을게요.",
        "",
        buildDiscoveryFacilitatorReply(content),
        "",
        "같은 질문을 한 번 더 보내주면 문맥을 다시 묶어서 이어서 답할게요.",
      ].join("\n")
    }

    return buildDiscoveryNoteReply(content)
  }

  if (state.stage === "DEMO_REVIEW") {
    return isLikelyQuestion(content) ? buildDemoFacilitatorReply() : buildDemoNoteReply(content)
  }

  if (state.stage === "PREVIEW_REVIEW") {
    return [
      "배포 화면 기준으로 바로 판단해볼게요.",
      "- 지금 수정이 필요한 부분",
      "- 이번 사이클에서 고칠지",
      "- 이대로 반영해도 되는지",
      "",
      "더 고칠 게 있으면 그대로 말해주고, 준비되면 버튼으로 다음 단계를 고르면 돼요.",
    ].join("\n")
  }

  return buildAutonomousStageReply(state)
}

function buildProgressReply(state: SprintThreadState) {
  const nextGate = nextHumanGate(state.stage)
  const job = state.job
  const isRunning = state.status === "ACTIVE" && job?.status === "RUNNING"
  const lines = [
    "현재 진행사항은 이렇게 보면 돼요.",
    `- 단계: ${workflowStageLabel(state)}`,
    `- 상태: ${statusLabel(state.status)}`,
    `- 작업: ${job?.status ?? "IDLE"}${job?.label ? ` (${job.label})` : ""}`,
    `- 다음 사람 체크포인트: ${nextGate ? workflowStageLabel(state, nextGate) : "없음"}`,
  ]

  if (job?.detailLines?.length) {
    lines.push(...job.detailLines.map((line) => `- ${line}`))
  }

  if (job?.summary) {
    lines.push(`- 최근 요약: ${summarizeJobText(job.summary, 360)}`)
  }

  if (job?.error) {
    lines.push(`- 최근 오류: ${summarizeJobText(job.error, 260)}`)
  }

  if (state.preview?.url) {
    lines.push(`- preview: ${state.preview.url}`)
  }

  lines.push(`- branch: ${state.branchName}`)

  if (isRunning) {
    lines.push("", "아직 완료 전환 신호는 안 들어왔어요. 작업이 끝나면 다음 단계나 확인 게이트로 자동 전환돼요.")
  }

  return lines.join("\n")
}

async function buildThreadTranscript(thread: ThreadChannel, currentMessageId: string) {
  const messages = await thread.messages.fetch({ limit: 12 })
  const ordered = [...messages.values()]
    .filter((message) => message.id !== currentMessageId)
    .filter((message) => !message.system)
    .sort((left, right) => left.createdTimestamp - right.createdTimestamp)
    .slice(-8)

  return ordered.map(formatMessageForTranscript).filter(Boolean).join("\n")
}

async function buildAutomationTranscript(thread: ThreadChannel) {
  const messages = await thread.messages.fetch({ limit: 100 })
  const ordered = [...messages.values()]
    .filter((message) => !message.system)
    .sort((left, right) => left.createdTimestamp - right.createdTimestamp)

  return ordered.map(formatMessageForTranscript).filter(Boolean).join("\n")
}

async function buildStageTranscript(thread: ThreadChannel, stageStartedAt?: string, currentMessageId?: string) {
  const stageStartedTs = stageStartedAt ? new Date(stageStartedAt).getTime() : Number.NaN
  const hasStageStartedAt = Number.isFinite(stageStartedTs)
  const messages = await thread.messages.fetch({ limit: 100 })
  const ordered = [...messages.values()]
    .filter((message) => !message.system)
    .filter((message) => (currentMessageId ? message.id !== currentMessageId : true))
    .filter((message) => !hasStageStartedAt || message.createdTimestamp >= stageStartedTs)
    .sort((left, right) => left.createdTimestamp - right.createdTimestamp)

  return ordered.map(formatMessageForTranscript).filter(Boolean).join("\n")
}

function formatMessageForTranscript(message: Message) {
  const role = message.author.bot ? "bot" : "user"
  const content = message.content.trim()
  const attachments = [...message.attachments.values()].map((attachment) =>
    [
      `attachment: ${attachment.name}`,
      `type=${attachment.contentType ?? "unknown"}`,
      `url=${attachment.url}`,
    ].join(" "),
  )
  const body = [content, ...attachments].filter(Boolean).join("\n")

  if (!body) {
    return null
  }

  return `${role}: ${body}`
}

function buildFallbackStageSummary(params: {
  fromStage: SprintStage
  transcript: string
  stageReply?: string
}) {
  const source = [params.stageReply?.trim(), params.transcript]
    .filter(Boolean)
    .join("\n")

  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.replace(/^(user|bot):\s*/, ""))
    .filter(Boolean)
    .filter((line) => !/^지금은\b/.test(line))
    .filter((line) => !/^이 구간은\b/.test(line))
    .filter((line) => !/^다시 알려드릴 때\b/.test(line))
    .filter((line) => !/^내가 지금 할 일\b/.test(line))
    .filter((line) => !/^운영 방식\b/.test(line))
    .filter((line) => !/^실행 정보\b/.test(line))
    .filter((line) => !/^지금 할 일\b/.test(line))
    .filter((line) => !/^상태:\s*/.test(line))
    .slice(0, 4)

  if (lines.length === 0) {
    switch (params.fromStage) {
      case "DISCOVERY_WORKSHOP":
        return "- 문제 정의와 범위를 더 정리해야 해요."
      case "DESIGN_PACK":
        return "- 데모에서 확인할 핵심 흐름만 남겼어요."
      case "DEMO_BUILD":
        return "- 진입점과 화면 흐름을 담은 데모를 준비했어요."
      case "DEMO_REVIEW":
        return "- 유지할 것과 바꿀 것을 다시 정리해야 해요."
      case "TECHNICAL_FREEZE":
        return "- 구현 범위와 검증 계획을 확인했어요."
      case "IMPLEMENTATION":
        return "- 구현 결과와 검증 상태를 확인했어요."
      case "PREVIEW_REVIEW":
        return "- preview 확인 결과를 다시 확인해야 해요."
      case "MERGE":
        return "- 최종 반영 결과를 다시 확인해야 해요."
      case "DONE":
        return "- 이번 스프린트를 마무리했어요."
    }
  }

  return lines.map((line) => `- ${line}`).join("\n")
}

function normalizeStageSummary(summary: string) {
  return summary
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.startsWith("- "))
    .map((line) => (line.length <= 220 ? line : `${line.slice(0, 217)}...`))
    .slice(0, 6)
    .join("\n")
}

async function summarizeStageTransition(params: {
  thread: ThreadChannel
  state: SprintThreadState
  toStage?: SprintStage
  currentMessageId?: string
  stageReply?: string
}) {
  const transcript = await buildStageTranscript(params.thread, params.state.stageStartedAt ?? params.state.createdAt, params.currentMessageId)

  try {
    const summary = await runCodexStageTransitionSummary({
      repoRoot: env.repoRoot,
      sprintId: params.state.sprintId,
      featureSlug: params.state.featureSlug,
      fromStage: params.state.stage,
      toStage: params.toStage,
      transcript,
      stageReply: params.stageReply,
    })

    const normalized = normalizeStageSummary(summary)

    if (normalized) {
      return {
        stage: params.state.stage,
        content: normalized,
        updatedAt: nowIso(),
      } satisfies SprintStageSummary
    }
  } catch (error) {
    console.error(
      `[discord-bridge] failed to summarize stage transition (${params.state.sprintId}/${params.state.featureSlug} ${params.state.stage} -> ${params.toStage ?? "none"})`,
    )
    console.error(error)
  }

  return {
    stage: params.state.stage,
    content: buildFallbackStageSummary({
      fromStage: params.state.stage,
      transcript,
      stageReply: params.stageReply,
    }),
    updatedAt: nowIso(),
  } satisfies SprintStageSummary
}

function buildLatestStageSummarySection(summary?: SprintStageSummary) {
  if (!summary?.content) {
    return []
  }

  return [
    "",
    `${stageLabel(summary.stage)}에서 정리된 내용`,
    summary.content,
  ]
}

async function deployPreviewForState(state: SprintThreadState) {
  const result = await runVercelPreviewDeployment(state.worktreePath, {
    previewScriptPath: `${env.repoRoot}/scripts/remote/vercel-preview.sh`,
  })

  return {
    url: result.url,
    ready: result.ready,
    deployedAt: nowIso(),
  } satisfies SprintPreviewDeployment
}

function summarizeJobText(text: string, maxLength = 180) {
  const compact = text.replace(/\s+/g, " ").trim()
  return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength - 3)}...`
}

type StageFailureReport = {
  summary: string
  details: string[]
  logDetail: string
}

function formatDuration(ms: number) {
  const minutes = Math.round(ms / 60_000)

  if (minutes >= 1) {
    return `${minutes}분`
  }

  return `${Math.round(ms / 1000)}초`
}

function getErrorRecord(error: unknown) {
  return typeof error === "object" && error !== null ? (error as Record<string, unknown>) : {}
}

function getStringField(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function getBooleanField(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === "boolean" ? value : undefined
}

function getExitCode(record: Record<string, unknown>) {
  const value = record.code
  return typeof value === "number" || typeof value === "string" ? String(value) : undefined
}

function getOutputTail(value: unknown, maxLines = 4) {
  const text =
    typeof value === "string"
      ? value
      : Buffer.isBuffer(value)
        ? value.toString("utf8")
        : undefined

  if (!text?.trim()) {
    return undefined
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-maxLines)
    .join(" / ")
}

function timeoutForState(state: SprintThreadState) {
  return isDesignSystemWorkflow(state) ? getDesignSystemStageTimeoutMs() : getCodexStageTimeoutMs(state.stage)
}

function describeAutonomousStageError(error: unknown, state: SprintThreadState): StageFailureReport {
  const record = getErrorRecord(error)
  const message = error instanceof Error ? error.message : String(error || "알 수 없는 오류")
  const name = error instanceof Error ? error.name : getStringField(record, "name")
  const code = getExitCode(record)
  const signal = getStringField(record, "signal")
  const killed = getBooleanField(record, "killed")
  const cmd = getStringField(record, "cmd")
  const stderrTail = getOutputTail(record.stderr)
  const stdoutTail = getOutputTail(record.stdout, 2)
  const timeoutMs = timeoutForState(state)

  let summary: string

  if (name === "AbortError") {
    summary = "작업 중단됨: 새 단계로 넘기거나 재시도하면서 이전 Codex 실행을 중단했어요."
  } else if (killed && signal === "SIGTERM") {
    summary = `시간 초과: ${workflowStageLabel(state)} worker가 ${formatDuration(timeoutMs)} 제한을 넘겨 종료됐어요.`
  } else if (signal) {
    summary = `프로세스 종료: Codex worker가 signal ${signal}로 멈췄어요.`
  } else if (code) {
    summary = `프로세스 실패: Codex worker가 exit code ${code}로 종료됐어요.`
  } else {
    summary = `실행 실패: ${summarizeJobText(message, 220)}`
  }

  const details = [
    code ? `exit code: ${code}` : null,
    signal ? `signal: ${signal}` : null,
    killed !== undefined ? `killed: ${String(killed)}` : null,
    cmd ? `command: ${summarizeJobText(cmd, 260)}` : null,
    stderrTail ? `stderr: ${summarizeJobText(stderrTail, 420)}` : null,
    stdoutTail ? `stdout: ${summarizeJobText(stdoutTail, 260)}` : null,
    !stderrTail && !stdoutTail && message !== summary ? `message: ${summarizeJobText(message, 420)}` : null,
  ].filter(Boolean) as string[]

  return {
    summary,
    details,
    logDetail: [summary, ...details].join("\n"),
  }
}

function buildRunningJobState(state: SprintThreadState) {
  const timestamp = nowIso()

  return {
    ...state,
    job: {
      status: "RUNNING" as const,
      stage: state.stage,
      label: workflowStageLabel(state),
      startedAt: state.job?.status === "RUNNING" && state.job.stage === state.stage ? state.job.startedAt ?? timestamp : timestamp,
      updatedAt: timestamp,
      summary: state.job?.summary,
      error: undefined,
      detailLines: state.job?.detailLines,
    },
    updatedAt: timestamp,
  }
}

function buildFailedJobState(state: SprintThreadState, failure: StageFailureReport) {
  const timestamp = nowIso()

  return {
    ...state,
    status: "BLOCKED" as const,
    job: {
      status: "FAILED" as const,
      stage: state.stage,
      label: workflowStageLabel(state),
      startedAt: state.job?.startedAt ?? timestamp,
      updatedAt: timestamp,
      summary: state.job?.summary,
      error: summarizeJobText(failure.summary, 420),
      detailLines: state.job?.detailLines,
      diagnosticLines: failure.details.map((line) => summarizeJobText(line, 420)),
    },
    updatedAt: timestamp,
  }
}

function isCurrentAutonomousJob(latestState: SprintThreadState | undefined, runningState: SprintThreadState) {
  return (
    latestState?.stage === runningState.stage &&
    latestState.status === "ACTIVE" &&
    latestState.stageStartedAt === runningState.stageStartedAt &&
    latestState.job?.status === "RUNNING" &&
    latestState.job.stage === runningState.job?.stage &&
    latestState.job.startedAt === runningState.job?.startedAt
  )
}

function logDiscardedAutonomousJob(runningState: SprintThreadState, detail: string) {
  jobLogger.append({
    at: nowIso(),
    threadId: runningState.threadId,
    sprintKey: runningState.sprintKey,
    stage: runningState.stage,
    kind: "job.discarded",
    detail,
  })
}

function abortRunningAutonomousStage(threadId: string) {
  const controller = automationAbortControllers.get(threadId)

  if (!controller || controller.signal.aborted) {
    return
  }

  controller.abort()
}

async function advanceAfterAutonomousStage(thread: ThreadChannel, state: SprintThreadState, reply: string) {
  const timestamp = nowIso()
  const baseState = {
    ...state,
    job: {
      status: "IDLE" as const,
      stage: state.stage,
      label: workflowStageLabel(state),
      startedAt: state.job?.startedAt,
      updatedAt: timestamp,
      summary: summarizeJobText(reply),
      error: undefined,
    },
    updatedAt: timestamp,
  }

  if (state.stage === "DESIGN_PACK") {
    const stageSummary = await summarizeStageTransition({
      thread,
      state,
      toStage: "DEMO_BUILD",
      stageReply: reply,
    })

    const nextState: SprintThreadState = {
      ...baseState,
      stage: "DEMO_BUILD",
      status: "ACTIVE",
      latestStageSummary: stageSummary,
      stageStartedAt: timestamp,
      checkpointMessageId: undefined,
    }

    store.upsert(nextState)
    await sendChunkedThreadMessage(thread, reply)
    await sendChunkedThreadMessage(thread, buildAutonomousStageStartReply(nextState))
    return nextState
  }

  if (state.stage === "DEMO_BUILD") {
    const stageSummary = await summarizeStageTransition({
      thread,
      state,
      toStage: "DEMO_REVIEW",
      stageReply: reply,
    })

    const nextState: SprintThreadState = {
      ...baseState,
      stage: "DEMO_REVIEW",
      status: "WAITING_FOR_APPROVAL",
      latestStageSummary: stageSummary,
      job: {
        ...baseState.job,
        detailLines: ["데모 구현 완료", "로컬 dev URL에서 데모 흐름을 확인하면 돼요."],
      },
      stageStartedAt: timestamp,
      checkpointMessageId: undefined,
    }

    store.upsert(nextState)
    await sendChunkedThreadMessage(thread, reply)
    await sendChunkedThreadMessage(
      thread,
      [
        "데모를 준비했어요. 이제 실제 흐름을 보고 방향만 확인하면 돼요.",
        `- 전체 목록: ${buildLocalDevRouteUrl("/design-system")}`,
        `- 이번 데모: ${buildLocalDevRouteUrl(getDemoRoute(state))}`,
        "- 외부에서 봐야 하면 스레드에 `Vercel preview 배포해줘`라고 말하면 돼요.",
        ...buildLatestStageSummarySection(stageSummary),
      ].join("\n"),
    )
    await sendDemoReviewPack(thread, nextState)
    return postStageControlMessage(thread, nextState)
  }

  if (state.stage === "TECHNICAL_FREEZE") {
    const stageSummary = await summarizeStageTransition({
      thread,
      state,
      toStage: "IMPLEMENTATION",
      stageReply: reply,
    })

    const nextState: SprintThreadState = {
      ...baseState,
      stage: "IMPLEMENTATION",
      status: "ACTIVE",
      latestStageSummary: stageSummary,
      preview: undefined,
      job: {
        ...baseState.job,
        detailLines: ["구현 준비 중", "구현과 1차 검증을 시작할게요."],
      },
      stageStartedAt: timestamp,
      checkpointMessageId: undefined,
    }

    store.upsert(nextState)
    await sendChunkedThreadMessage(thread, reply)
    await sendChunkedThreadMessage(thread, buildAutonomousStageStartReply(nextState))
    return nextState
  }

  if (state.stage === "IMPLEMENTATION") {
    const deployingState = withJobDetail(baseState, [
      "구현과 1차 검증 정리 완료",
      "Vercel preview를 배포하고 있어요.",
    ])
    store.upsert(deployingState)
    await syncActivityCard(thread, deployingState)

    const preview = await deployPreviewForState(deployingState)
    const stageSummary = await summarizeStageTransition({
      thread,
      state,
      toStage: "PREVIEW_REVIEW",
      stageReply: reply,
    })

    const nextState: SprintThreadState = {
      ...baseState,
      stage: "PREVIEW_REVIEW",
      status: "WAITING_FOR_APPROVAL",
      latestStageSummary: stageSummary,
      preview,
      job: {
        ...baseState.job,
        detailLines: ["preview 배포 완료", "이제 링크를 보고 수정할지 결정하면 돼요."],
      },
      stageStartedAt: timestamp,
      checkpointMessageId: undefined,
    }

    store.upsert(nextState)
    await sendChunkedThreadMessage(thread, reply)
    await sendChunkedThreadMessage(
      thread,
      [
        "배포 확인 링크를 만들었어요. 직접 보고 다음 결정을 내려주세요.",
        ...buildLatestStageSummarySection(stageSummary),
        "",
        `- preview: ${preview.url}${preview.ready ? "" : " (아직 준비 중일 수 있어요)"}`,
        "- 더 고칠 게 있으면 `수정 더 하기`",
        "- 이대로 괜찮으면 `완료, main 반영`",
      ].join("\n"),
    )
    return postStageControlMessage(thread, nextState)
  }

  if (state.stage === "MERGE") {
    const mergeNeedsHuman = reply.includes("여기서 사람이 확인해야 해요") || /\bblocker\b/i.test(reply)

    if (mergeNeedsHuman) {
      const blockedState: SprintThreadState = {
        ...baseState,
        status: "BLOCKED",
        job: {
          status: "FAILED",
          stage: state.stage,
          label: workflowStageLabel(state),
          startedAt: state.job?.startedAt,
          updatedAt: timestamp,
          summary: summarizeJobText(reply),
          error: summarizeJobText(reply, 240),
          detailLines: ["main 반영 확인 필요"],
        },
      }

      store.upsert(blockedState)
      await sendChunkedThreadMessage(thread, reply)
      await sendChunkedThreadMessage(thread, "main 반영이 막혀서 여기서 멈췄어요. `/status`로 상태를 확인하고 필요한 정리를 한 뒤 다시 이어가면 돼요.")
      return postStageControlMessage(thread, blockedState)
    }

    const stageSummary = await summarizeStageTransition({
      thread,
      state,
      toStage: "DONE",
      stageReply: reply,
    })

    const nextState: SprintThreadState = {
      ...baseState,
      stage: "DONE",
      status: "DONE",
      latestStageSummary: stageSummary,
      job: {
        ...baseState.job,
        detailLines: ["main 반영 정리 완료"],
      },
      stageStartedAt: timestamp,
      checkpointMessageId: undefined,
    }

    store.upsert(nextState)
    await sendChunkedThreadMessage(thread, reply)
    await sendChunkedThreadMessage(
      thread,
      [
        "여기까지 자동 반영을 끝냈어요.",
        ...buildLatestStageSummarySection(stageSummary),
      ].join("\n"),
    )
    return nextState
  }

  store.upsert(baseState)
  await sendChunkedThreadMessage(thread, reply)
  return baseState
}

async function runAutonomousStageCycle(threadId: string) {
  if (runningAutomationThreads.has(threadId)) {
    return
  }

  runningAutomationThreads.add(threadId)
  let rescheduleAfterRelease = false

  try {
    while (true) {
      const state = store.get(threadId)

      if (!state || !isAutonomousStage(state.stage) || state.status !== "ACTIVE") {
        break
      }

      const channel = await client.channels.fetch(threadId).catch(() => null)

      if (!channel?.isThread()) {
        break
      }

      const thread = channel
      let runningState: SprintThreadState = withJobDetail(buildRunningJobState(state), ["작업 준비 중", "worktree 상태를 확인하고 있어요."])
      store.upsert(runningState)
      runningState = await syncActivityCard(thread, runningState)
      await refreshStoredControlMessage(thread, runningState)
      jobLogger.append({
        at: nowIso(),
        threadId: runningState.threadId,
        sprintKey: runningState.sprintKey,
        stage: runningState.stage,
        kind: "job.started",
        detail: runningState.job?.label,
      })

      try {
        ensureGitWorktree({
          repoRoot: env.repoRoot,
          branchName: runningState.branchName,
          worktreePath: runningState.worktreePath,
        })

        runningState = withJobDetail(runningState, [
          "worktree 준비 완료",
          `${workflowStageLabel(runningState)} 작업을 Codex가 진행 중이에요.`,
        ])
        store.upsert(runningState)
        runningState = await syncActivityCard(thread, runningState)
        await refreshStoredControlMessage(thread, runningState)

        const result =
          runningState.stage === "MERGE"
            ? await runMainMergeOperator({
                repoRoot: env.repoRoot,
                state: runningState,
              })
            : await runAutonomousWorker(threadId, runningState, thread)

        if (!isCurrentAutonomousJob(store.get(threadId), runningState)) {
          rescheduleAfterRelease = true
          logDiscardedAutonomousJob(runningState, "stage changed before worker completed")
          break
        }

        const nextState = await advanceAfterAutonomousStage(thread, runningState, result.reply)
        jobLogger.append({
          at: nowIso(),
          threadId: nextState.threadId,
          sprintKey: nextState.sprintKey,
          stage: runningState.stage,
          kind: "job.completed",
          detail: summarizeJobText(result.reply),
        })

        if (!isAutonomousStage(nextState.stage) || nextState.status !== "ACTIVE") {
          break
        }
      } catch (error) {
        automationAbortControllers.delete(threadId)

        if (!isCurrentAutonomousJob(store.get(threadId), runningState)) {
          rescheduleAfterRelease = true
          logDiscardedAutonomousJob(runningState, "stage changed before worker failed")
          break
        }

        const failure = describeAutonomousStageError(error, runningState)
        const failedState = buildFailedJobState(runningState, failure)
        store.upsert(failedState)
        await syncActivityCard(thread, failedState)
        jobLogger.append({
          at: nowIso(),
          threadId: failedState.threadId,
          sprintKey: failedState.sprintKey,
          stage: failedState.stage,
          kind: "job.failed",
          detail: summarizeJobText(failure.logDetail, 900),
        })
        await sendChunkedThreadMessage(
          thread,
          [
            `여기서 잠깐 멈췄어요. 지금은 **${workflowStageLabel(failedState)}** 단계예요.`,
            `- 원인: ${failure.summary}`,
            ...failure.details.map((line) => `- ${line}`),
            "- `/status`로 상태를 확인하고, 필요한 방향을 말해주면 다시 이어갈게요.",
          ].join("\n"),
        )
        break
      }
    }
  } finally {
    automationAbortControllers.delete(threadId)
    runningAutomationThreads.delete(threadId)

    if (rescheduleAfterRelease) {
      const latestState = store.get(threadId)

      if (latestState && isAutonomousStage(latestState.stage) && latestState.status === "ACTIVE") {
        scheduleAutonomousStage(threadId)
      }
    }
  }
}

async function runAutonomousWorker(
  threadId: string,
  runningState: SprintThreadState,
  thread: ThreadChannel,
) {
  const transcript = await buildAutomationTranscript(thread)
  const abortController = new AbortController()
  automationAbortControllers.set(threadId, abortController)

  try {
    return isDesignSystemWorkflow(runningState)
      ? await runDesignSystemStageWorker({
          worktreePath: runningState.worktreePath,
          state: runningState,
          transcript,
          references: runningState.referenceAttachments ?? [],
          signal: abortController.signal,
        })
      : await runCodexStageWorker({
          worktreePath: runningState.worktreePath,
          state: runningState,
          transcript,
          signal: abortController.signal,
        })
  } finally {
    automationAbortControllers.delete(threadId)
  }
}

function scheduleAutonomousStage(threadId: string) {
  if (runningAutomationThreads.has(threadId) || queuedAutomationThreads.has(threadId)) {
    return
  }

  queuedAutomationThreads.add(threadId)
  drainAutonomousStageQueue()
}

function drainAutonomousStageQueue() {
  while (activeAutomationWorkerCount < MAX_AUTONOMOUS_STAGE_WORKERS && queuedAutomationThreads.size > 0) {
    const nextThreadId = queuedAutomationThreads.values().next().value

    if (!nextThreadId) {
      break
    }

    queuedAutomationThreads.delete(nextThreadId)

    if (runningAutomationThreads.has(nextThreadId)) {
      continue
    }

    activeAutomationWorkerCount += 1
    void runAutonomousStageCycle(nextThreadId).finally(() => {
      activeAutomationWorkerCount = Math.max(0, activeAutomationWorkerCount - 1)
      drainAutonomousStageQueue()
    })
  }
}

async function buildConversationReply(thread: ThreadChannel, state: SprintThreadState, content: string, currentMessageId: string) {
  const transcript = await buildThreadTranscript(thread, currentMessageId)

  try {
    const result = await runCodexDiscussionReply({
      repoRoot: env.repoRoot,
      sprintId: state.sprintId,
      featureSlug: state.featureSlug,
      stage: state.stage,
      status: state.status,
      transcript,
      latestMessage: content,
      sessionId: state.codexSessionId,
    })

    if (result.reply) {
      const nextState =
        result.sessionId && result.sessionId !== state.codexSessionId
          ? {
              ...state,
              codexSessionId: result.sessionId,
              updatedAt: nowIso(),
            }
          : state

      return {
        reply: result.reply,
        nextState,
      }
    }
  } catch (error) {
    console.error(
      `[discord-bridge] failed to generate Codex discussion reply (${state.sprintId}/${state.featureSlug} ${state.stage}, session=${state.codexSessionId ?? "none"})`,
    )
    console.error(error)

    if (state.codexSessionId) {
      try {
        console.error(
          `[discord-bridge] retrying with a fresh Codex session (${state.sprintId}/${state.featureSlug} ${state.stage})`,
        )

        const recreated = await runCodexDiscussionReply({
          repoRoot: env.repoRoot,
          sprintId: state.sprintId,
          featureSlug: state.featureSlug,
          stage: state.stage,
          status: state.status,
          transcript,
          latestMessage: content,
        })

        if (recreated.reply) {
          return {
            reply: recreated.reply,
            nextState: {
              ...state,
              codexSessionId: recreated.sessionId || undefined,
              updatedAt: nowIso(),
            },
          }
        }
      } catch (retryError) {
        console.error(
          `[discord-bridge] failed to recreate Codex session (${state.sprintId}/${state.featureSlug} ${state.stage})`,
        )
        console.error(retryError)
      }
    }
  }

  console.error(`[discord-bridge] fallback reply used (${state.sprintId}/${state.featureSlug} ${state.stage})`)
  return {
    reply: buildConversationFallbackReply(state, content),
    nextState: state.codexSessionId
      ? {
          ...state,
          codexSessionId: undefined,
          updatedAt: nowIso(),
        }
      : state,
  }
}

async function removeOwnReaction(message: Message, emoji: string) {
  try {
    const reaction = message.reactions.cache.find((item) => item.emoji.name === emoji)

    if (!reaction || !client.user) {
      return
    }

    await reaction.users.remove(client.user.id)
  } catch (error) {
    console.error(`Failed to remove ${emoji} reaction.`)
    console.error(error)
  }
}

async function safeReact(message: Message, emoji: string) {
  try {
    await message.react(emoji)
  } catch (error) {
    console.error(`Failed to react with ${emoji}.`)
    console.error(error)
  }
}

async function resolveExistingSprintThread(sprintKey: string) {
  const existing = store.findLatestOpenByBaseSprintKey(sprintKey)

  if (!existing || existing.status === "DONE") {
    return null
  }

  const channel = await client.channels.fetch(existing.threadId).catch(() => null)

  if (!channel?.isThread()) {
    return null
  }

  return {
    thread: channel,
    state: existing,
  }
}

async function resolveSprintParentChannel(interaction: ChatInputCommandInteraction | ButtonInteraction) {
  if (interaction.channel?.type === ChannelType.GuildText) {
    return interaction.channel
  }

  if (interaction.channel?.isThread()) {
    const parent = interaction.channel.parent

    if (parent?.type === ChannelType.GuildText) {
      return parent
    }
  }

  throw new Error("스프린트 스레드는 일반 텍스트 채널에서만 새로 만들 수 있어요.")
}

async function createSprintThreadInChannel(
  channel: GuildTextBasedChannel,
  sprintId: string,
  featureSlug: string,
  runNumber = 1,
) {
  const threadName = runNumber <= 1 ? `${sprintId}-${featureSlug}` : `${sprintId}-${featureSlug}-${runNumber}`
  const starterMessage = await channel.send({
    content:
      runNumber <= 1
        ? `\`${sprintId}/${featureSlug}\` 스프린트 스레드를 만드는 중이에요...`
        : `\`${sprintId}/${featureSlug}\` 스프린트를 ${runNumber}차 실행으로 다시 만드는 중이에요...`,
  })

  return starterMessage.startThread({
    name: threadName,
    autoArchiveDuration: 1440,
    reason: `${sprintId}/${featureSlug} 스프린트 제어 스레드`,
  })
}

function buildSprintState(params: {
  thread: ThreadChannel
  sprintId: string
  featureSlug: string
  baseSprintKey: string
  runNumber: number
}) {
  const runSprintKey = getRunSprintKey(params.baseSprintKey, params.runNumber)
  const worktreeName = getWorktreeName(runSprintKey)
  const branchName = getBranchName(runSprintKey)
  const worktreePath = getWorktreePath(env.worktreeRoot, worktreeName)
  const timestamp = nowIso()

  const state: SprintThreadState = {
    threadId: params.thread.id,
    parentChannelId: params.thread.parentId ?? env.DISCORD_SPRINT_CHANNEL_ID,
    guildId: params.thread.guildId,
    sprintId: params.sprintId,
    featureSlug: params.featureSlug,
    baseSprintKey: params.baseSprintKey,
    sprintKey: runSprintKey,
    runNumber: params.runNumber,
    stage: "DISCOVERY_WORKSHOP",
    status: "WAITING_FOR_APPROVAL",
    worktreeName,
    worktreePath,
    branchName,
    job: {
      status: "IDLE",
    },
    stageStartedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  return state
}

function toReferenceAttachment(attachment: Attachment): SprintReferenceAttachment {
  return {
    id: attachment.id,
    url: attachment.url,
    name: attachment.name,
    contentType: attachment.contentType ?? undefined,
    size: attachment.size,
  }
}

function getDesignSystemCommandReferences(interaction: ChatInputCommandInteraction) {
  return ["reference", "reference2", "reference3"]
    .map((name) => interaction.options.getAttachment(name))
    .filter((attachment): attachment is Attachment => Boolean(attachment))
    .map(toReferenceAttachment)
}

function getMessageReferences(message: Message) {
  return [...message.attachments.values()].map(toReferenceAttachment)
}

function mergeReferenceAttachments(
  current: SprintReferenceAttachment[] | undefined,
  next: SprintReferenceAttachment[],
) {
  const byId = new Map<string, SprintReferenceAttachment>()

  for (const reference of [...(current ?? []), ...next]) {
    byId.set(reference.id, reference)
  }

  return [...byId.values()]
}

function buildDesignSystemState(params: {
  thread: ThreadChannel
  featureSlug: string
  baseSprintKey: string
  runNumber: number
  sourceBrief?: string
  referenceAttachments?: SprintReferenceAttachment[]
}) {
  const runSprintKey = getRunSprintKey(params.baseSprintKey, params.runNumber)
  const worktreeName = getWorktreeName(runSprintKey)
  const branchName = getBranchName(runSprintKey)
  const worktreePath = getWorktreePath(env.worktreeRoot, worktreeName)
  const timestamp = nowIso()

  const state: SprintThreadState = {
    threadId: params.thread.id,
    parentChannelId: params.thread.parentId ?? env.DISCORD_SPRINT_CHANNEL_ID,
    guildId: params.thread.guildId,
    sprintId: "design-system",
    featureSlug: params.featureSlug,
    baseSprintKey: params.baseSprintKey,
    sprintKey: runSprintKey,
    runNumber: params.runNumber,
    stage: "IMPLEMENTATION",
    status: "ACTIVE",
    worktreeName,
    worktreePath,
    branchName,
    job: {
      status: "IDLE",
      stage: "IMPLEMENTATION",
      label: "1. example 구현",
    },
    stageStartedAt: timestamp,
    workflowKind: "design_system",
    sourceBrief: params.sourceBrief,
    referenceAttachments: params.referenceAttachments ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  return state
}

async function sendKickoff(thread: ThreadChannel, state: SprintThreadState) {
  await thread.send(
    [
      `\`${state.sprintId}/${state.featureSlug}\` 스프린트를 시작했어요.`,
      `- 실행: ${formatRunLabel(state)}`,
      "",
      "이 스레드에서는 편하게 이야기하면 돼요.",
      "- 같이 정해야 하는 건 끝까지 같이 정리할게요.",
      "- 내가 알아서 진행하는 구간은 중간 결과만 알려드릴게요.",
      "",
      "실행 정보",
      `- worktree: \`${state.worktreeName}\``,
      `- branch: \`${state.branchName}\``,
      `- worktree path: \`${state.worktreePath}\``,
      "",
      "지금 할 일",
      `- ${workflowStageSummary(state)}`,
    ].join("\n"),
  )

  const gateCard = buildStageControlCard(state)

  if (!gateCard) {
    await syncActivityCard(thread, state)
    return
  }

  const gateMessage = await thread.send(gateCard)
  const nextState = {
    ...state,
    checkpointMessageId: gateMessage.id,
  }

  store.upsert(nextState)
  await syncActivityCard(thread, nextState)
}

async function sendDesignSystemKickoff(thread: ThreadChannel, state: SprintThreadState) {
  await thread.send(
    [
      `\`${state.featureSlug}\` 디자인 시스템 example 작업을 시작했어요.`,
      `- route: \`/design-system/examples/${state.featureSlug}\``,
      `- 실행: ${formatRunLabel(state)}`,
      `- 참고 첨부: ${state.referenceAttachments?.length ?? 0}개`,
      "",
      "진행 방식",
      "- 스크린샷과 설명을 분석해 바로 example을 구현해요.",
      "- 기존 컴포넌트를 먼저 쓰고, 필요하면 variant를 추가해요.",
      "- 정말 없는 패턴만 새 컴포넌트나 토큰으로 정리해요.",
      "- 끝나면 Vercel preview 링크를 올리고, 그때 한 번만 확인하면 돼요.",
      "",
      "실행 정보",
      `- worktree: \`${state.worktreeName}\``,
      `- branch: \`${state.branchName}\``,
      `- worktree path: \`${state.worktreePath}\``,
    ].join("\n"),
  )

  const postedState = await postStageControlMessage(thread, state)
  scheduleAutonomousStage(postedState.threadId)
}

async function postStageControlMessage(thread: ThreadChannel, state: SprintThreadState) {
  const controlCard = buildStageControlCard(state)

  if (!controlCard) {
    await syncActivityCard(thread, state)
    return state
  }

  const controlMessage = await thread.send(controlCard)

  const nextState: SprintThreadState = {
    ...state,
    checkpointMessageId: controlMessage.id,
  }

  store.upsert(nextState)
  return syncActivityCard(thread, nextState)
}

async function handleSprint(interaction: ChatInputCommandInteraction) {
  const featureSlug = interaction.options.getString("feature", true).trim().toLowerCase()
  const sprintId =
    interaction.options.getString("sprint")?.trim().toLowerCase() ?? env.DISCORD_DEFAULT_SPRINT_ID
  const baseSprintKey = getSprintKey(sprintId, featureSlug)
  const existing = await resolveExistingSprintThread(baseSprintKey)

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  if (existing) {
    await interaction.editReply(buildExistingSprintChoice(existing.state))
    return
  }

  const existingThread = interaction.channel?.isThread() ? interaction.channel : null
  let thread: ThreadChannel

  if (existingThread) {
    thread = existingThread
  } else if (interaction.channel?.type === ChannelType.GuildText) {
    thread = await createSprintThreadInChannel(interaction.channel, sprintId, featureSlug, 1)
  } else {
    throw new Error("`/sprint`는 일반 텍스트 채널이나 기존 스프린트 스레드 안에서 실행해주세요.")
  }
  const state = buildSprintState({
    thread,
    sprintId,
    featureSlug,
    baseSprintKey,
    runNumber: 1,
  })

  store.upsert(state)
  await interaction.editReply({
    content: `스프린트 스레드를 만들었어요: <#${thread.id}>`,
  })
  await sendKickoff(thread, state)
}

async function handleDesignSystem(interaction: ChatInputCommandInteraction) {
  const exampleSlug = normalizeExampleSlug(interaction.options.getString("example", true))
  const sourceBrief = interaction.options.getString("brief")?.trim()
  const referenceAttachments = getDesignSystemCommandReferences(interaction)

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  if (!exampleSlug) {
    await interaction.editReply({
      content: "`example`은 영문/숫자 기반 slug로 입력해주세요. 예: `weekly-rewind-page`",
    })
    return
  }

  if (!sourceBrief && referenceAttachments.length === 0) {
    await interaction.editReply({
      content: "`brief`나 참고 이미지를 하나 이상 넣어주세요. 그래야 example을 바로 구현할 수 있어요.",
    })
    return
  }

  const baseSprintKey = getSprintKey("design-system", exampleSlug)
  const existing = await resolveExistingSprintThread(baseSprintKey)

  if (existing) {
    await interaction.editReply(buildExistingSprintChoice(existing.state))
    return
  }

  const parentChannel = await resolveSprintParentChannel(interaction)
  const runNumber = store.getNextRunNumber(baseSprintKey)
  const thread = await createSprintThreadInChannel(parentChannel, "design-system", exampleSlug, runNumber)
  const state = buildDesignSystemState({
    thread,
    featureSlug: exampleSlug,
    baseSprintKey,
    runNumber,
    sourceBrief,
    referenceAttachments,
  })

  store.upsert(state)
  await interaction.editReply({
    content: `디자인 시스템 example 작업 스레드를 만들었어요: <#${thread.id}>`,
  })
  await sendDesignSystemKickoff(thread, state)
}

async function handleStatus(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  const threadId = interaction.channel?.isThread() ? interaction.channel.id : null

  if (threadId) {
    const state = store.get(threadId)

    if (!state) {
      await interaction.editReply({
        content: "이 스레드는 아직 스프린트 스레드로 등록되지 않았어요.",
      })
      return
    }

    await interaction.editReply({
      content: [
        formatDetailStatus(state),
        "",
        "이 메시지에서도 바로 이어서 진행하거나 종료할 수 있어요.",
      ].join("\n"),
      components: buildStageButtons(state),
    })
    return
  }

  if (interaction.channel?.id !== env.DISCORD_SPRINT_CHANNEL_ID) {
    await interaction.editReply({
      content: "`/status`는 스프린트 스레드 안이나 `#toda-sprints` 채널에서 실행해주세요.",
    })
    return
  }

  const states = store.list().filter((state) => state.parentChannelId === env.DISCORD_SPRINT_CHANNEL_ID)
  await interaction.editReply({
    content: formatChannelSummary(states),
  })
}

async function handleExistingContinue(interaction: ButtonInteraction, threadId: string) {
  const state = store.get(threadId)

  if (!state) {
    await interaction.reply({
      content: "기존 스프린트 정보를 찾지 못했어요. `/sprint`를 다시 실행해주세요.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const resumedState =
    state.status === "PAUSED"
      ? {
          ...state,
          status: statusFromStage(state.stage),
          job:
            state.status === "PAUSED"
              ? {
                  ...(state.job ?? { status: "IDLE" as const }),
                  updatedAt: nowIso(),
                }
              : state.job,
          updatedAt: nowIso(),
        }
      : state

  if (resumedState !== state) {
    store.upsert(resumedState)
    if (isAutonomousStage(resumedState.stage) && resumedState.status === "ACTIVE") {
      scheduleAutonomousStage(resumedState.threadId)
    }
  }

  await interaction.update({
    content: [
      "좋아요. 기존 스레드에서 이어서 진행할게요.",
      `- 스레드: <#${resumedState.threadId}>`,
      `- 실행: ${formatRunLabel(resumedState)}`,
      `- 단계: ${workflowStageLabel(resumedState)}`,
      `- 상태: ${statusLabel(resumedState.status)}`,
    ].join("\n"),
    components: [],
  })
}

async function handleExistingRestart(interaction: ButtonInteraction, threadId: string) {
  const existingState = store.get(threadId)

  if (!existingState) {
    await interaction.reply({
      content: "기존 스프린트 정보를 찾지 못했어요. `/sprint`를 다시 실행해주세요.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const parentChannel = await resolveSprintParentChannel(interaction)
  const baseSprintKey = getStateBaseSprintKey(existingState)
  const runNumber = store.getNextRunNumber(baseSprintKey)
  const thread = await createSprintThreadInChannel(
    parentChannel,
    existingState.sprintId,
    existingState.featureSlug,
    runNumber,
  )

  const pausedState: SprintThreadState = {
    ...existingState,
    status: "PAUSED",
    updatedAt: nowIso(),
  }

  store.upsert(pausedState)

  const nextState = isDesignSystemWorkflow(existingState)
    ? buildDesignSystemState({
        thread,
        featureSlug: existingState.featureSlug,
        baseSprintKey,
        runNumber,
        sourceBrief: existingState.sourceBrief,
        referenceAttachments: existingState.referenceAttachments,
      })
    : buildSprintState({
        thread,
        sprintId: existingState.sprintId,
        featureSlug: existingState.featureSlug,
        baseSprintKey,
        runNumber,
      })

  store.upsert(nextState)

  const previousThread = await client.channels.fetch(existingState.threadId).catch(() => null)

  if (previousThread?.isThread()) {
    await disableStoredControlMessage(previousThread, existingState, "새 실행으로 이동됨")
    await previousThread.send(
      [
        `이 ${workflowName(existingState)} 작업은 새 스레드에서 다시 시작할게요.`,
        `- 새 스레드: <#${thread.id}>`,
        `- 현재 상태: ${statusLabel(pausedState.status)}`,
      ].join("\n"),
    )
  }

  await interaction.update({
    content: [
      "새 스레드로 다시 시작했어요.",
      `- 새 스레드: <#${thread.id}>`,
      `- 실행: ${formatRunLabel(nextState)}`,
      `- 이전 스레드는 잠시 멈춰둘게요: <#${existingState.threadId}>`,
    ].join("\n"),
    components: [],
  })

  if (isDesignSystemWorkflow(nextState)) {
    await sendDesignSystemKickoff(thread, nextState)
  } else {
    await sendKickoff(thread, nextState)
  }
}

async function disableStoredControlMessage(thread: ThreadChannel, state: SprintThreadState, statusText: string) {
  if (!state.checkpointMessageId) {
    return
  }

  const checkpointMessage = await thread.messages.fetch(state.checkpointMessageId).catch(() => null)

  if (!checkpointMessage) {
    return
  }

  await checkpointMessage.edit({
    content: `${checkpointMessage.content}\n\n상태: ${statusText}`,
    components: [],
  })
}

async function refreshStoredControlMessage(thread: ThreadChannel, state: SprintThreadState) {
  if (!state.checkpointMessageId) {
    return
  }

  const controlCard = buildStageControlCard(state)

  if (!controlCard) {
    return
  }

  const checkpointMessage = await thread.messages.fetch(state.checkpointMessageId).catch(() => null)

  if (!checkpointMessage) {
    return
  }

  await checkpointMessage.edit(controlCard).catch(() => null)
}

async function finalizeSprintTermination(thread: ThreadChannel, state: SprintThreadState) {
  await disableStoredControlMessage(thread, state, "파기 후 종료됨")

  if (fs.existsSync(state.worktreePath)) {
    fs.rmSync(state.worktreePath, { recursive: true, force: true })
  }

  const nextState: SprintThreadState = {
    ...state,
    stage: "DONE",
    status: "DONE",
    job: {
      status: "IDLE",
      stage: "DONE",
      label: "종료",
      updatedAt: nowIso(),
      summary: "사용자 요청으로 스프린트를 종료했어요.",
    },
    checkpointMessageId: undefined,
    updatedAt: nowIso(),
  }

  store.upsert(nextState)
  await syncActivityCard(thread, nextState)

  await sendChunkedThreadMessage(
    thread,
    [
      "이번 스프린트는 여기서 끝낼게요.",
      "- worktree는 정리했어요.",
      "- 이 스레드는 종료 기록으로 남기고 닫아둘게요.",
    ].join("\n"),
  )

  await thread.setArchived(true).catch((error) => {
    console.error("Failed to archive terminated sprint thread.")
    console.error(error)
  })
}

async function handleTerminateRequest(interaction: ButtonInteraction) {
  if (!interaction.channel?.isThread()) {
    await interaction.reply({
      content: "이 버튼은 스프린트 스레드 안에서만 사용할 수 있어요.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const state = store.get(interaction.channel.id)

  if (!state) {
    await interaction.reply({
      content: "이 스레드는 아직 스프린트 스레드로 등록되지 않았어요.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  await interaction.reply({
    content: [
      "정말 여기서 끝낼까요?",
      "- worktree를 지우고",
      "- 이 스레드를 종료 상태로 바꾸고",
      "- 스레드를 닫아둘게요.",
    ].join("\n"),
    flags: MessageFlags.Ephemeral,
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`${TERMINATE_CONFIRM_PREFIX}:${state.threadId}`)
          .setLabel("정말 종료할게요")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`${TERMINATE_CANCEL_PREFIX}:${state.threadId}`)
          .setLabel("계속 진행할게요")
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
  })
}

async function handleTerminateCancel(interaction: ButtonInteraction) {
  await interaction.update({
    content: "좋아요. 이 스프린트는 계속 진행할게요.",
    components: [],
  })
}

async function handleTerminateConfirm(interaction: ButtonInteraction, threadId: string) {
  const state = store.get(threadId)

  if (!state) {
    await interaction.update({
      content: "이미 종료됐거나 스프린트 정보를 찾지 못했어요.",
      components: [],
    })
    return
  }

  const thread = await client.channels.fetch(threadId).catch(() => null)

  if (!thread?.isThread()) {
    await interaction.update({
      content: "스프린트 스레드를 찾지 못했어요.",
      components: [],
    })
    return
  }

  await interaction.update({
    content: "여기서 정리할게요.",
    components: [],
  })

  await finalizeSprintTermination(thread, state)
}

async function disableStageControlMessage(interaction: ButtonInteraction, state: SprintThreadState, statusText: string) {
  const gateCard = buildStageControlCard(state)

  if (!gateCard) {
    return
  }

  await interaction.message.edit({
    content: `${gateCard.content}\n\n상태: ${statusText}`,
    components: buildStageButtons(state, true),
  })
}

async function disableClickedStageButtons(interaction: ButtonInteraction, state: SprintThreadState, statusText: string) {
  const baseContent = interaction.message.content?.trim()
  const content = baseContent ? `${baseContent}\n\n상태: ${statusText}` : `상태: ${statusText}`

  await interaction.message
    .edit({
      content,
      components: buildStageButtons(state, true),
    })
    .catch(() => null)
}

async function advanceToNextStageFromThread(params: {
  thread: ThreadChannel
  state: SprintThreadState
  operatorId: string
  currentMessageId?: string
  statusText?: string
}) {
  const nextStage = nextTextCommandStage(params.state.stage)

  if (!nextStage) {
    return null
  }

  await disableStoredControlMessage(params.thread, params.state, params.statusText ?? "텍스트 명령으로 다음 단계 진행됨")

  const stageSummary = await summarizeStageTransition({
    thread: params.thread,
    state: params.state,
    toStage: nextStage,
    currentMessageId: params.currentMessageId,
  })

  const nextStartedAt = nowIso()
  const nextState: SprintThreadState = {
    ...params.state,
    stage: nextStage,
    status: statusFromStage(nextStage),
    latestStageSummary: stageSummary,
    job: {
      status: "IDLE",
      stage: nextStage,
      label: workflowStageLabel(params.state, nextStage),
      updatedAt: nextStartedAt,
    },
    stageStartedAt: nextStartedAt,
    checkpointMessageId: undefined,
    lastOperatorMessageId: params.operatorId,
    updatedAt: nextStartedAt,
  }

  store.upsert(nextState)
  abortRunningAutonomousStage(params.state.threadId)
  await sendChunkedThreadMessage(params.thread, buildAutonomousStageStartReply(nextState))
  const postedState = await postStageControlMessage(params.thread, nextState)

  if (isAutonomousStage(postedState.stage) && postedState.status === "ACTIVE") {
    scheduleAutonomousStage(postedState.threadId)
  }

  return postedState
}

async function retryAutonomousStageFromThread(thread: ThreadChannel, state: SprintThreadState) {
  if (!isAutonomousStage(state.stage)) {
    return null
  }

  if (state.status === "ACTIVE" && state.job?.status === "RUNNING") {
    return state
  }

  const timestamp = nowIso()
  const nextState: SprintThreadState = {
    ...state,
    status: "ACTIVE",
    job: {
      status: "IDLE",
      stage: state.stage,
      label: workflowStageLabel(state),
      updatedAt: timestamp,
      summary: state.job?.summary,
      error: undefined,
    },
    updatedAt: timestamp,
  }

  store.upsert(nextState)
  await syncActivityCard(thread, nextState)
  scheduleAutonomousStage(nextState.threadId)
  return nextState
}

async function applyPreviewDecisionFromThread(params: {
  thread: ThreadChannel
  state: SprintThreadState
  mode: "revise" | "approve"
  operatorId: string
  currentMessageId?: string
}) {
  if (params.state.stage !== "PREVIEW_REVIEW") {
    return null
  }

  const nextStage: SprintStage = params.mode === "revise" ? (isDesignSystemWorkflow(params.state) ? "IMPLEMENTATION" : "TECHNICAL_FREEZE") : "MERGE"
  const disabledStatusText = params.mode === "revise" ? "텍스트 명령으로 수정 작업으로 돌아감" : "텍스트 명령으로 main 반영 진행됨"

  await disableStoredControlMessage(params.thread, params.state, disabledStatusText)

  const stageSummary = await summarizeStageTransition({
    thread: params.thread,
    state: params.state,
    toStage: nextStage,
    currentMessageId: params.currentMessageId,
  })

  const nextStartedAt = nowIso()
  const nextState: SprintThreadState = {
    ...params.state,
    stage: nextStage,
    status: statusFromStage(nextStage),
    latestStageSummary: stageSummary,
    preview: params.mode === "revise" ? undefined : params.state.preview,
    job: {
      status: "IDLE",
      stage: nextStage,
      label: workflowStageLabel(params.state, nextStage),
      updatedAt: nextStartedAt,
    },
    stageStartedAt: nextStartedAt,
    checkpointMessageId: undefined,
    lastOperatorMessageId: params.operatorId,
    updatedAt: nextStartedAt,
  }

  store.upsert(nextState)
  await sendChunkedThreadMessage(params.thread, buildAutonomousStageStartReply(nextState))
  const postedState = await postStageControlMessage(params.thread, nextState)

  if (isAutonomousStage(postedState.stage) && postedState.status === "ACTIVE") {
    scheduleAutonomousStage(postedState.threadId)
  }

  return postedState
}

async function handleGateApprove(interaction: ButtonInteraction) {
  if (!interaction.channel?.isThread()) {
    await interaction.reply({
      content: "이 버튼은 스프린트 스레드 안에서만 사용할 수 있어요.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  const state = store.get(interaction.channel.id)

  if (!state) {
    await interaction.editReply({
      content: "이 스레드는 아직 스프린트 스레드로 등록되지 않았어요.",
    })
    return
  }

  const nextStage = nextAutomaticStage(state.stage)

  if (!nextStage) {
    await interaction.editReply({
      content: `현재 단계 \`${state.stage}\`에서는 수동 승인이 열려 있지 않아요.`,
    })
    return
  }

  await disableStageControlMessage(interaction, state, "다음 단계로 진행됨")

  if (interaction.message.id !== state.checkpointMessageId && interaction.channel.isThread()) {
    await disableStoredControlMessage(interaction.channel, state, "다음 단계로 진행됨")
  }

  const stageSummary = await summarizeStageTransition({
    thread: interaction.channel,
    state,
    toStage: nextStage,
  })

  const nextStartedAt = nowIso()

  const nextState: SprintThreadState = {
    ...state,
    stage: nextStage,
    status: statusFromStage(nextStage),
    latestStageSummary: stageSummary,
    job: {
      status: "IDLE",
      stage: nextStage,
      label: workflowStageLabel(state, nextStage),
      updatedAt: nextStartedAt,
    },
    stageStartedAt: nextStartedAt,
    checkpointMessageId: undefined,
    lastOperatorMessageId: interaction.user.id,
    updatedAt: nextStartedAt,
  }

  store.upsert(nextState)
  await sendChunkedThreadMessage(interaction.channel, buildAutonomousStageStartReply(nextState))

  await postStageControlMessage(interaction.channel, nextState)
  await syncActivityCard(interaction.channel, nextState)

  await interaction.editReply({
    content: "다음 자동 단계로 넘겼어요.",
  })

  if (isAutonomousStage(nextState.stage) && nextState.status === "ACTIVE") {
    scheduleAutonomousStage(nextState.threadId)
  }
}

async function handlePreviewDecision(interaction: ButtonInteraction, mode: "revise" | "approve") {
  if (!interaction.channel?.isThread()) {
    await interaction.reply({
      content: "이 버튼은 스프린트 스레드 안에서만 사용할 수 있어요.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  const state = store.get(interaction.channel.id)

  if (!state) {
    await interaction.editReply({
      content: "이 스레드는 아직 스프린트 스레드로 등록되지 않았어요.",
    })
    return
  }

  if (state.stage !== "PREVIEW_REVIEW") {
    await interaction.editReply({
      content: "지금은 preview 확인 단계가 아니에요.",
    })
    return
  }

  const nextStage: SprintStage = mode === "revise" ? (isDesignSystemWorkflow(state) ? "IMPLEMENTATION" : "TECHNICAL_FREEZE") : "MERGE"
  const disabledStatusText = mode === "revise" ? "수정 작업으로 돌아감" : "main 반영으로 진행됨"

  await disableStageControlMessage(interaction, state, disabledStatusText)

  if (interaction.message.id !== state.checkpointMessageId && interaction.channel.isThread()) {
    await disableStoredControlMessage(interaction.channel, state, disabledStatusText)
  }

  const stageSummary = await summarizeStageTransition({
    thread: interaction.channel,
    state,
    toStage: nextStage,
  })

  const nextStartedAt = nowIso()
  const nextState: SprintThreadState = {
    ...state,
    stage: nextStage,
    status: statusFromStage(nextStage),
    latestStageSummary: stageSummary,
    preview: mode === "revise" ? undefined : state.preview,
    job: {
      status: "IDLE",
      stage: nextStage,
      label: workflowStageLabel(state, nextStage),
      updatedAt: nextStartedAt,
    },
    stageStartedAt: nextStartedAt,
    checkpointMessageId: undefined,
    lastOperatorMessageId: interaction.user.id,
    updatedAt: nextStartedAt,
  }

  store.upsert(nextState)
  await sendChunkedThreadMessage(interaction.channel, buildAutonomousStageStartReply(nextState))
  await postStageControlMessage(interaction.channel, nextState)
  await syncActivityCard(interaction.channel, nextState)

  await interaction.editReply({
    content: mode === "revise" ? "좋아요. 수정 사이클을 한 번 더 돌릴게요." : "좋아요. 이제 main 반영으로 넘어갈게요.",
  })

  if (isAutonomousStage(nextState.stage) && nextState.status === "ACTIVE") {
    scheduleAutonomousStage(nextState.threadId)
  }
}

async function handleAutonomousRetry(interaction: ButtonInteraction) {
  if (!interaction.channel?.isThread()) {
    await interaction.reply({
      content: "이 버튼은 스프린트 스레드 안에서만 사용할 수 있어요.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  const state = store.get(interaction.channel.id)

  if (!state) {
    await interaction.editReply({
      content: "이 스레드는 아직 스프린트 스레드로 등록되지 않았어요.",
    })
    return
  }

  if (!isAutonomousStage(state.stage)) {
    await interaction.editReply({
      content: "지금 단계는 자동 재시도가 필요하지 않아요.",
    })
    return
  }

  const nextState: SprintThreadState = {
    ...state,
    status: "ACTIVE",
    job: {
      status: "IDLE",
      stage: state.stage,
      label: workflowStageLabel(state),
      updatedAt: nowIso(),
      summary: state.job?.summary,
      error: undefined,
    },
    updatedAt: nowIso(),
  }

  store.upsert(nextState)
  await syncActivityCard(interaction.channel, nextState)
  await interaction.editReply({
    content: "좋아요. 같은 단계에서 다시 시도할게요.",
  })
  scheduleAutonomousStage(nextState.threadId)
}

async function handleNextStageButton(interaction: ButtonInteraction) {
  if (!interaction.channel?.isThread()) {
    await interaction.reply({
      content: "이 버튼은 스프린트 스레드 안에서만 사용할 수 있어요.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  const state = store.get(interaction.channel.id)

  if (!state) {
    await interaction.editReply({
      content: "이 스레드는 아직 스프린트 스레드로 등록되지 않았어요.",
    })
    return
  }

  await disableClickedStageButtons(interaction, state, "다음 단계로 진행됨")

  const nextState = await advanceToNextStageFromThread({
    thread: interaction.channel,
    state,
    operatorId: interaction.user.id,
    statusText: "다음 단계로 진행됨",
  })

  if (!nextState) {
    await interaction.editReply({
      content: state.stage === "DONE" ? "이미 완료된 스프린트예요." : `현재 단계 \`${state.stage}\`에서는 넘길 다음 단계가 없어요.`,
    })
    return
  }

  await interaction.editReply({
    content:
      isAutonomousStage(state.stage) && state.status === "ACTIVE" && state.job?.status === "RUNNING"
        ? "진행 중이던 작업은 중단하고 다음 단계로 넘겼어요."
        : "다음 단계로 넘겼어요.",
  })
}

async function ensurePreviewForThread(thread: ThreadChannel, state: SprintThreadState) {
  if (state.preview?.url) {
    return {
      nextState: state,
      reply: [
        "이미 preview 링크가 있어요.",
        `- preview: ${state.preview.url}${state.preview.ready ? "" : " (아직 준비 중일 수 있어요)"}`,
        `- 확인 URL: ${buildPreviewRouteUrl(state.preview, state.stage === "DEMO_REVIEW" || isDesignSystemWorkflow(state) ? getDemoRoute(state) : "/")}`,
      ].join("\n"),
    }
  }

  const deployingState = withJobDetail(state, [
    "preview URL 요청 받음",
    "Vercel preview를 배포하고 있어요.",
  ])
  store.upsert(deployingState)
  await syncActivityCard(thread, deployingState)

  const preview = await deployPreviewForState(deployingState)
  const timestamp = nowIso()
  const nextState: SprintThreadState = {
    ...deployingState,
    preview,
    job: {
      ...(deployingState.job ?? { status: "IDLE" as const }),
      status: "IDLE" as const,
      stage: deployingState.stage,
      label: workflowStageLabel(deployingState),
      updatedAt: timestamp,
      detailLines: ["preview 배포 완료"],
      error: undefined,
    },
    updatedAt: timestamp,
  }

  store.upsert(nextState)
  await syncActivityCard(thread, nextState)

  return {
    nextState,
    reply: [
      "외부 preview를 배포했어요.",
      `- preview: ${preview.url}${preview.ready ? "" : " (아직 준비 중일 수 있어요)"}`,
      `- 확인 URL: ${buildPreviewRouteUrl(preview, state.stage === "DEMO_REVIEW" || isDesignSystemWorkflow(state) ? getDemoRoute(state) : "/")}`,
      `- local: ${buildLocalDevRouteUrl(state.stage === "DEMO_REVIEW" || isDesignSystemWorkflow(state) ? getDemoRoute(state) : "/")}`,
    ].join("\n"),
  }
}

async function runThreadTextCommand(message: Message, state: SprintThreadState, command: ThreadTextCommand) {
  if (!message.channel.isThread()) {
    return null
  }

  if (command === "RETRY_STAGE") {
    const nextState = await retryAutonomousStageFromThread(message.channel, state)

    if (!nextState) {
      return "지금 단계는 자동 재시도가 필요하지 않아요. 다음 단계로 넘기려면 `다음 단계`라고 입력해주세요."
    }

    if (state.status === "ACTIVE" && state.job?.status === "RUNNING") {
      return `이미 **${workflowStageLabel(state)}** 작업이 진행 중이에요. 끝나면 다음 단계로 자동 전환돼요.`
    }

    return "좋아요. 같은 단계에서 다시 시도할게요. 끝나면 다음 단계로 자동 전환돼요."
  }

  if (command === "PREVIEW_REVISE" || command === "PREVIEW_APPROVE") {
    const nextState = await applyPreviewDecisionFromThread({
      thread: message.channel,
      state,
      mode: command === "PREVIEW_REVISE" ? "revise" : "approve",
      operatorId: message.author.id,
      currentMessageId: message.id,
    })

    if (!nextState) {
      return "지금은 preview 확인 단계가 아니에요."
    }

    return command === "PREVIEW_REVISE" ? "좋아요. 수정 사이클을 한 번 더 돌릴게요." : "좋아요. 이제 main 반영으로 넘어갈게요."
  }

  const nextState = await advanceToNextStageFromThread({
    thread: message.channel,
    state,
    operatorId: message.author.id,
    currentMessageId: message.id,
  })

  if (nextState) {
    if (isAutonomousStage(state.stage) && state.status === "ACTIVE" && state.job?.status === "RUNNING") {
      return "진행 중이던 작업은 중단하고 다음 단계로 넘겼어요."
    }

    return "다음 단계로 넘겼어요."
  }

  if (isAutonomousStage(state.stage)) {
    if (state.status === "ACTIVE" && state.job?.status === "RUNNING") {
      return `지금은 **${workflowStageLabel(state)}** 작업이 진행 중이에요. 끝나면 다음 단계로 자동 전환돼요.`
    }

    const retriedState = await retryAutonomousStageFromThread(message.channel, state)

    if (retriedState) {
      return "현재 단계가 막혀 있어서 같은 단계부터 다시 시도할게요. 끝나면 다음 단계로 자동 전환돼요."
    }
  }

  if (state.stage === "DONE") {
    return "이미 완료된 스프린트예요."
  }

  return `현재 단계 \`${state.stage}\`에서는 텍스트로 넘길 다음 단계가 없어요.`
}

async function handleThreadMessage(message: Message) {
  if (!message.channel.isThread()) {
    return
  }

  let state = store.get(message.channel.id)

  if (!state) {
    return
  }

  const lowered = message.content.trim().toLowerCase()
  const textCommand = parseThreadTextCommand(message.content, state)

  if (textCommand) {
    await safeReact(message, "👀")

    try {
      await safeReact(message, "⏳")
      await message.channel.sendTyping()
      const reply = await runThreadTextCommand(message, state, textCommand)

      if (reply) {
        await replyWithChunkedMessage(message, reply)
      }

      await removeOwnReaction(message, "⏳")
      await safeReact(message, "✅")
    } catch (error) {
      await removeOwnReaction(message, "⏳")
      await safeReact(message, "⚠️")
      throw error
    }

    return
  }

  const messageReferences = getMessageReferences(message)
  const trimmedContent = message.content.trim()
  const progressRequest = isProgressRequest(trimmedContent)

  if (isDesignSystemWorkflow(state) && (messageReferences.length > 0 || trimmedContent)) {
    state = store.upsert({
      ...state,
      sourceBrief: [state.sourceBrief, trimmedContent].filter(Boolean).join("\n\n") || state.sourceBrief,
      referenceAttachments: mergeReferenceAttachments(state.referenceAttachments, messageReferences),
      lastOperatorMessageId: message.id,
      updatedAt: nowIso(),
    })
  }

  if (lowered === "approve" || lowered === "continue" || lowered.startsWith("revise:")) {
    await message.channel.sendTyping()
    await safeReact(message, "👀")
      await replyWithChunkedMessage(
        message,
        "이제는 직접 명령어를 입력할 필요 없어요. 이 스레드에서는 자연어로 이야기하고, 단계 전환은 아래 버튼으로만 진행할게요.",
      )
    await safeReact(message, "✅")
    return
  }

  try {
    store.upsert({
      ...state,
      lastOperatorMessageId: message.id,
      updatedAt: nowIso(),
    })

    if (progressRequest) {
      await safeReact(message, "👀")
      await message.channel.sendTyping()
      await replyWithChunkedMessage(message, buildProgressReply(state))
      await safeReact(message, "✅")
      return
    }

    if (shouldReplyWithReviewUrl(state, trimmedContent)) {
      await safeReact(message, "⏳")
      await message.channel.sendTyping()

      if (!shouldDeployPreviewFromMessage(state, trimmedContent)) {
        await replyWithChunkedMessage(message, buildReviewUrlReply(state))
        await removeOwnReaction(message, "⏳")
        await safeReact(message, "✅")
        return
      }

      try {
        const previewResult = await ensurePreviewForThread(message.channel, state)
        state = previewResult.nextState
        await replyWithChunkedMessage(message, previewResult.reply)
        await removeOwnReaction(message, "⏳")
        await safeReact(message, "✅")
      } catch (error) {
        const reason = error instanceof Error ? summarizeJobText(error.message, 220) : "알 수 없는 오류"
        await replyWithChunkedMessage(message, `preview 배포에 실패했어요.\n- 원인: ${reason}`)
        await removeOwnReaction(message, "⏳")
        await safeReact(message, "⚠️")
      }

      return
    }

    const contentForBridge =
      trimmedContent ||
      (message.attachments.size > 0 ? "사용자가 첨부 파일이나 이미지를 올렸어. 첨부 자료를 보고 방향을 같이 정리해달라는 뜻으로 이해해줘." : "")

    const shouldReply =
      state.status === "WAITING_FOR_APPROVAL"
        ? Boolean(contentForBridge)
        : isLikelyQuestion(trimmedContent)

    if (!shouldReply) {
      return
    }

    await safeReact(message, "👀")
    await safeReact(message, "⏳")
    await message.channel.sendTyping()
    const conversation = await buildConversationReply(message.channel, state, contentForBridge, message.id)

    if (conversation.nextState !== state) {
      store.upsert(conversation.nextState)
    }

    await replyWithChunkedMessage(message, conversation.reply)
    await removeOwnReaction(message, "⏳")
    await safeReact(message, "✅")
  } catch (error) {
    await removeOwnReaction(message, "⏳")
    await safeReact(message, "⚠️")
    await replyWithChunkedMessage(message, "답변 생성 중 오류가 났어요. 로컬 로그를 확인하고 이어서 다시 답할게요.").catch(() => null)
    throw error
  }
}

async function shutdown(signal: string) {
  console.log(`Received ${signal}, stopping Discord bridge...`)
  health.stop()

  try {
    await client.destroy()
  } catch (error) {
    console.error(error)
  } finally {
    process.exit(0)
  }
}

health.start()

process.on("SIGINT", () => {
  void shutdown("SIGINT")
})

process.on("SIGTERM", () => {
  void shutdown("SIGTERM")
})

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection in Discord bridge.")
  console.error(error)
})

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception in Discord bridge.")
  console.error(error)
})

client.once("clientReady", (readyClient) => {
  console.log(`Discord bridge is ready as ${readyClient.user.tag}`)
  console.log(`Watching sprint channel ${env.DISCORD_SPRINT_CHANNEL_ID}`)
  health.markReady()

  for (const state of store.list()) {
    if (isAutonomousStage(state.stage) && state.status === "ACTIVE") {
      scheduleAutonomousStage(state.threadId)
    }
  }
})

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId.startsWith(`${EXISTING_CONTINUE_PREFIX}:`)) {
        await handleExistingContinue(interaction, interaction.customId.split(":").at(-1) ?? "")
        return
      }

      if (interaction.customId.startsWith(`${EXISTING_RESTART_PREFIX}:`)) {
        await handleExistingRestart(interaction, interaction.customId.split(":").at(-1) ?? "")
        return
      }

      if (interaction.customId === TERMINATE_REQUEST_ID) {
        await handleTerminateRequest(interaction)
        return
      }

      if (interaction.customId === PREVIEW_REVISE_ID) {
        await handlePreviewDecision(interaction, "revise")
        return
      }

      if (interaction.customId === PREVIEW_APPROVE_ID) {
        await handlePreviewDecision(interaction, "approve")
        return
      }

      if (interaction.customId === AUTONOMOUS_RETRY_ID) {
        await handleAutonomousRetry(interaction)
        return
      }

      if (interaction.customId === NEXT_STAGE_ID) {
        await handleNextStageButton(interaction)
        return
      }

      if (interaction.customId.startsWith(`${TERMINATE_CONFIRM_PREFIX}:`)) {
        await handleTerminateConfirm(interaction, interaction.customId.split(":").at(-1) ?? "")
        return
      }

      if (interaction.customId.startsWith(`${TERMINATE_CANCEL_PREFIX}:`)) {
        await handleTerminateCancel(interaction)
        return
      }

      if (interaction.customId === GATE_APPROVE_ID) {
        await handleGateApprove(interaction)
        return
      }

      return
    }

    if (!interaction.isChatInputCommand()) {
      return
    }

    if (interaction.commandName === "sprint") {
      await handleSprint(interaction)
      return
    }

    if (interaction.commandName === "status") {
      await handleStatus(interaction)
      return
    }

    if (interaction.commandName === "design-system") {
      await handleDesignSystem(interaction)
    }
  } catch (error) {
    console.error(error)

    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "Discord bridge 명령 실행에 실패했어요. 로컬 로그를 확인해주세요.",
          flags: MessageFlags.Ephemeral,
        })
        return
      }

      await interaction.reply({
        content: "Discord bridge 명령 실행에 실패했어요. 로컬 로그를 확인해주세요.",
        flags: MessageFlags.Ephemeral,
      })
    }
  }
})

client.on("messageCreate", async (message) => {
  if (message.author.bot || message.guildId !== env.DISCORD_GUILD_ID) {
    return
  }

  try {
    await handleThreadMessage(message)
  } catch (error) {
    console.error(error)
  }
})

client.login(env.DISCORD_BOT_TOKEN).catch((error) => {
  console.error("Discord bridge 시작에 실패했어요.")
  console.error(error)
  process.exitCode = 1
})
