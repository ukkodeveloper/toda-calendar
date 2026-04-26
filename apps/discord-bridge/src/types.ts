export const sprintStages = [
  "DISCOVERY_WORKSHOP",
  "DESIGN_PACK",
  "DEMO_BUILD",
  "DEMO_REVIEW",
  "TECHNICAL_FREEZE",
  "IMPLEMENTATION",
  "PREVIEW_REVIEW",
  "MERGE",
  "DONE",
] as const

export type SprintStage = (typeof sprintStages)[number]

export const sprintStatuses = ["ACTIVE", "WAITING_FOR_APPROVAL", "PAUSED", "BLOCKED", "DONE"] as const

export type SprintStatus = (typeof sprintStatuses)[number]

export type SprintJobState = {
  status: "IDLE" | "RUNNING" | "FAILED"
  stage?: SprintStage
  label?: string
  startedAt?: string
  updatedAt?: string
  summary?: string
  error?: string
  detailLines?: string[]
  diagnosticLines?: string[]
}

export type SprintStageSummary = {
  stage: SprintStage
  content: string
  updatedAt: string
}

export type SprintPreviewDeployment = {
  url: string
  ready: boolean
  deployedAt: string
}

export type SprintWorkflowKind = "sprint" | "design_system"

export type SprintReferenceAttachment = {
  id: string
  url: string
  name: string
  contentType?: string
  size?: number
}

export type SprintThreadState = {
  threadId: string
  parentChannelId: string
  guildId: string
  sprintId: string
  featureSlug: string
  baseSprintKey: string
  sprintKey: string
  runNumber: number
  stage: SprintStage
  status: SprintStatus
  worktreeName: string
  worktreePath: string
  branchName: string
  codexSessionId?: string
  job?: SprintJobState
  stageStartedAt?: string
  latestStageSummary?: SprintStageSummary
  preview?: SprintPreviewDeployment
  workflowKind?: SprintWorkflowKind
  sourceBrief?: string
  referenceAttachments?: SprintReferenceAttachment[]
  checkpointMessageId?: string
  activityMessageId?: string
  lastOperatorMessageId?: string
  createdAt: string
  updatedAt: string
}

export type SprintThreadStoreShape = {
  threads: Record<string, SprintThreadState>
}
