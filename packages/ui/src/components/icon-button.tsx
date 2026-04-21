import type { ComponentProps } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-black/6 bg-white/88 text-foreground shadow-[0_6px_18px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      size: {
        sm: "size-9",
        md: "size-10",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

function IconButton({
  className,
  size,
  type = "button",
  ...props
}: ComponentProps<"button"> & VariantProps<typeof iconButtonVariants>) {
  return (
    <button
      type={type}
      className={cn(iconButtonVariants({ size, className }))}
      {...props}
    />
  )
}

export { IconButton, iconButtonVariants }
