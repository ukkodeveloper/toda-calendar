import type { ComponentProps } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const badgeVariants = cva(
  "inline-flex min-h-6 shrink-0 items-center justify-center rounded-full border font-semibold",
  {
    variants: {
      tone: {
        neutral: "border-foreground/8 bg-foreground/[0.06] text-foreground/68",
        accent:
          "border-[var(--ds-accent)]/10 bg-[var(--ds-accent)]/10 text-[var(--ds-accent)]",
        success:
          "border-[var(--ds-success)]/10 bg-[var(--ds-success)]/10 text-[var(--ds-success)]",
        danger:
          "border-[var(--ds-danger)]/10 bg-[var(--ds-danger)]/10 text-[var(--ds-danger)]",
      },
      size: {
        sm: "px-2 text-[0.68rem]",
        md: "px-2.5 text-[0.74rem]",
        lg: "min-h-8 px-3 text-[0.82rem]",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "neutral",
    },
  }
)

function Badge({
  className,
  size,
  tone,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ size, tone, className }))} {...props} />
  )
}

export { Badge, badgeVariants }
