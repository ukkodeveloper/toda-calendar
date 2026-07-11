import { type ComponentPropsWithoutRef, type Ref } from "react"

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
  ref,
  ...props
}: ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof stackVariants> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn(stackVariants({ align, gap, className }))}
      {...props}
    />
  )
}

export { Stack, stackVariants }
