"use client"

import { type Ref } from "react"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * IconButton — 원형(pill) 아이콘-only 어포던스. 역할 경계:
 *   Button size="icon"  = 사각 라운드(rounded-control) CTA 계열의 아이콘 버튼.
 *   IconButton          = 원형(rounded-pill) chrome 버튼(툴바·오버레이 위 floating).
 * 둘 다 Base UI Button(headless) 위. 색·라운드·그림자는 semantic 토큰만(규칙1·2·3).
 * 모든 size 44px 이상(규칙12). 아이콘-only 라 aria-label 필수(규칙6).
 */
const iconButtonVariants = cva(
  "group/icon-button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-pill border border-transparent text-text-secondary transition-[background-color,border-color,color] outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-canvas active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        neutral:
          "bg-fill-neutral text-text-primary hover:bg-surface-hover aria-expanded:bg-surface-hover",
        ghost:
          "text-text-secondary hover:bg-fill-neutral hover:text-text-primary aria-expanded:bg-fill-neutral aria-expanded:text-text-primary",
        glass:
          "border-border-subtle bg-surface-glass text-text-primary shadow-elevation-2 backdrop-blur-xl hover:bg-surface-hover",
      },
      size: {
        sm: "size-11",
        md: "size-11",
        lg: "size-12",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "neutral",
    },
  }
)

type IconButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof iconButtonVariants> & {
    /** 아이콘-only 라 접근 가능한 이름은 필수. */
    "aria-label": string
    /** React 19: ref 는 일반 prop. Base UI 가 렌더하는 요소로 전달. */
    ref?: Ref<HTMLButtonElement>
  }

function IconButton({
  className,
  size,
  type,
  variant,
  ref,
  ...props
}: IconButtonProps) {
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="icon-button"
      type={props.render ? type : (type ?? "button")}
      className={cn(iconButtonVariants({ size, variant, className }))}
      {...props}
    />
  )
}

export { IconButton, iconButtonVariants }
export type { IconButtonProps }
