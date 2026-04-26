import type { ComponentProps } from "react"

import { cn } from "@workspace/ui/lib/utils"

type SpacingScaleItem = {
  label: string
  token: string
  value: string
}

type SpacingScaleProps = {
  items: SpacingScaleItem[]
} & Omit<ComponentProps<"div">, "children">

function SpacingScale({ className, items, ...props }: SpacingScaleProps) {
  return (
    <div className={cn("grid gap-2", className)} {...props}>
      {items.map((item) => (
        <div
          key={item.token}
          className="grid grid-cols-[4rem_minmax(0,1fr)_3.5rem] items-center gap-3 rounded-[16px] bg-white/58 px-3 py-2"
        >
          <span className="text-sm font-semibold text-foreground/72">
            {item.label}
          </span>
          <span
            aria-hidden="true"
            className="h-3 rounded-full bg-[var(--ds-accent)]/72"
            style={{ width: item.value }}
          />
          <span className="text-right text-[0.72rem] font-medium text-foreground/46">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export { SpacingScale, type SpacingScaleItem }
