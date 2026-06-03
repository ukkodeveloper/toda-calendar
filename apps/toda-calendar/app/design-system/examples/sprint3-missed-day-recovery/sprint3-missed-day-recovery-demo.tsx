"use client"

import Link from "next/link"
import * as React from "react"

import { AppBar } from "@workspace/ui/components/app-bar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  CalendarPreview,
  type CalendarPreviewDay,
} from "@workspace/ui/components/calendar-preview"
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@workspace/ui/components/segmented-control"
import { Surface } from "@workspace/ui/components/surface"
import { Text } from "@workspace/ui/components/text"
import { cn } from "@workspace/ui/lib/utils"

import type { DemoExampleMetadata } from "@/features/design-system/demo-types"

type RecoveryTarget = "yesterday" | "dayBefore"
type DemoPhase = "home" | "editor" | "saved" | "hidden"

const targetOptions: Array<SegmentedControlOption<RecoveryTarget>> = [
  { value: "yesterday", label: "어제" },
  { value: "dayBefore", label: "그제" },
]

const phaseOptions: Array<SegmentedControlOption<DemoPhase>> = [
  { value: "home", label: "홈" },
  { value: "editor", label: "시트" },
  { value: "saved", label: "완료" },
  { value: "hidden", label: "숨김" },
]

const targetContent = {
  yesterday: {
    badge: "어제 우선",
    candidateDay: 25,
    completionNote: "저장한 날짜는 다시 제안하지 않는다.",
    intro: "앱 첫 진입에서 어제가 비어 있어 가장 먼저 제안한다.",
    prompt: "어제를 한 칸 남겨볼까요?",
    savedLabel: "복구 메모",
    sheetDate: "4월 25일 토요일",
    subtitle: "최근 하루 공백을 조용히 다시 남긴다.",
    toast: "어제가 채워졌어요.",
  },
  dayBefore: {
    badge: "그제 fallback",
    candidateDay: 24,
    completionNote: "어제가 채워져 있을 때만 그제로 한 번 내려간다.",
    intro: "어제가 이미 채워져 있어 그제를 fallback으로 제안한다.",
    prompt: "그제를 한 칸 남겨볼까요?",
    savedLabel: "그제 복구",
    sheetDate: "4월 24일 금요일",
    subtitle: "한 번에 하나의 날짜만 제안하고 여기서 멈춘다.",
    toast: "그제가 채워졌어요.",
  },
} satisfies Record<
  RecoveryTarget,
  {
    badge: string
    candidateDay: number
    completionNote: string
    intro: string
    prompt: string
    savedLabel: string
    sheetDate: string
    subtitle: string
    toast: string
  }
>

const phaseContent = {
  home: {
    badgeTone: "accent",
    label: "조용한 제안",
    note: "앱 첫 진입에서만 후보를 계산하고 홈 안에서 조용히 보여준다.",
  },
  editor: {
    badgeTone: "accent",
    label: "기존 시트 진입",
    note: "새 복구 페이지 없이 기존 DayEditorSheet를 바로 연다.",
  },
  saved: {
    badgeTone: "success",
    label: "저장 완료",
    note: "저장 후에는 토스트만 남기고 같은 날짜를 다시 제안하지 않는다.",
  },
  hidden: {
    badgeTone: "neutral",
    label: "24시간 숨김",
    note: "닫기와 저장 없는 종료는 같은 날짜를 24시간 동안 다시 띄우지 않는다.",
  },
} satisfies Record<
  DemoPhase,
  {
    badgeTone: "accent" | "success" | "neutral"
    label: string
    note: string
  }
>

