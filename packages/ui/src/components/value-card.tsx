import { type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * ValueCard — 지표/수치 카드. 순수 표현.
 * tone 은 상태 색조(10% 틴트 + 보더), 색·라운드·타이포는 semantic 토큰만(규칙1·2·3).
 */
const valueCardVariants = cva(
  "rounded-card border border-border-subtle bg-fill-neutral text-left",
  {
    variants: {
      size: {
        sm: "min-h-18 p-4",
        md: "min-h-24 p-5",
        lg: "min-h-32 p-6",
      },
      tone: {
        neutral: "",
        brand: "border-fill-brand/24 bg-fill-brand/14",
        success: "border-fill-success/24 bg-fill-success/14",
        danger: "border-fill-danger/24 bg-fill-danger/14",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "neutral",
    },
  }
)

/** `tone="accent"` 는 `brand` 의 하위호환 alias. */
type ValueCardTone = "neutral" | "brand" | "accent" | "success" | "danger"

type ValueCardProps = {
  description?: ReactNode
  label?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  value: ReactNode
  ref?: Ref<HTMLDivElement>
} & ComponentPropsWithoutRef<"div"> &
  Omit<VariantProps<typeof valueCardVariants>, "tone"> & {
    tone?: ValueCardTone
  }

function ValueCard({
  className,
  description,
  label,
  leading,
  ref,
  size,
  tone = "neutral",
  trailing,
  value,
  ...props
}: ValueCardProps) {
  const hasHeader = Boolean(label || leading || trailing)
  const resolvedTone = tone === "accent" ? "brand" : tone

  return (
    <div
      ref={ref}
      data-slot="value-card"
      className={cn(valueCardVariants({ size, tone: resolvedTone, className }))}
      {...props}
    >
      {hasHeader ? (
        <div className="flex min-h-6 items-center gap-2">
          {leading ? <div className="shrink-0">{leading}</div> : null}
          {label ? (
            <div className="min-w-0 flex-1 truncate text-caption font-strong text-text-tertiary">
              {label}
            </div>
          ) : (
            <div className="flex-1" />
          )}
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
      ) : null}
      <div
        className={cn(
          "truncate text-title font-strong text-text-primary tabular-nums",
          hasHeader ? "mt-1" : ""
        )}
      >
        {value}
      </div>
      {description ? (
        <div className="mt-1 text-caption font-read text-text-tertiary">
          {description}
        </div>
      ) : null}
    </div>
  )
}

export { ValueCard, valueCardVariants }
export type { ValueCardProps, ValueCardTone }
