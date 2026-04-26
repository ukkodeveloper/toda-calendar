import type { ComponentProps } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const gridVariants = cva("grid", {
  variants: {
    columns: {
      one: "grid-cols-1",
      two: "grid-cols-2",
      three: "grid-cols-3",
    },
    gap: {
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
    },
  },
  defaultVariants: {
    columns: "two",
    gap: "md",
  },
})

function Grid({
  className,
  columns,
  gap,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof gridVariants>) {
  return <div className={cn(gridVariants({ columns, gap, className }))} {...props} />
}

export { Grid, gridVariants }
