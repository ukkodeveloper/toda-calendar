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
import type { SprintPreviewDeployment, SprintStage, SprintStageSummary, SprintStatus, SprintThreadState } from "./types.js"
import { getBranchName, getRunSprintKey, getSprintKey, getWorktreeName, getWorktreePath, ensureGitWorktree } from "./worktree.js"
import { runCodexDiscussionReply, runCodexStageTransitionSummary } from "./codex-runner.js"
import { runVercelPreviewDeployment } from "./preview-deployer.js"
import { runCodexStageWorker } from "./stage-worker.js"
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
const DISCORD_MESSAGE_LIMIT = 1_900

const GATE_APPROVE_ID = "sprint:gate:approve"
const PREVIEW_REVISE_ID = "sprint:preview:revise"
const PREVIEW_APPROVE_ID = "sprint:preview:approve"
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
  }

  if (!gate && state.status === "BLOCKED" && isAutonomousStage(state.stage)) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(AUTONOMOUS_RETRY_ID)
        .setLabel("다시 시도")
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

function buildActivityCard(state: SprintThreadState) {
  const lines = [
    "**진행 현황**",
    `- 단계: ${stageLabel(state.stage)}`,
    `- 상태: ${statusLabel(state.status)}`,
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
  } else if (state.job?.summary) {
    lines.push("", "최근 작업")
    lines.push(`- ${state.job.summary}`)
  }

  if (state.latestStageSummary?.content) {
    lines.push("", `${stageLabel(state.latestStageSummary.stage)}에서 정리된 내용`)
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
            `지금은 **${stageLabel(state.stage)}** 단계예요.`,
            ...buildLatestStageSummarySection(state.latestStageSummary),
            "",
            `- ${formatPreviewReviewLine(state.preview)}`,
            `- ${stageSummary(state.stage)}`,
            "",
            "배포된 화면을 보고 결정하면 돼요.",
            "- 더 고칠 게 있으면 `수정 더 하기`",
            "- 이대로 괜찮으면 `완료, main 반영`",
            "- 여기서 접고 싶으면 `파기 후 종료`",
          ].join("\n")
        : gate
          ? [
          `지금은 **${stageLabel(state.stage)}** 단계예요.`,
          ...buildLatestStageSummarySection(state.latestStageSummary),
          "",
          `지금 정할 것: ${gate.gateLabel}`,
          `- ${stageSummary(state.stage)}`,
          "",
          "계속 이야기하다가 방향이 정리되면 버튼을 눌러주세요.",
          "이번 스프린트를 여기서 접고 싶으면 `파기 후 종료`를 누르면 돼요.",
          ].join("\n")
          : [
            `지금은 **${stageLabel(state.stage)}** 단계예요.`,
            `- ${stageSummary(state.stage)}`,
            ...buildLatestStageSummarySection(state.latestStageSummary),
            "",
            "이 구간은 내가 알아서 진행할게요.",
            "다만 여기서 멈추고 싶다면 `파기 후 종료`로 정리할 수 있어요.",
          ].join("\n"),
    components: buildStageButtons(state),
  }
}

