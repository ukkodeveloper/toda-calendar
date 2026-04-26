import type { ComponentProps, ReactNode } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const floatingActionButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold shadow-[0_16px_34px_rgba(15,23,42,0.18)] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "min-h-10 px-3.5 text-[0.84rem]",
        md: "min-h-12 px-[1.125rem] text-[0.92rem]",
        lg: "min-h-14 px-5 text-[1.02rem]",
      },
      tone: {
        accent: "bg-[var(--ds-accent)] text-white",
        neutral: "bg-foreground text-background",
        soft: "bg-white text-foreground",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "accent",
    },
  }
)

type FloatingActionButtonProps = {
  icon?: ReactNode
} & ComponentProps<"button"> &
  VariantProps<typeof floatingActionButtonVariants>

function FloatingActionButton({
  children,
  className,
  icon,
  size,
  tone,
  type = "button",
  ...props
}: FloatingActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(floatingActionButtonVariants({ size, tone, className }))}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

export { FloatingActionButton, floatingActionButtonVariants }
