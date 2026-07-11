import { cn } from "@workspace/ui/lib/utils"

export type SheetStage = "compact" | "medium" | "expanded"

type ThreeStageSheetPreviewProps = {
  activeStage: SheetStage
  className?: string
}

const stageCopy: Record<
  SheetStage,
  { title: string; body: string; height: string }
> = {
  compact: {
    title: "컴팩트",
    body: "핵심 행동 하나만 보이는 최소 높이입니다.",
    height: "h-[172px]",
  },
  medium: {
    title: "중간",
    body: "선택 상태와 보조 행동을 함께 보여주는 기본 높이입니다.",
    height: "h-[238px]",
  },
  expanded: {
    title: "확장",
    body: "긴 콘텐츠와 복수 컨트롤을 다룰 때 쓰는 최대 높이입니다.",
    height: "h-[328px]",
  },
}

function ThreeStageSheetPreview({
  activeStage,
  className,
}: ThreeStageSheetPreviewProps) {
  const copy = stageCopy[activeStage]

  return (
    <div
      className={cn(
        "relative min-h-[386px] overflow-hidden bg-[var(--calendar-app-bg)] px-3 pt-4 shadow-[inset_0_0_0_1px_var(--calendar-divider)]",
        className
      )}
    >
      <div className="mx-auto grid max-w-[15.5rem] grid-cols-7 gap-px overflow-hidden rounded-[16px] opacity-60">
        {Array.from({ length: 21 }, (_, index) => (
          <div key={index} className="aspect-[4/5] bg-white/58" />
        ))}
      </div>
      <div
        className={cn(
          "absolute inset-x-3 bottom-3 overflow-hidden rounded-[30px] border border-[var(--calendar-sheet-border)] bg-[var(--calendar-sheet-surface-strong)] text-foreground shadow-[var(--calendar-sheet-shadow)] backdrop-blur-[28px] transition-[height] duration-300",
          copy.height
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[image:var(--calendar-sheet-glass-overlay)]" />
        <div className="relative z-10 flex h-full flex-col px-4 pt-2.5 pb-4">
          <div className="flex justify-center">
            <span className="h-1.5 w-10 rounded-full bg-[var(--calendar-sheet-handle)]" />
          </div>
          <div className="mt-3 text-center">
            <p className="text-[0.72rem] font-semibold tracking-[0.14em] text-foreground/42 uppercase">
              {copy.title}
            </p>
            <h3 className="mt-1 text-[1.08rem] font-semibold text-balance">
              하단 표면의 단계 전환
            </h3>
            <p className="mx-auto mt-1 max-w-[15rem] text-[0.82rem] leading-5 text-foreground/58">
              {copy.body}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-[18px] bg-black/[0.045] p-1">
            {["주요", "보조", "추가"].map((label, index) => (
              <span
                key={label}
                className={cn(
                  "grid h-9 place-items-center rounded-[14px] text-[0.78rem] font-medium",
                  index === 0
                    ? "bg-white text-foreground shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
                    : "text-foreground/48"
                )}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-3 grid min-h-0 flex-1 place-items-center rounded-[20px] bg-white/56 px-4 text-center text-[0.84rem] font-medium text-foreground/58">
            {activeStage === "expanded"
              ? "확장 상태에서도 닫기와 스크롤 경계를 명확히 유지합니다."
              : "같은 화면 맥락 위에서 표면의 높이만 조용히 바뀝니다."}
          </div>
        </div>
      </div>
    </div>
  )
}

export { ThreeStageSheetPreview }