function buildExistingSprintChoice(state: SprintThreadState) {
  return {
    content: [
      "같은 스프린트가 이미 열려 있어요.",
      `- 스레드: <#${state.threadId}>`,
      `- 실행: ${formatRunLabel(state)}`,
      `- 단계: ${stageLabel(state.stage)}`,
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
  const stageSummaryLine = state.latestStageSummary?.content
    ? [`직전 단계 요약 (${stageLabel(state.latestStageSummary.stage)}):`, state.latestStageSummary.content].join("\n")
    : null
  const previewLine = state.preview ? `preview URL: ${state.preview.url}${state.preview.ready ? "" : " (준비 중일 수 있어요)"}` : null

  return [
    `스프린트: \`${state.sprintId}/${state.featureSlug}\``,
    `실행: ${formatRunLabel(state)}`,
    `현재 단계: ${stageLabel(state.stage)}`,
    `상태: \`${state.status}\` (${statusLabel(state.status)})`,
    jobLine,
    `다음 사람 체크포인트: ${nextGate ? stageLabel(nextGate) : "없음"}`,
    `worktree: \`${state.worktreeName}\``,
    `branch: \`${state.branchName}\``,
    `codex session: ${state.codexSessionId ? `\`${state.codexSessionId}\`` : "아직 생성 전"}`,
    `worktree path: \`${state.worktreePath}\``,
    `마지막 업데이트: \`${state.updatedAt}\``,
    previewLine,
    jobDetailLine,
    jobSummaryLine,
    jobErrorLine,
    stageSummaryLine,
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
    `현재 등록된 스프린트: ${sorted.length}개`,
    "",
    ...sorted.map((state) => {
      const nextGate = nextHumanGate(state.stage)

      return [
        `- <#${state.threadId}>`,
        `  실행: ${formatRunLabel(state)}`,
        `  단계: ${stageLabel(state.stage)} / 상태: ${statusLabel(state.status)}`,
        `  작업: ${state.job?.status ?? "IDLE"}${state.job?.label ? ` (${state.job.label})` : ""}`,
        `  다음 체크포인트: ${nextGate ? stageLabel(nextGate) : "없음"}`,
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
    `지금은 **${stageLabel(state.stage)}** 단계예요.`,
    `- ${stageSummary(state.stage)}`,
    ...buildLatestStageSummarySection(state.latestStageSummary),
    "",
    "이 구간은 내가 알아서 진행할게요.",
    "중간에 계속 말 걸지 않아도 괜찮아요.",
    "아래처럼 중요한 순간에만 다시 알려드릴게요.",
    "- 막히는 결정이 생길 때",
    "- 검증이 끝났을 때",
    "- 사람이 확인해야 할 게 생길 때",
    `- 다음 체크포인트: ${nextGate ? `\`${nextGate}\`` : "없음"}`,
  ].join("\n")
}

function buildAutonomousStageStartReply(state: SprintThreadState) {
  switch (state.stage) {
    case "DESIGN_PACK":
      return [
        `좋아요. 이제 **${stageLabel(state.stage)}** 단계로 넘어가요.`,
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
        `좋아요. 이제 **${stageLabel(state.stage)}** 단계로 넘어가요.`,
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
        `좋아요. 이제 **${stageLabel(state.stage)}** 단계로 넘어가요.`,
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
        `좋아요. 이제 **${stageLabel(state.stage)}** 단계예요.`,
        ...buildLatestStageSummarySection(state.latestStageSummary),
        "",
        `- ${formatPreviewReviewLine(state.preview)}`,
        "- 링크를 직접 보고 더 고칠지, 이대로 반영할지 정하면 돼요.",
      ].join("\n")
    case "DONE":
      return "이번 스프린트는 끝났어요."
    case "DISCOVERY_WORKSHOP":
    case "DEMO_REVIEW":
      return `지금은 **${stageLabel(state.stage)}** 단계예요.`
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

async function buildThreadTranscript(thread: ThreadChannel, currentMessageId: string) {
  const messages = await thread.messages.fetch({ limit: 12 })
  const ordered = [...messages.values()]
    .filter((message) => message.id !== currentMessageId)
    .filter((message) => !message.system)
    .sort((left, right) => left.createdTimestamp - right.createdTimestamp)
    .slice(-8)

  return ordered
    .map((message) => {
      const role = message.author.bot ? "bot" : "user"
      const content = message.content.trim()

      if (!content) {
        return null
      }

      return `${role}: ${content}`
    })
    .filter(Boolean)
    .join("\n")
}

async function buildAutomationTranscript(thread: ThreadChannel) {
  const messages = await thread.messages.fetch({ limit: 100 })
  const ordered = [...messages.values()]
    .filter((message) => !message.system)
    .sort((left, right) => left.createdTimestamp - right.createdTimestamp)

  return ordered
    .map((message) => {
      const role = message.author.bot ? "bot" : "user"
      const content = message.content.trim()

      if (!content) {
        return null
      }

      return `${role}: ${content}`
    })
    .filter(Boolean)
    .join("\n")
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

  return ordered
    .map((message) => {
      const role = message.author.bot ? "bot" : "user"
      const content = message.content.trim()

      if (!content) {
        return null
      }

      return `${role}: ${content}`
    })
    .filter(Boolean)
    .join("\n")
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
  const result = await runVercelPreviewDeployment(state.worktreePath)

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

function buildRunningJobState(state: SprintThreadState) {
  const timestamp = nowIso()

  return {
    ...state,
    job: {
      status: "RUNNING" as const,
      stage: state.stage,
      label: stageLabel(state.stage),
      startedAt: state.job?.status === "RUNNING" && state.job.stage === state.stage ? state.job.startedAt ?? timestamp : timestamp,
      updatedAt: timestamp,
      summary: state.job?.summary,
      error: undefined,
      detailLines: state.job?.detailLines,
    },
    updatedAt: timestamp,
  }
}

function buildFailedJobState(state: SprintThreadState, error: string) {
  const timestamp = nowIso()

  return {
    ...state,
    status: "BLOCKED" as const,
    job: {
      status: "FAILED" as const,
      stage: state.stage,
      label: stageLabel(state.stage),
      startedAt: state.job?.startedAt ?? timestamp,
      updatedAt: timestamp,
      summary: state.job?.summary,
      error: summarizeJobText(error, 240),
      detailLines: state.job?.detailLines,
    },
    updatedAt: timestamp,
  }
}

async function advanceAfterAutonomousStage(thread: ThreadChannel, state: SprintThreadState, reply: string) {
  const timestamp = nowIso()
  const baseState = {
    ...state,
    job: {
      status: "IDLE" as const,
      stage: state.stage,
      label: stageLabel(state.stage),
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
      stageStartedAt: timestamp,
      checkpointMessageId: undefined,
    }

    store.upsert(nextState)
    await sendChunkedThreadMessage(thread, reply)
    await sendChunkedThreadMessage(
      thread,
      [
        "데모를 준비했어요. 이제 실제 흐름을 보고 방향만 확인하면 돼요.",
        `- 전체 목록: \`/design-system\``,
        `- 이번 데모: \`/design-system/examples/${state.sprintKey}\``,
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
          `${stageLabel(runningState.stage)} 작업을 Codex가 진행 중이에요.`,
        ])
        store.upsert(runningState)
        runningState = await syncActivityCard(thread, runningState)

        const transcript = await buildAutomationTranscript(thread)
        const result = await runCodexStageWorker({
          worktreePath: runningState.worktreePath,
          state: runningState,
          transcript,
        })

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
        const message = error instanceof Error ? error.message : "알 수 없는 오류"
        const failedState = buildFailedJobState(runningState, message)
        store.upsert(failedState)
        await syncActivityCard(thread, failedState)
        jobLogger.append({
          at: nowIso(),
          threadId: failedState.threadId,
          sprintKey: failedState.sprintKey,
          stage: failedState.stage,
          kind: "job.failed",
          detail: summarizeJobText(message),
        })
        await sendChunkedThreadMessage(
          thread,
          [
            `여기서 잠깐 멈췄어요. 지금은 **${stageLabel(failedState.stage)}** 단계예요.`,
            `- 원인: ${summarizeJobText(message)}`,
            "- `/status`로 상태를 확인하고, 필요한 방향을 말해주면 다시 이어갈게요.",
          ].join("\n"),
        )
        break
      }
    }
  } finally {
    runningAutomationThreads.delete(threadId)
  }
}

