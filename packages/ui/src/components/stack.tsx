import type { ComponentProps } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const stackVariants = cva("flex flex-col", {
  variants: {
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
      xl: "gap-6",
    },
    align: {
      stretch: "items-stretch",
      start: "items-start",
      center: "items-center",
      end: "items-end",
    },
  },
  defaultVariants: {
    align: "stretch",
    gap: "md",
  },
})

function Stack({
  align,
  className,
  gap,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof stackVariants>) {
  return <div className={cn(stackVariants({ align, gap, className }))} {...props} />
}

export { Stack, stackVariants }
