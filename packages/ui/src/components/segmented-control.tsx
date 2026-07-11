"use client"

import * as React from "react"
import { Radio } from "@base-ui/react/radio"
import { RadioGroup } from "@base-ui/react/radio-group"
import { cva, type VariantProps } from "class-variance-authority"
import { LayoutGroup, motion, useReducedMotion } from "framer-motion"

import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

/**
 * SegmentedControl — Base UI RadioGroup(headless) 위의 단일선택 컨트롤. (규칙5)
 *
 * WAI-ARIA radiogroup 패턴을 그대로: `role="radiogroup"` + `role="radio"`·
 * `aria-checked`. 키보드는 Base UI 가 보장한다: roving tabindex·←→↑↓ 화살표·
 * Home/End·loop. 항상 하나만 선택(빈 선택 없음).
 *
 * 선택 칩은 은은한 raised surface(`bg-surface-raised`)로 — Linear 정체성(흰 블록 X).
 * 최소 높이는 sm 부터 44px(규칙12). 색·라운드는 semantic 토큰만(규칙1·2·3).
 */
export type SegmentedControlOption<T extends string> = {
  value: T
  label: string
}

const segmentedControlVariants = cva("grid rounded-pill bg-fill-neutral p-1", {
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
})

const segmentedItemVariants = cva(
  "relative flex min-w-0 cursor-pointer items-center justify-center rounded-pill font-strong text-text-tertiary transition-colors outline-none select-none hover:text-text-secondary focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface-canvas data-[checked]:text-text-primary",
  {
    variants: {
      size: {
        sm: "min-h-11 px-3 text-caption",
        md: "min-h-11 px-3 text-caption",
        lg: "min-h-12 px-4 text-body",
      },
    },
    defaultVariants: {
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
      <RadioGroup
        aria-label={ariaLabel}
        value={value}
        onValueChange={(next) => {
          if (next) {
            onValueChange(next as T)
          }
        }}
        className={cn(segmentedControlVariants({ size, className }))}
        style={{
          gridTemplateColumns: `repeat(${Math.max(options.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {options.map((option) => {
          const selected = value === option.value

          return (
            <Radio.Root
              key={option.value}
              value={option.value}
              className={cn(segmentedItemVariants({ size }))}
            >
              {selected ? (
                <motion.span
                  layoutId="segmented-control-selection"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-pill bg-surface-raised shadow-elevation-2"
                  transition={
                    reducedMotion
                      ? { duration: motionTokens.duration.instant }
                      : motionTokens.intent.selectionFlow
                  }
                />
              ) : null}
              <span className="relative z-10">{option.label}</span>
            </Radio.Root>
          )
        })}
      </RadioGroup>
    </LayoutGroup>
  )
}

export { SegmentedControl, segmentedControlVariants }