export function MissedDayRecoveryDemo({
  demo,
}: {
  demo: DemoExampleMetadata
}) {
  const [target, setTarget] = React.useState<RecoveryTarget>("yesterday")
  const [phase, setPhase] = React.useState<DemoPhase>("home")

  const currentTarget = targetContent[target]
  const currentPhase = phaseContent[phase]
  const calendarDays = buildCalendarDays(target, phase)

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,#f7f1e9_0%,#edf2f5_44%,#f8f7f2_100%)] px-4 py-[max(1rem,calc(env(safe-area-inset-top)+1rem))] text-foreground sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <Surface className="rounded-[2rem]" padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                className="inline-flex min-h-10 items-center rounded-full border border-black/6 bg-white/78 px-4 text-sm font-semibold text-foreground/72 shadow-[0_10px_24px_rgba(15,23,42,0.06)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
                href="/design-system"
              >
                Design system
              </Link>
              <Badge tone="accent" size="lg">
                Demo ready
              </Badge>
            </div>
            <div className="mt-8 max-w-3xl">
              <Text as="p" tone="muted" variant="caption">
                {demo.sprintId} / {demo.featureSlug}
              </Text>
              <Text as="h1" className="mt-2 text-3xl sm:text-5xl" variant="display">
                {demo.title}
              </Text>
              <Text className="mt-4 max-w-2xl" tone="secondary">
                {demo.summary}
              </Text>
            </div>
          </Surface>

          <Surface className="rounded-[2rem]" padding="lg" variant="panel">
            <Text variant="caption" tone="muted">
              업데이트
            </Text>
            <Text as="p" className="mt-2" variant="title">
              {demo.updatedAt}
            </Text>
            <div className="mt-5 space-y-3">
              <MetaLine label="Route" value="/design-system/examples/sprint3-missed-day-recovery" />
              <MetaLine label="Entry" value="QuietNudge only" />
              <MetaLine label="Range" value="Home -> Sheet -> Toast" />
            </div>
          </Surface>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
          <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <Surface className="rounded-[2rem]" padding="lg">
              <div className="space-y-4">
                <div>
                  <Text variant="caption" tone="muted">
                    데모 제어
                  </Text>
                  <Text as="h2" className="mt-2" variant="title">
                    5개 핵심 상태를 바로 확인한다.
                  </Text>
                </div>

                <div className="space-y-2">
                  <Text variant="label">대상 날짜</Text>
                  <SegmentedControl
                    ariaLabel="대상 날짜"
                    options={targetOptions}
                    size="md"
                    value={target}
                    onValueChange={setTarget}
                  />
                </div>

                <div className="space-y-2">
                  <Text variant="label">흐름 단계</Text>
                  <SegmentedControl
                    ariaLabel="흐름 단계"
                    options={phaseOptions}
                    size="md"
                    value={phase}
                    onValueChange={setPhase}
                  />
                </div>
              </div>
            </Surface>

            <PhoneCanvas
              calendarDays={calendarDays}
              phase={phase}
              target={target}
              onDismiss={() => setPhase("hidden")}
              onOpen={() => setPhase("editor")}
              onSave={() => setPhase("saved")}
            />
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Surface className="rounded-[1.8rem]" padding="lg" variant="panel">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge size="md" tone={currentPhase.badgeTone}>
                    {currentPhase.label}
                  </Badge>
                  <Badge size="md" tone="neutral">
                    {currentTarget.badge}
                  </Badge>
                </div>
                <Text as="h2" className="mt-4" variant="title">
                  {currentTarget.prompt}
                </Text>
                <Text className="mt-3" tone="secondary">
                  {currentTarget.intro}
                </Text>
                <Text className="mt-2" tone="secondary">
                  {currentPhase.note}
                </Text>
                <ul className="mt-5 space-y-2 text-sm leading-6 text-foreground/66">
                  <RuleItem>{currentTarget.completionNote}</RuleItem>
                  <RuleItem>한 번에 하나의 날짜만 제안한다.</RuleItem>
                  <RuleItem>닫기와 저장 없는 종료는 같은 24시간 규칙을 쓴다.</RuleItem>
                </ul>
              </Surface>

              <Surface className="rounded-[1.8rem]" padding="lg" variant="panel">
                <Text variant="caption" tone="muted">
                  포함 화면
                </Text>
                <div className="mt-4 space-y-3">
                  {demo.screens.map((screen) => (
                    <div
                      key={screen.name}
                      className="rounded-[1.2rem] border border-black/6 bg-white/74 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge size="sm" tone="neutral">
                          {screen.role}
                        </Badge>
                        <Text as="p" variant="label">
                          {screen.name}
                        </Text>
                      </div>
                      <Text className="mt-2" tone="secondary">
                        {screen.primaryAction}
                      </Text>
                    </div>
                  ))}
                </div>
              </Surface>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <Surface className="rounded-[1.8rem]" padding="lg">
                <Text variant="caption" tone="muted">
                  Flow
                </Text>
                <div className="mt-4 space-y-3">
                  {demo.flowSteps.map((step, index) => (
                    <article
                      key={`${step.label}-${step.screen}`}
                      className="rounded-[1.4rem] border border-black/6 bg-white/72 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-full bg-foreground text-sm font-semibold text-background">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <Text as="h3" variant="label">
                            {step.label}
                          </Text>
                          <Text tone="muted" variant="caption">
                            {step.screen}
                          </Text>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 text-sm leading-6 text-foreground/66 md:grid-cols-2">
                        <p>
                          <span className="font-semibold text-foreground/82">User:</span>{" "}
                          {step.userAction}
                        </p>
                        <p>
                          <span className="font-semibold text-foreground/82">System:</span>{" "}
                          {step.systemResponse}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </Surface>

              <div className="space-y-4">
                <Surface className="rounded-[1.8rem]" padding="lg" variant="panel">
                  <Text variant="caption" tone="muted">
                    Entry points
                  </Text>
                  <div className="mt-4 space-y-3">
                    {demo.entryPoints.map((entryPoint) => (
                      <div key={entryPoint.label}>
                        <Text as="h3" variant="label">
                          {entryPoint.label}
                        </Text>
                        <Text className="mt-1" tone="secondary">
                          {entryPoint.location}
                        </Text>
                        <Text className="mt-1" tone="muted" variant="caption">
                          {entryPoint.userIntent}
                        </Text>
                      </div>
                    ))}
                  </div>
                </Surface>

                <Surface className="rounded-[1.8rem]" padding="lg" variant="panel">
                  <Text variant="caption" tone="muted">
                    Review checklist
                  </Text>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground/68">
                    {demo.reviewChecklist.map((item) => (
                      <RuleItem key={item}>{item}</RuleItem>
                    ))}
                  </ul>
                </Surface>

                <Surface className="rounded-[1.8rem]" padding="lg" variant="panel">
                  <Text variant="caption" tone="muted">
                    Design system usage
                  </Text>
                  <div className="mt-4 space-y-4">
                    <MetaGroup title="Components" items={demo.designSystem.components} />
                    <MetaGroup title="Tokens" items={demo.designSystem.tokens} />
                    <MetaGroup title="Notes" items={demo.designSystem.notes} />
                  </div>
                </Surface>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function PhoneCanvas({
  calendarDays,
  onDismiss,
  onOpen,
  onSave,
  phase,
  target,
}: {
  calendarDays: CalendarPreviewDay[]
  onDismiss: () => void
  onOpen: () => void
  onSave: () => void
  phase: DemoPhase
  target: RecoveryTarget
}) {
  const targetState = targetContent[target]

  return (
    <Surface
      className="relative mx-auto w-full max-w-[24rem] overflow-hidden rounded-[2.25rem] border-white/80 bg-[var(--calendar-app-bg)] p-0 shadow-[0_32px_88px_rgba(15,23,42,0.16)]"
      padding="none"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(255,59,48,0.14),transparent_62%)]" />
      <div className="relative min-h-[45rem]">
        <div className="px-4 pt-3">
          <div className="mx-auto h-1.5 w-16 rounded-full bg-foreground/10" />
          <div className="mt-3 flex items-center justify-between rounded-full bg-white/62 px-3 py-1.5 text-[0.72rem] font-semibold text-foreground/46">
            <span>Calendar Home</span>
            <span>앱 첫 진입</span>
          </div>
        </div>

        <AppBar
          className="px-5 pt-4 pb-3"
          size="large"
          subtitle={targetState.subtitle}
          title="4월"
          trailing={
            <Badge size="sm" tone="neutral">
              오늘 26
            </Badge>
          }
        />

        <div className="px-4">
          <CalendarPreview
            className="rounded-[1.8rem] border border-white/70 shadow-[0_16px_42px_rgba(15,23,42,0.08)]"
            days={calendarDays}
            monthLabel="2026년 4월"
            previewStyleLabel="최근 기록"
          />
        </div>

        <div className="px-4 pt-4">
          {phase === "home" ? (
            <QuietNudgeCard
              badge={targetState.badge}
              prompt={targetState.prompt}
              onDismiss={onDismiss}
              onOpen={onOpen}
            />
          ) : null}

          {phase === "hidden" ? <HiddenNudgeState /> : null}
        </div>

        {phase === "saved" ? <QuietToast label={targetState.toast} /> : null}

        <div className="px-4 pb-4 pt-6">
          <DockStub />
        </div>

        {phase === "editor" ? (
          <EditorSheetMock
            sheetDate={targetState.sheetDate}
            onDismiss={onDismiss}
            onSave={onSave}
          />
        ) : null}
      </div>
    </Surface>
  )
}

function QuietNudgeCard({
  badge,
  onDismiss,
  onOpen,
  prompt,
}: {
  badge: string
  onDismiss: () => void
  onOpen: () => void
  prompt: string
}) {
  return (
    <Surface
      className="rounded-[1.6rem] border-[var(--calendar-accent)]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.72))]"
      padding="md"
      variant="panel"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Badge size="sm" tone="accent">
            {badge}
          </Badge>
          <Text as="h3" className="mt-3" variant="title">
            {prompt}
          </Text>
          <Text className="mt-2" tone="secondary">
            홈에서만 조용히 제안하고, 오늘은 한 번만 보여준다.
          </Text>
        </div>
        <button
          aria-label="닫기"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-black/4 text-sm font-semibold text-foreground/44 outline-none transition hover:text-foreground/68 focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
          type="button"
          onClick={onDismiss}
        >
          ×
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Text tone="muted" variant="caption">
          저장 없이 닫아도 같은 규칙을 쓴다.
        </Text>
        <Button size="sm" onClick={onOpen}>
          열어보기
        </Button>
      </div>
    </Surface>
  )
}

function HiddenNudgeState() {
  return (
    <div className="rounded-[1.3rem] border border-dashed border-foreground/12 bg-white/48 px-4 py-3">
      <Text variant="label">오늘은 더 제안하지 않아요.</Text>
      <Text className="mt-1" tone="secondary">
        닫기 또는 저장 없는 종료 후 24시간이 지나면 다음 첫 진입에서 다시 계산한다.
      </Text>
    </div>
  )
}

function QuietToast({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-24 z-20">
      <div className="mx-auto max-w-[18rem] rounded-full border border-[var(--ds-success)]/14 bg-white/88 px-4 py-3 text-center text-sm font-semibold text-foreground shadow-[0_14px_32px_rgba(15,23,42,0.1)] backdrop-blur-xl">
        {label}
      </div>
    </div>
  )
}

function DockStub() {
  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-white/78 bg-[var(--calendar-sheet-surface)] shadow-[var(--calendar-sheet-shadow)] backdrop-blur-[28px]">
      <div className="px-4 pt-2 pb-[max(14px,env(safe-area-inset-bottom))]">
        <div className="flex justify-center">
          <div className="h-1.5 w-10 rounded-full bg-foreground/14" />
        </div>
        <div className="mt-3 rounded-full bg-white/76 px-4 py-2 text-center text-[0.94rem] font-medium text-foreground/72">
          오늘은 오늘대로 남겨볼까요?
        </div>
      </div>
    </div>
  )
}

function EditorSheetMock({
  onDismiss,
  onSave,
  sheetDate,
}: {
  onDismiss: () => void
  onSave: () => void
  sheetDate: string
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-[rgba(15,23,42,0.16)]">
      <div className="w-full rounded-t-[2rem] border border-black/6 bg-[var(--surface-panel)] px-4 pt-3 pb-4 shadow-[0_-24px_52px_rgba(15,23,42,0.16)] backdrop-blur-2xl">
        <div className="flex justify-center">
          <div className="h-1.5 w-10 rounded-full bg-foreground/14" />
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <Badge size="sm" tone="accent">
              기존 DayEditorSheet
            </Badge>
            <Text as="h3" className="mt-3" variant="title">
              {sheetDate}
            </Text>
            <Text className="mt-2" tone="secondary">
              새 복구 페이지 없이 바로 열리고, 저장 없이 닫으면 오늘은 더 제안하지 않는다.
            </Text>
          </div>
          <button
            className="grid size-8 shrink-0 place-items-center rounded-full bg-black/4 text-sm font-semibold text-foreground/44 outline-none transition hover:text-foreground/68 focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45"
            type="button"
            onClick={onDismiss}
          >
            ×
          </button>
        </div>

        <div className="mt-4 rounded-[1.6rem] border border-black/6 bg-white/72 p-3">
          <div className="grid grid-cols-3 gap-2 rounded-full bg-foreground/[0.055] p-1">
            {["사진", "드로잉", "텍스트"].map((tab, index) => (
              <div
                key={tab}
                className={cn(
                  "rounded-full px-3 py-2 text-center text-[0.82rem] font-semibold",
                  index === 0
                    ? "bg-white text-foreground shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
                    : "text-foreground/46"
                )}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-[1.4rem] border border-dashed border-foreground/10 bg-[var(--calendar-preview-empty)] p-4">
            <div className="h-24 rounded-[1rem] bg-white/78" />
            <div className="mt-3 space-y-2">
              <div className="h-2 rounded-full bg-foreground/18" />
              <div className="h-2 w-4/5 rounded-full bg-foreground/12" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="lg" variant="secondary" onClick={onDismiss}>
            저장 없이 닫기
          </Button>
          <Button size="lg" onClick={onSave}>
            저장
          </Button>
        </div>
      </div>
    </div>
  )
}

function MetaGroup({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <Text as="h3" variant="label">
        {title}
      </Text>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-foreground/64">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm leading-6">
      <span className="font-semibold text-foreground/46">{label}</span>
      <span className="text-right text-foreground/72">{value}</span>
    </div>
  )
}

function RuleItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span
        aria-hidden="true"
        className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/28"
      />
      <span>{children}</span>
    </li>
  )
}

function buildCalendarDays(
  target: RecoveryTarget,
  phase: DemoPhase
): CalendarPreviewDay[] {
  const candidateDay = targetContent[target].candidateDay
  const restoredDays = new Set<number>([18, 19, 21, 22, 23])

  if (target === "dayBefore") {
    restoredDays.add(25)
  } else {
    restoredDays.add(24)
  }

  if (phase === "saved") {
    restoredDays.add(candidateDay)
  }

  return [
    { day: 29, isCurrentMonth: false },
    { day: 30, isCurrentMonth: false },
    { day: 31, isCurrentMonth: false },
    ...Array.from({ length: 30 }, (_, index) => {
      const day = index + 1

      return {
        day,
        isCurrentMonth: true,
        isSelected: phase === "editor" && day === candidateDay,
        isToday: day === 26,
        preview: getPreview(day, restoredDays, candidateDay, phase, target),
      } satisfies CalendarPreviewDay
    }),
    { day: 1, isCurrentMonth: false },
    { day: 2, isCurrentMonth: false },
  ]
}

function getPreview(
  day: number,
  restoredDays: Set<number>,
  candidateDay: number,
  phase: DemoPhase,
  target: RecoveryTarget
): CalendarPreviewDay["preview"] {
  if (!restoredDays.has(day)) {
    return undefined
  }

  if (day === candidateDay && phase === "saved") {
    return {
      style: "lines",
      label: targetContent[target].savedLabel,
    }
  }

  if (day === 18 || day === 22 || day === 25) {
    return {
      style: "wash",
      label: "사진 기록",
    }
  }

  if (day === 21) {
    return {
      style: "stroke",
      label: "드로잉 기록",
    }
  }

  return {
    style: "lines",
    label: "텍스트 기록",
  }
}
