"use client"

import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { Button, type ButtonProps } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/**
 * SheetFooter — 시트(BottomSheet/DetentSheet) 최하단에 핀 고정되는 floating 액션 바.
 *
 * 시트의 `footer` 슬롯(스크롤 밖 하단 고정)에 그대로 넣어 쓰거나, mock 프레임·
 * 단독으로도 쓸 수 있는 순수 표현 컴포넌트다. 본문과의 분리는 상단 hairline
 * divider + 반투명 surface + backdrop-blur 로, 하단 안전영역은 `pb-safe` 로 책임진다.
 *
 * a11y·터치 타깃은 DS `Button`(Base UI headless) 재사용으로 보장한다(규칙5·7·12).
 * 색·라운드·간격은 semantic 토큰 유틸리티만(규칙1·2·3).
 *
 * compound API:
 *   <SheetFooter>
 *     <SheetFooter.Secondary onClick={cancel}>취소</SheetFooter.Secondary>
 *     <SheetFooter.Primary onClick={submit}>생성</SheetFooter.Primary>
 *   </SheetFooter>
 *
 * 선언 순서 = 표시 순서. 관례상 보조(취소)를 먼저(왼쪽/위), Primary 를 마지막
 * (오른쪽/아래)에 둔다. layout="split" 은 가로 균등 분할, "stack" 은 세로 풀폭.
 */
type SheetFooterLayout = "split" | "stack"

const SheetFooterContext = React.createContext<SheetFooterLayout>("split")

const sheetFooterVariants = cva(
  // 상단 divider + 반투명 blur surface(본문과 분리) + safe-area 하단 인셋.
  "flex w-full gap-2 border-t border-border-subtle bg-surface-overlay/90 px-4 pt-3 pb-safe backdrop-blur-lg sm:px-5",
  {
    variants: {
      layout: {
        split: "flex-row items-center",
        stack: "flex-col",
      },
    },
    defaultVariants: {
      layout: "split",
    },
  }
)

type SheetFooterProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof sheetFooterVariants>

function SheetFooter({
  className,
  layout = "split",
  children,
  ...props
}: SheetFooterProps) {
  return (
    <SheetFooterContext.Provider value={layout ?? "split"}>
      <div
        data-slot="sheet-footer"
        className={cn(sheetFooterVariants({ layout, className }))}
        {...props}
      >
        {children}
      </div>
    </SheetFooterContext.Provider>
  )
}

/**
 * layout 에 따라 슬롯 버튼의 폭을 정한다: split=가로 균등(flex-1), stack=풀폭(w-full).
 */
function useSlotWidthClass() {
  const layout = React.useContext(SheetFooterContext)
  return layout === "split" ? "flex-1" : "w-full"
}

/**
 * 핵심 액션(생성·확인·저장). 기본 variant=primary·size=lg(h-12, 터치 44px+).
 * ButtonProps 를 그대로 받아 loading·disabled·onClick·render(링크) 를 넘길 수 있다.
 */
function SheetFooterPrimary({
  className,
  variant = "primary",
  size = "lg",
  ...props
}: ButtonProps) {
  const widthClass = useSlotWidthClass()
  return (
    <Button
      data-slot="sheet-footer-primary"
      variant={variant}
      size={size}
      className={cn(widthClass, className)}
      {...props}
    />
  )
}

/**
 * 보조 액션(취소·닫기). 기본 variant=outline 로 핵심 액션과 위계를 나눈다.
 * variant 를 넘겨 ghost·neutral·danger 등으로 바꿀 수 있다.
 */
function SheetFooterSecondary({
  className,
  variant = "outline",
  size = "lg",
  ...props
}: ButtonProps) {
  const widthClass = useSlotWidthClass()
  return (
    <Button
      data-slot="sheet-footer-secondary"
      variant={variant}
      size={size}
      className={cn(widthClass, className)}
      {...props}
    />
  )
}

const SheetFooterRoot = Object.assign(SheetFooter, {
  Primary: SheetFooterPrimary,
  Secondary: SheetFooterSecondary,
})

export { SheetFooterRoot as SheetFooter, sheetFooterVariants }
export type { SheetFooterProps, SheetFooterLayout }
