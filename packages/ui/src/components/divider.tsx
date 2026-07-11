import { type ComponentPropsWithoutRef, type Ref } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const dividerVariants = cva("shrink-0 bg-border-subtle", {
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
  ref,
  ...props
}: ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof dividerVariants> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      aria-orientation={orientation ?? "horizontal"}
      role="separator"
      className={cn(dividerVariants({ inset, orientation, className }))}
      {...props}
    />
  )
}

export { Divider, dividerVariants }
