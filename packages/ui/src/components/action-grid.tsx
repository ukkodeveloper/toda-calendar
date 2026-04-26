import type { ComponentProps, ReactNode } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

export type ActionGridItem = {
  id: string
  icon?: ReactNode
  label: ReactNode
  description?: ReactNode
}

const actionGridVariants = cva("grid", {
  variants: {
    columns: {
      two: "grid-cols-2",
      three: "grid-cols-3",
      four: "grid-cols-4",
    },
    gap: {
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-5",
    },
  },
  defaultVariants: {
    columns: "two",
    gap: "md",
  },
})

type ActionGridProps = {
  items: ActionGridItem[]
} & Omit<ComponentProps<"div">, "children"> &
  VariantProps<typeof actionGridVariants>

function ActionGrid({
  className,
  columns,
  gap,
  items,
  ...props
}: ActionGridProps) {
  return (
    <div className={cn(actionGridVariants({ columns, gap, className }))} {...props}>
      {items.map((item) => (
        <div key={item.id} className="flex min-w-0 items-center gap-3">
          {item.icon ? <div className="shrink-0">{item.icon}</div> : null}
          <div className="min-w-0">
            <p className="truncate text-[0.92rem] font-semibold leading-5 text-foreground">
              {item.label}
            </p>
            {item.description ? (
              <p className="mt-0.5 truncate text-[0.74rem] font-medium text-foreground/42">
                {item.description}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export { ActionGrid, actionGridVariants }
