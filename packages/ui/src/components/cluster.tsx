import type { ComponentProps } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const clusterVariants = cva("flex flex-wrap", {
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
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
    },
  },
  defaultVariants: {
    align: "center",
    gap: "md",
    justify: "start",
  },
})

function Cluster({
  align,
  className,
  gap,
  justify,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof clusterVariants>) {
  return (
    <div
      className={cn(clusterVariants({ align, gap, justify, className }))}
      {...props}
    />
  )
}

export { Cluster, clusterVariants }
