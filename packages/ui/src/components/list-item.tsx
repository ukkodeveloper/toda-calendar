import type { ComponentProps, ReactNode } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const listItemVariants = cva(
  "flex min-w-0 items-center gap-3 border-foreground/[0.07] text-left",
  {
    variants: {
      density: {
        compact: "min-h-[3.25rem] py-2",
        regular: "min-h-16 py-2.5",
        roomy: "min-h-[5.5rem] py-3.5",
      },
      divider: {
        true: "border-b",
        false: "",
      },
      selected: {
        true: "bg-[var(--ds-accent)]/[0.06]",
        false: "",
      },
    },
    defaultVariants: {
      density: "regular",
      divider: true,
      selected: false,
    },
  }
)

type ListItemProps = {
  description?: ReactNode
  leading?: ReactNode
  meta?: ReactNode
  subtitle?: ReactNode
  title: ReactNode
  trailing?: ReactNode
} & ComponentProps<"div"> &
  VariantProps<typeof listItemVariants>

function ListItem({
  className,
  density,
  description,
  divider,
  leading,
  meta,
  selected,
  subtitle,
  title,
  trailing,
  ...props
}: ListItemProps) {
  return (
    <div
      className={cn(listItemVariants({ density, divider, selected, className }))}
      {...props}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <p className="min-w-0 truncate text-[0.98rem] font-semibold leading-6 text-foreground">
            {title}
          </p>
          {meta ? (
            <span className="shrink-0 text-[0.84rem] font-semibold text-foreground/42">
              {meta}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-0.5 min-w-0 truncate text-[0.88rem] font-medium leading-5 text-foreground/48">
            {subtitle}
          </p>
        ) : null}
        {description ? (
          <p className="mt-1 line-clamp-2 text-[0.88rem] font-medium leading-5 text-foreground/58">
            {description}
          </p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  )
}

export { ListItem, listItemVariants }
