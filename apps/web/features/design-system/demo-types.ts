export type DemoReviewStatus = "draft" | "ready" | "approved"

export type DemoEntryPoint = {
  label: string
  location: string
  userIntent: string
}

export type DemoFlowStep = {
  label: string
  screen: string
  userAction: string
  systemResponse: string
}

export type DemoScreen = {
  name: string
  role: string
  primaryAction: string
  secondaryAction?: string
  stateNotes: string[]
}

export type DemoDesignSystemUsage = {
  components: string[]
  tokens: string[]
  notes: string[]
}

export type DemoExampleMetadata = {
  slug: string
  sprintId: string
  featureSlug: string
  title: string
  summary: string
  status: DemoReviewStatus
  updatedAt: string
  entryPoints: DemoEntryPoint[]
  flowSteps: DemoFlowStep[]
  screens: DemoScreen[]
  designSystem: DemoDesignSystemUsage
  reviewChecklist: string[]
}

export type DemoExample = DemoExampleMetadata & {
  href: string
}
