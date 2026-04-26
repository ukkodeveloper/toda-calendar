import type { ComponentProps, ReactNode } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const appBarVariants = cva("flex shrink-0 items-center gap-3", {
  variants: {
    size: {
      compact: "min-h-14 px-5 py-2",
      regular: "min-h-16 px-5 py-3",
      large: "min-h-[4.5rem] px-5 pt-5 pb-2.5",
    },
    align: {
      start: "justify-start",
      center: "justify-between",
    },
  },
  defaultVariants: {
    align: "center",
    size: "regular",
  },
})

const titleVariants = cva("min-w-0 font-semibold tracking-normal text-foreground", {
  variants: {
    size: {
      compact: "text-[1.08rem] leading-6",
      regular: "text-[1.24rem] leading-7",
      large: "text-[1.72rem] leading-9",
    },
  },
  defaultVariants: {
    size: "regular",
  },
})

type AppBarProps = {
  leading?: ReactNode
  subtitle?: ReactNode
  title: ReactNode
  trailing?: ReactNode
} & ComponentProps<"header"> &
  VariantProps<typeof appBarVariants>

function AppBar({
  align,
  className,
  leading,
  size = "regular",
  subtitle,
  title,
  trailing,
  ...props
}: AppBarProps) {
  return (
    <header
      className={cn(appBarVariants({ align, size, className }))}
      {...props}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div
        className={cn(
          "min-w-0 flex-1",
          align === "center" && leading && trailing && "text-center"
        )}
      >
        <h1 className={cn(titleVariants({ size }))}>{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[0.82rem] font-medium text-foreground/48">
            {subtitle}
          </p>
        ) : null}
      </div>
      {trailing ? (
        <div className="flex shrink-0 items-center gap-2">{trailing}</div>
      ) : null}
    </header>
  )
}

export { AppBar, appBarVariants }
