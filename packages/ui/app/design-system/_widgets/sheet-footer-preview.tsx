"use client"

import * as React from "react"

import { SheetFooter } from "@workspace/ui/components/sheet-footer"
import { cn } from "@workspace/ui/lib/utils"

type SheetFooterLayout = "split" | "stack"

/**
 * SheetFooter 데모 — mock 시트 프레임 안에서 하단 floating 액션 바를 보여준다.
 * 본문은 스크롤되고, footer 는 상단 divider + 반투명 blur 로 그 위에 얹혀 고정된다.
 * 실제 시트는 안 열고(병행 작업과 격리) 순수 표현만 렌더한다.
 */
function SheetFooterPreview({ className }: { className?: string }) {
  const [layout, setLayout] = React.useState<SheetFooterLayout>("split")

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="grid grid-cols-2 gap-2 rounded-panel bg-fill-neutral p-1">
        {(["split", "stack"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setLayout(value)}
            className={cn(
              "grid h-9 place-items-center rounded-control text-caption font-emphasis transition-colors",
              value === layout
                ? "bg-surface-raised text-text-primary shadow-elevation-2"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            {value === "split" ? "가로 분할" : "세로 풀폭"}
          </button>
        ))}
      </div>

      <div className="relative h-[440px] overflow-hidden rounded-hero border border-border-subtle bg-surface-canvas">
        {/* 시트 뒤 화면 힌트 */}
        <div className="px-4 pt-5">
          <div className="mx-auto grid max-w-64 grid-cols-7 gap-px overflow-hidden rounded-panel opacity-50">
            {Array.from({ length: 21 }, (_, index) => (
              <div key={index} className="aspect-[4/5] bg-surface-raised" />
            ))}
          </div>
        </div>

        {/* mock 시트 프레임 */}
        <section className="absolute inset-x-0 bottom-0 flex max-h-[86%] flex-col overflow-hidden rounded-t-hero border border-border-subtle bg-surface-overlay text-text-primary shadow-elevation-3">
          <div className="flex justify-center pt-2.5">
            <div className="h-1.5 w-10 rounded-pill bg-fill-neutral-strong" />
          </div>

          <header className="px-5 pt-2 pb-3 text-center">
            <h3 className="text-title font-strong">새 기록 만들기</h3>
            <p className="mt-1 text-caption text-text-tertiary">
              스크롤해도 하단 액션 바는 고정됩니다.
            </p>
          </header>

          {/* 스크롤 본문 — footer 가 이 위에 반투명으로 얹힌다 */}
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 pb-4">
            {Array.from({ length: 9 }, (_, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-panel bg-surface-raised px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-body font-emphasis text-text-primary">
                    항목 {index + 1}
                  </p>
                  <p className="text-caption text-text-tertiary">
                    본문이 길어져도 footer 밑으로 흘러갑니다.
                  </p>
                </div>
                <span className="size-5 shrink-0 rounded-full border border-border-standard" />
              </div>
            ))}
          </div>

          {/* floating 액션 footer */}
          <SheetFooter layout={layout}>
            <SheetFooter.Secondary>취소</SheetFooter.Secondary>
            <SheetFooter.Primary>생성</SheetFooter.Primary>
          </SheetFooter>
        </section>
      </div>
    </div>
  )
}

export { SheetFooterPreview }
