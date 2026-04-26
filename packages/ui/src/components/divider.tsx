import type { ComponentProps } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const dividerVariants = cva("shrink-0 bg-foreground/8", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "h-full min-h-6 w-px",
    },
    inset: {
      none: "",
      sm: "mx-2",
      md: "mx-4",
    },
  },
  defaultVariants: {
    inset: "none",
    orientation: "horizontal",
  },
})

function Divider({
  className,
  inset,
  orientation,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof dividerVariants>) {
  return (
    <div
      aria-orientation={orientation ?? "horizontal"}
      role="separator"
      className={cn(dividerVariants({ inset, orientation, className }))}
      {...props}
    />
  )
}

export { Divider, dividerVariants }
