import type { ComponentProps } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const surfaceVariants = cva(
  "rounded-[28px] border border-white/60 bg-[var(--surface-elevated)] text-foreground shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl",
  {
    variants: {
      variant: {
        floating: "",
        inset:
          "border-white/40 bg-[var(--surface-subtle)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
        panel:
          "border-white/70 bg-[var(--surface-panel)] shadow-[0_18px_48px_rgba(15,23,42,0.08)]",
      },
      padding: {
        none: "",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "floating",
      padding: "md",
    },
  }
)

function Surface({
  className,
  variant,
  padding,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof surfaceVariants>) {
  return (
    <div
      data-slot="surface"
      className={cn(surfaceVariants({ variant, padding, className }))}
      {...props}
    />
  )
}

export { Surface, surfaceVariants }
