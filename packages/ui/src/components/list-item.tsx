import { type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * ListItem — 리스트 행. 순수 표현(래핑하는 쪽이 인터랙션·터치 타깃을 책임).
 * 색·보더·타이포는 semantic 토큰만(규칙1·2·3). selected 는 brand 8% 틴트.
 */
const listItemVariants = cva(
  "flex min-w-0 items-center gap-3 border-border-subtle text-left",
  {
    variants: {
      density: {
        compact: "min-h-13 py-2",
        regular: "min-h-16 py-2.5",
        roomy: "min-h-22 py-3.5",
      },
      divider: {
        true: "border-b",
        false: "",
      },
      selected: {
        true: "bg-fill-brand/8",
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
  ref?: Ref<HTMLDivElement>
} & Omit<ComponentPropsWithoutRef<"div">, "title"> &
  VariantProps<typeof listItemVariants>

function ListItem({
  className,
  density,
  description,
  divider,
  leading,
  meta,
  ref,
  selected,
  subtitle,
  title,
  trailing,
  ...props
}: ListItemProps) {
  return (
    <div
      ref={ref}
      data-slot="list-item"
      className={cn(
        listItemVariants({ density, divider, selected, className })
      )}
      {...props}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <p className="min-w-0 truncate text-body font-strong text-text-primary">
            {title}
          </p>
          {meta ? (
            <span className="shrink-0 text-caption font-strong text-text-tertiary">
              {meta}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-0.5 min-w-0 truncate text-caption font-emphasis text-text-secondary">
            {subtitle}
          </p>
        ) : null}
        {description ? (
          <p className="mt-1 line-clamp-2 text-caption font-read text-text-tertiary">
            {description}
          </p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  )
}

export { ListItem, listItemVariants }
export type { ListItemProps }
