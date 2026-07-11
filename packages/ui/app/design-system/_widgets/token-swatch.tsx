import type { ComponentProps } from "react"

import { cn } from "@workspace/ui/lib/utils"

type TokenSwatchProps = {
  label: string
  token: string
  value?: string
} & Omit<ComponentProps<"div">, "children">

function TokenSwatch({ className, label, token, value, ...props }: TokenSwatchProps) {
  return (
    <div
      className={cn(
        "grid gap-2 rounded-[18px] bg-white/58 p-3 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)]",
        className
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="h-12 rounded-[14px] border border-black/5"
        style={{ background: `var(${token})` }}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 truncate text-[0.72rem] font-medium text-foreground/46">
          {token}
        </p>
        {value ? (
          <p className="mt-0.5 truncate text-[0.68rem] text-foreground/38">
            {value}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export { TokenSwatch }
