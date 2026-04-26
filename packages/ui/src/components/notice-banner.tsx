import type { ComponentProps, ReactNode } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const noticeBannerVariants = cva(
  "flex min-w-0 items-center gap-3 rounded-[28px] font-semibold tracking-normal",
  {
    variants: {
      tone: {
        neutral: "bg-foreground/[0.055] text-foreground",
        accent: "bg-[var(--ds-accent)]/10 text-foreground",
        warning: "bg-[var(--ds-warning)]/14 text-foreground",
        success: "bg-[var(--ds-success)]/10 text-foreground",
      },
      size: {
        sm: "min-h-12 px-4 py-2.5 text-[0.84rem]",
        md: "min-h-16 px-4 py-3 text-[0.92rem]",
        lg: "min-h-20 px-5 py-4 text-[1rem]",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "neutral",
    },
  }
)

type NoticeBannerProps = {
  action?: ReactNode
  leading?: ReactNode
  title: ReactNode
  trailing?: ReactNode
} & ComponentProps<"div"> &
  VariantProps<typeof noticeBannerVariants>

function NoticeBanner({
  action,
  className,
  leading,
  size,
  title,
  tone,
  trailing,
  ...props
}: NoticeBannerProps) {
  return (
    <div className={cn(noticeBannerVariants({ size, tone, className }))} {...props}>
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <p className="text-pretty">{title}</p>
        {action ? (
          <div className="mt-1 text-[0.92em] font-semibold text-[var(--ds-accent)]">
            {action}
          </div>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0 text-foreground/42">{trailing}</div> : null}
    </div>
  )
}

export { NoticeBanner, noticeBannerVariants }
