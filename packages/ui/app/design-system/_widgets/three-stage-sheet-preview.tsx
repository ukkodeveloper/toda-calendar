"use client"

import { AnimatePresence } from "framer-motion"

import {
  ThreeStageSheet,
  type ThreeStageSheetDetent,
} from "@workspace/ui/components/three-stage-sheet"
import { cn } from "@workspace/ui/lib/utils"

export type SheetStage = "closed" | "peek" | "half" | "tall"

type ThreeStageSheetPreviewProps = {
  activeStage: SheetStage
  className?: string
  dismissible?: boolean
  onStageChange: (stage: SheetStage) => void
}

const detents: ThreeStageSheetDetent[] = [
  { id: "peek", peekPx: 30 },
  { id: "half", ratio: 0.5 },
  { id: "tall", ratio: 0.8 },
]

const stageCopy: Record<
  Exclude<SheetStage, "closed">,
  { title: string; body: string }
> = {
  peek: {
    title: "핸들만",
    body: "핸들 바만 프레임 하단에 걸쳐 언제든 다시 끌어올릴 수 있습니다.",
  },
  half: {
    title: "절반",
    body: "컨테이너 높이의 절반. 선택과 보조 행동을 함께 봅니다.",
  },
  tall: {
    title: "크게",
    body: "컨테이너 높이의 80%. 긴 콘텐츠와 복수 컨트롤을 다룹니다.",
  },
}

function ThreeStageSheetPreview({
  activeStage,
  className,
  dismissible = true,
  onStageChange,
}: ThreeStageSheetPreviewProps) {
  const open = activeStage !== "closed"
  const copy = open ? stageCopy[activeStage] : null

  return (
    <div
      className={cn(
        "relative h-[420px] overflow-hidden rounded-hero border border-border-subtle bg-surface-canvas",
        className
      )}
    >
      <div className="px-3 pt-4">
        <div className="mx-auto grid max-w-64 grid-cols-7 gap-px overflow-hidden rounded-panel opacity-60">
          {Array.from({ length: 21 }, (_, index) => (
            <div key={index} className="aspect-[4/5] bg-surface-raised" />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <ThreeStageSheet
            activeDetentId={activeStage}
            detents={detents}
            dismissible={dismissible}
            onActiveDetentChange={(id) => onStageChange(id as SheetStage)}
            onRequestClose={() => onStageChange("closed")}
          >
            <div className="flex h-full flex-col">
              <div className="mt-1 text-center">
                <p className="text-caption font-strong tracking-wide text-text-tertiary uppercase">
                  {copy?.title}
                </p>
                <h3 className="mt-1 text-title font-strong text-balance">
                  핸들을 잡고 드래그해 단계를 바꿔보세요
                </h3>
                <p className="mx-auto mt-1 max-w-60 text-body text-text-secondary">
                  {copy?.body}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-panel bg-fill-neutral p-1">
                {(["peek", "half", "tall"] as const).map((stage) => (
                  <span
                    key={stage}
                    className={cn(
                      "grid h-9 place-items-center rounded-control text-caption font-emphasis",
                      stage === activeStage
                        ? "bg-surface-raised text-text-primary shadow-elevation-2"
                        : "text-text-tertiary"
                    )}
                  >
                    {stageCopy[stage].title}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid min-h-0 flex-1 place-items-center rounded-panel bg-surface-inset px-4 text-center text-body font-emphasis text-text-secondary">
                {activeStage === "tall"
                  ? "크게 펼친 상태에서도 닫기와 스크롤 경계를 명확히 유지합니다."
                  : "아래로 던지면 닫히고, 다시 열면 같은 단계로 돌아옵니다."}
              </div>
            </div>
          </ThreeStageSheet>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export { ThreeStageSheetPreview }
