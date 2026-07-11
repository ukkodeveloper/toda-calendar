"use client"

import { type ReactNode, type Ref } from "react"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * FloatingActionButton — 화면 위에 떠서 주 액션을 여는 pill 버튼. Base UI Button 위.
 * 색·라운드·그림자·타이포는 semantic 토큰만(규칙1·2·3). raw hex/white/rem 제거.
 * 모든 size 44px 이상(규칙12). 아이콘-only(children 없음)면 aria-label 필수(규칙6).
 */
const floatingActionButtonVariants = cva(
  "group/fab inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-pill border border-transparent font-strong shadow-elevation-3 transition-[background-color,color] outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-canvas active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      size: {
        sm: "min-h-11 px-4 text-caption",
        md: "min-h-12 px-5 text-body",
        lg: "min-h-14 px-6 text-body",
      },
      tone: {
        brand: "bg-fill-brand text-text-on-brand hover:bg-fill-brand-hover",
        neutral:
          "bg-fill-neutral-strong text-text-primary hover:bg-surface-hover",
        soft: "border-border-subtle bg-surface-raised text-text-primary hover:bg-surface-hover",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "brand",
    },
  }
)

/** `tone="accent"` 는 `brand` 의 하위호환 alias (기존 소비처 유지). */
type FloatingActionButtonTone = "brand" | "accent" | "neutral" | "soft"

type FloatingActionButtonProps = Omit<ButtonPrimitive.Props, "children"> &
  Omit<VariantProps<typeof floatingActionButtonVariants>, "tone"> & {
    tone?: FloatingActionButtonTone
    icon?: ReactNode
    children?: ReactNode
    /** React 19: ref 는 일반 prop. */
    ref?: Ref<HTMLButtonElement>
  }

function FloatingActionButton({
  children,
  className,
  icon,
  ref,
  size,
  tone = "brand",
  type,
  ...props
}: FloatingActionButtonProps) {
  const resolvedTone = tone === "accent" ? "brand" : tone

  if (
    // eslint-disable-next-line turbo/no-undeclared-env-vars -- 번들러가 치환하는 dev 전용 가드
    process.env.NODE_ENV !== "production" &&
    !children &&
    !props["aria-label"] &&
    !props["aria-labelledby"]
  ) {
    console.warn(
      "FloatingActionButton: 텍스트(children) 없이 아이콘만 쓸 땐 aria-label 을 넘기세요."
    )
  }

  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="floating-action-button"
      type={props.render ? type : (type ?? "button")}
      className={cn(
        floatingActionButtonVariants({ size, tone: resolvedTone, className })
      )}
      {...props}
    >
      {icon}
      {children}
    </ButtonPrimitive>
  )
}

export { FloatingActionButton, floatingActionButtonVariants }
export type { FloatingActionButtonProps, FloatingActionButtonTone }