function scheduleAutonomousStage(threadId: string) {
  void runAutonomousStageCycle(threadId)
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
      `- ${stageSummary(state.stage)}`,
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
      `- 단계: ${stageLabel(resumedState.stage)}`,
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

  const nextState = buildSprintState({
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
        "이 스프린트는 새 스레드에서 다시 시작할게요.",
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

  await sendKickoff(thread, nextState)
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
      label: stageLabel(nextStage),
      updatedAt: nextStartedAt,
    },
    stageStartedAt: nextStartedAt,
    checkpointMessageId: undefined,
    lastOperatorMessageId: interaction.user.id,
    updatedAt: nextStartedAt,
  }

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

  const nextStage: SprintStage = mode === "revise" ? "TECHNICAL_FREEZE" : "MERGE"
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
      label: stageLabel(nextStage),
      updatedAt: nextStartedAt,
    },
    stageStartedAt: nextStartedAt,
    checkpointMessageId: undefined,
    lastOperatorMessageId: interaction.user.id,
    updatedAt: nextStartedAt,
  }

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
      label: stageLabel(state.stage),
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

async function handleThreadMessage(message: Message) {
  if (!message.channel.isThread()) {
    return
  }

  const state = store.get(message.channel.id)

  if (!state) {
    return
  }

  const lowered = message.content.trim().toLowerCase()

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

  await safeReact(message, "👀")

  try {
    store.upsert({
      ...state,
      lastOperatorMessageId: message.id,
      updatedAt: nowIso(),
    })

    const trimmedContent = message.content.trim()
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
