import type { ComponentProps, ReactNode } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const valueCardVariants = cva(
  "rounded-[24px] border border-foreground/[0.06] bg-foreground/[0.045] text-left",
  {
    variants: {
      size: {
        sm: "min-h-18 p-4",
        md: "min-h-24 p-5",
        lg: "min-h-32 p-6",
      },
      tone: {
        neutral: "",
        accent:
          "border-[var(--ds-accent)]/12 bg-[var(--ds-accent)]/10 text-foreground",
        success:
          "border-[var(--ds-success)]/12 bg-[var(--ds-success)]/10 text-foreground",
        danger:
          "border-[var(--ds-danger)]/12 bg-[var(--ds-danger)]/10 text-foreground",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "neutral",
    },
  }
)

type ValueCardProps = {
  description?: ReactNode
  label?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  value: ReactNode
} & ComponentProps<"div"> &
  VariantProps<typeof valueCardVariants>

function ValueCard({
  className,
  description,
  label,
  leading,
  size,
  tone,
  trailing,
  value,
  ...props
}: ValueCardProps) {
  const hasHeader = Boolean(label || leading || trailing)

  return (
    <div
      data-slot="value-card"
      className={cn(valueCardVariants({ size, tone, className }))}
      {...props}
    >
      {hasHeader ? (
        <div className="flex min-h-6 items-center gap-2">
          {leading ? <div className="shrink-0">{leading}</div> : null}
          {label ? (
            <div className="min-w-0 flex-1 truncate text-[0.78rem] leading-5 font-semibold text-foreground/58">
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
          "truncate text-[1.32rem] leading-8 font-semibold text-foreground",
          hasHeader ? "mt-1" : ""
        )}
      >
        {value}
      </div>
      {description ? (
        <div className="mt-1 text-[0.78rem] leading-5 font-medium text-foreground/48">
          {description}
        </div>
      ) : null}
    </div>
  )
}

export { ValueCard, valueCardVariants }
