"use client"

import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"
import { LayoutGroup, motion, useReducedMotion } from "framer-motion"

import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

export type BottomTabItem<T extends string> = {
  value: T
  label: string
  icon?: React.ReactNode
  badge?: string | number
  dot?: boolean
}

const bottomTabBarVariants = cva(
  "grid w-full items-center border-t border-foreground/[0.08] bg-white/92 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-2xl",
  {
    variants: {
      floating: {
        true: "rounded-[32px] border border-white/70 shadow-[var(--ds-elevation-2)]",
        false: "",
      },
    },
    defaultVariants: {
      floating: false,
    },
  }
)

type BottomTabBarProps<T extends string> = {
  ariaLabel: string
  items: Array<BottomTabItem<T>>
  onValueChange: (value: T) => void
  value: T
  className?: string
} & VariantProps<typeof bottomTabBarVariants>

function BottomTabBar<T extends string>({
  ariaLabel,
  className,
  floating,
  items,
  onValueChange,
  value,
}: BottomTabBarProps<T>) {
  const groupId = React.useId()
  const reducedMotion = useReducedMotion()

  return (
    <LayoutGroup id={groupId}>
      <div
        aria-label={ariaLabel}
        className={cn(bottomTabBarVariants({ floating, className }))}
        role="tablist"
        style={{
          gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => {
          const selected = item.value === value

          return (
            <button
              key={item.value}
              type="button"
              aria-selected={selected}
              className={cn(
                "relative grid min-h-12 place-items-center gap-0.5 rounded-[16px] text-[0.68rem] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45",
                selected ? "text-foreground" : "text-foreground/38"
              )}
              role="tab"
              onClick={() => onValueChange(item.value)}
            >
              {selected ? (
                <motion.span
                  layoutId="bottom-tab-selection"
                  aria-hidden="true"
                  className="absolute inset-x-3 top-1 h-0.5 rounded-full bg-foreground"
                  transition={
                    reducedMotion
                      ? { duration: motionTokens.duration.instant }
                      : motionTokens.intent.selectionFlow
                  }
                />
              ) : null}
              <span className="relative text-[1.08rem] leading-none">
                {item.icon ?? <span className="block size-5 rounded-full bg-current" />}
                {item.dot ? (
                  <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[var(--ds-accent)]" />
                ) : null}
                {item.badge ? (
                  <span className="absolute -right-3 -top-2 rounded-full bg-[var(--ds-accent)] px-1.5 py-0.5 text-[0.65rem] leading-none text-white">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </LayoutGroup>
  )
}

export { BottomTabBar, bottomTabBarVariants }
