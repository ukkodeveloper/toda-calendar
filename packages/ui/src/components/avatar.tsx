import type { ComponentProps } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const avatarVariants = cva(
  "inline-grid shrink-0 place-items-center overflow-hidden bg-foreground/[0.06] font-semibold text-foreground/58",
  {
    variants: {
      size: {
        xs: "size-7 text-[0.68rem]",
        sm: "size-9 text-[0.78rem]",
        md: "size-12 text-sm",
        lg: "size-16 text-base",
        xl: "size-20 text-lg",
      },
      shape: {
        circle: "rounded-full",
        rounded: "rounded-[18px]",
        squircle: "rounded-[24px]",
      },
      tone: {
        neutral: "bg-foreground/[0.06] text-foreground/58",
        accent: "bg-[var(--ds-accent)]/10 text-[var(--ds-accent)]",
        success: "bg-[var(--ds-success)]/10 text-[var(--ds-success)]",
        danger: "bg-[var(--ds-danger)]/10 text-[var(--ds-danger)]",
      },
    },
    defaultVariants: {
      shape: "circle",
      size: "md",
      tone: "neutral",
    },
  }
)

function Avatar({
  className,
  shape,
  size,
  tone,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof avatarVariants>) {
  return (
    <span
      aria-hidden={props.children ? undefined : true}
      className={cn(avatarVariants({ shape, size, tone, className }))}
      {...props}
    />
  )
}

export { Avatar, avatarVariants }
