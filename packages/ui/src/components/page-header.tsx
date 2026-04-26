import type { ComponentProps, ReactNode } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const pageHeaderVariants = cva("flex shrink-0 gap-3", {
  variants: {
    align: {
      start: "items-start",
      center: "items-center",
    },
    size: {
      compact: "min-h-14 px-5 py-2",
      regular: "min-h-16 px-5 py-3",
      large: "min-h-[4.5rem] px-5 pt-5 pb-2.5",
    },
  },
  defaultVariants: {
    align: "start",
    size: "regular",
  },
})

const pageHeaderTitleVariants = cva(
  "min-w-0 shrink-0 font-semibold tracking-normal text-foreground",
  {
    variants: {
      size: {
        compact: "text-[1.08rem] leading-6",
        regular: "text-[1.28rem] leading-7",
        large: "text-[1.86rem] leading-9",
      },
    },
    defaultVariants: {
      size: "regular",
    },
  }
)

const pageHeaderMetaVariants = cva(
  "min-w-0 font-semibold tracking-normal text-foreground/48",
  {
    variants: {
      size: {
        compact: "text-[0.8rem] leading-5",
        regular: "text-[0.86rem] leading-5",
        large: "text-[0.98rem] leading-6",
      },
    },
    defaultVariants: {
      size: "regular",
    },
  }
)

type PageHeaderProps = {
  leading?: ReactNode
  meta?: ReactNode
  subtitle?: ReactNode
  title: ReactNode
  trailing?: ReactNode
} & ComponentProps<"header"> &
  VariantProps<typeof pageHeaderVariants>

function PageHeader({
  align,
  className,
  leading,
  meta,
  size = "regular",
  subtitle,
  title,
  trailing,
  ...props
}: PageHeaderProps) {
  const centered = align === "center" && leading && trailing

  return (
    <header
      className={cn(pageHeaderVariants({ align, size, className }))}
      {...props}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className={cn("min-w-0 flex-1", centered && "text-center")}>
        <div
          className={cn(
            "flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5",
            centered && "justify-center"
          )}
        >
          <h1 className={cn(pageHeaderTitleVariants({ size }))}>{title}</h1>
          {meta ? (
            <div className={cn(pageHeaderMetaVariants({ size }))}>{meta}</div>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-1 truncate text-[0.86rem] font-medium leading-5 text-foreground/46">
            {subtitle}
          </p>
        ) : null}
      </div>
      {trailing ? (
        <div className="flex shrink-0 items-center gap-1.5">{trailing}</div>
      ) : null}
    </header>
  )
}

export {
  PageHeader,
  pageHeaderMetaVariants,
  pageHeaderTitleVariants,
  pageHeaderVariants,
}
