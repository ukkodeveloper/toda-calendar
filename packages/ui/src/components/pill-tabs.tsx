"use client"

import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"
import { LayoutGroup, motion, useReducedMotion } from "framer-motion"

import { Badge } from "@workspace/ui/components/badge"
import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

export type PillTabOption<T extends string> = {
  value: T
  label: string
  badge?: string | number
  dot?: boolean
  leading?: React.ReactNode
}

const pillTabsVariants = cva("flex min-w-0 items-center", {
  variants: {
    gap: {
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
    },
    scrollable: {
      true: "overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      false: "overflow-visible",
    },
  },
  defaultVariants: {
    gap: "md",
    scrollable: true,
  },
})

const pillTabVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-semibold tracking-normal transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45",
  {
    variants: {
      variant: {
        chip: "",
        soft: "",
        text: "",
      },
      size: {
        sm: "min-h-8 px-2.5 text-[0.8rem]",
        md: "min-h-10 px-3.5 text-[0.9rem]",
        lg: "min-h-11 px-4 text-[1rem]",
      },
      selected: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "chip",
        className: "rounded-full bg-foreground/[0.055]",
      },
      {
        variant: "soft",
        className: "rounded-full bg-white/62 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)]",
      },
      {
        variant: "text",
        className: "px-0",
      },
      {
        selected: false,
        variant: "chip",
        className: "text-foreground/72 hover:text-foreground",
      },
      {
        selected: true,
        variant: "chip",
        className: "text-background",
      },
      {
        selected: true,
        variant: "soft",
        className: "text-foreground",
      },
      {
        selected: false,
        variant: "soft",
        className: "text-foreground/62 hover:text-foreground",
      },
      {
        selected: true,
        variant: "text",
        className: "text-foreground",
      },
      {
        selected: false,
        variant: "text",
        className: "text-foreground/42 hover:text-foreground/68",
      },
    ],
    defaultVariants: {
      selected: false,
      size: "md",
      variant: "chip",
    },
  }
)

type PillTabsProps<T extends string> = {
  ariaLabel: string
  options: Array<PillTabOption<T>>
  onValueChange: (value: T) => void
  value: T
  className?: string
} & VariantProps<typeof pillTabsVariants> &
  VariantProps<typeof pillTabVariants>

function PillTabs<T extends string>({
  ariaLabel,
  className,
  gap,
  onValueChange,
  options,
  scrollable,
  size,
  value,
  variant = "chip",
}: PillTabsProps<T>) {
  const layoutGroupId = React.useId()
  const reducedMotion = useReducedMotion()

  return (
    <LayoutGroup id={layoutGroupId}>
      <div
        aria-label={ariaLabel}
        className={cn(pillTabsVariants({ gap, scrollable, className }))}
        role="tablist"
      >
        {options.map((option) => {
          const selected = option.value === value

          return (
            <button
              key={option.value}
              type="button"
              aria-selected={selected}
              className={cn(pillTabVariants({ selected, size, variant }))}
              role="tab"
              onClick={() => onValueChange(option.value)}
            >
              {selected && variant !== "text" ? (
                <motion.span
                  layoutId="pill-tab-selection"
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 rounded-full",
                    variant === "chip"
                      ? "bg-foreground"
                      : "bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
                  )}
                  transition={
                    reducedMotion
                      ? { duration: motionTokens.duration.instant }
                      : motionTokens.intent.selectionFlow
                  }
                />
              ) : null}
              {selected && variant === "text" ? (
                <motion.span
                  layoutId="pill-tab-text-selection"
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-foreground"
                  transition={
                    reducedMotion
                      ? { duration: motionTokens.duration.instant }
                      : motionTokens.intent.selectionFlow
                  }
                />
              ) : null}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                {option.leading}
                {option.label}
                {option.dot ? (
                  <span className="size-1.5 rounded-full bg-[var(--ds-accent)]" />
                ) : null}
                {option.badge ? (
                  <Badge tone="accent" size="sm">
                    {option.badge}
                  </Badge>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    </LayoutGroup>
  )
}

export { PillTabs, pillTabVariants, pillTabsVariants }
