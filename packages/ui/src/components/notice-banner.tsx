import { type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * NoticeBanner — 인라인 안내/상태 배너. 순수 표현.
 * tone 은 상태 색조(14% 틴트), 색·라운드·타이포는 semantic 토큰만(규칙1·2·3).
 */
const noticeBannerVariants = cva(
  "flex min-w-0 items-center gap-3 rounded-panel font-emphasis",
  {
    variants: {
      tone: {
        neutral: "bg-fill-neutral text-text-primary",
        brand: "bg-fill-brand/14 text-text-primary",
        warning: "bg-fill-warning/14 text-text-primary",
        success: "bg-fill-success/14 text-text-primary",
      },
      size: {
        sm: "min-h-12 px-4 py-2.5 text-caption",
        md: "min-h-16 px-4 py-3 text-body",
        lg: "min-h-20 px-5 py-4 text-body",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "neutral",
    },
  }
)

/** `tone="accent"` 는 `brand` 의 하위호환 alias. */
type NoticeBannerTone = "neutral" | "brand" | "accent" | "warning" | "success"

type NoticeBannerProps = {
  action?: ReactNode
  leading?: ReactNode
  title: ReactNode
  trailing?: ReactNode
  ref?: Ref<HTMLDivElement>
} & Omit<ComponentPropsWithoutRef<"div">, "title"> &
  Omit<VariantProps<typeof noticeBannerVariants>, "tone"> & {
    tone?: NoticeBannerTone
  }

function NoticeBanner({
  action,
  className,
  leading,
  ref,
  size,
  title,
  tone = "neutral",
  trailing,
  ...props
}: NoticeBannerProps) {
  const resolvedTone = tone === "accent" ? "brand" : tone
  return (
    <div
      ref={ref}
      data-slot="notice-banner"
      className={cn(
        noticeBannerVariants({ size, tone: resolvedTone, className })
      )}
      {...props}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <p className="text-pretty">{title}</p>
        {action ? (
          <div className="mt-1 text-caption font-strong text-text-brand">
            {action}
          </div>
        ) : null}
      </div>
      {trailing ? (
        <div className="shrink-0 text-text-tertiary">{trailing}</div>
      ) : null}
    </div>
  )
}

export { NoticeBanner, noticeBannerVariants }
export type { NoticeBannerProps, NoticeBannerTone }
