"use client"

import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"
import { LayoutGroup, motion, useReducedMotion } from "framer-motion"

import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

export type SegmentedControlOption<T extends string> = {
  value: T
  label: string
}

const segmentedControlVariants = cva(
  "grid rounded-full bg-foreground/[0.055] p-1",
  {
    variants: {
      size: {
        sm: "gap-0.5",
        md: "gap-1",
        lg: "gap-1.5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const segmentedItemVariants = cva(
  "relative min-w-0 rounded-full font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45",
  {
    variants: {
      selected: {
        true: "text-foreground",
        false: "text-foreground/48 hover:text-foreground/72",
      },
      size: {
        sm: "min-h-9 px-3 text-[0.78rem]",
        md: "min-h-10 px-3 text-[0.86rem]",
        lg: "min-h-11 px-4 text-[0.94rem]",
      },
    },
    defaultVariants: {
      selected: false,
      size: "md",
    },
  }
)

type SegmentedControlProps<T extends string> = {
  ariaLabel: string
  options: Array<SegmentedControlOption<T>>
  value: T
  onValueChange: (value: T) => void
  className?: string
} & VariantProps<typeof segmentedControlVariants>

function SegmentedControl<T extends string>({
  ariaLabel,
  className,
  onValueChange,
  options,
  size,
  value,
}: SegmentedControlProps<T>) {
  const layoutGroupId = React.useId()
  const reducedMotion = useReducedMotion()

  return (
    <LayoutGroup id={layoutGroupId}>
      <div
        aria-label={ariaLabel}
        className={cn(segmentedControlVariants({ size, className }))}
        role="radiogroup"
        style={{
          gridTemplateColumns: `repeat(${Math.max(options.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {options.map((option) => {
          const selected = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              aria-checked={selected}
              className={cn(
                segmentedItemVariants({
                  selected,
                  size,
                })
              )}
              role="radio"
              onClick={() => onValueChange(option.value)}
            >
              {selected ? (
                <motion.span
                  layoutId="segmented-control-selection"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
                  transition={
                    reducedMotion
                      ? { duration: motionTokens.duration.instant }
                      : motionTokens.intent.selectionFlow
                  }
                />
              ) : null}
              <span className="relative z-10">{option.label}</span>
            </button>
          )
        })}
      </div>
    </LayoutGroup>
  )
}

export { SegmentedControl, segmentedControlVariants }
