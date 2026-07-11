import { forwardRef, type ComponentPropsWithoutRef } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Badge — 짧은 상태 라벨. 비인터랙티브(터치 타깃 44px 예외).
 * tone 축(neutral/brand/success/danger)만 노출. Linear 정체성상 neutral 이 기본,
 * brand(인디고)는 강조에만. 색은 semantic 토큰 유틸리티만 참조(규칙1·2·3).
 * 상태 tone 은 fill 위 14% 틴트 + 24% 보더 = opacity step 만 사용(매직 알파 아님).
 */
const badgeVariants = cva(
  "font-strong inline-flex min-h-6 shrink-0 items-center justify-center rounded-pill border",
  {
    variants: {
      tone: {
        neutral: "border-border-subtle bg-fill-neutral text-text-secondary",
        brand: "border-fill-brand/24 bg-fill-brand/14 text-text-brand",
        success: "border-fill-success/24 bg-fill-success/14 text-fill-success",
        danger: "border-fill-danger/24 bg-fill-danger/14 text-fill-danger",
      },
      size: {
        sm: "text-label px-2",
        md: "text-label px-2.5",
        lg: "text-caption min-h-8 px-3",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "neutral",
    },
  }
)

/** `tone="accent"` 는 `brand` 의 하위호환 alias (기존 소비처 유지). */
type BadgeTone = "neutral" | "brand" | "accent" | "success" | "danger"

type BadgeProps = Omit<ComponentPropsWithoutRef<"span">, "color"> &
  Omit<VariantProps<typeof badgeVariants>, "tone"> & {
    tone?: BadgeTone
  }

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, size, tone = "neutral", ...props },
  ref
) {
  const resolvedTone = tone === "accent" ? "brand" : tone
  return (
    <span
      ref={ref}
      data-slot="badge"
      className={cn(badgeVariants({ size, tone: resolvedTone, className }))}
      {...props}
    />
  )
})

export { Badge, badgeVariants }
export type { BadgeProps, BadgeTone }
