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

const segmentedControlVariants = cva("grid bg-fill-neutral p-1", {
  variants: {
    size: {
      sm: "gap-0.5",
      md: "gap-1",
      lg: "gap-1.5",
    },
    orientation: {
      // 가로 = 캡슐(pill), 세로 = 그룹 패널(pill 은 세로 박스에서 원형 블롭이 됨)
      horizontal: "rounded-pill",
      vertical: "rounded-panel",
    },
  },
  defaultVariants: {
    size: "md",
    orientation: "horizontal",
  },
})

const segmentedItemVariants = cva(
  "relative flex min-w-0 cursor-pointer items-center justify-center font-strong text-text-tertiary transition-colors outline-none select-none hover:text-text-secondary focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface-canvas data-[checked]:text-text-primary",
  {
    variants: {
      size: {
        sm: "min-h-11 px-3 text-caption",
        md: "min-h-11 px-3 text-caption",
        lg: "min-h-12 px-4 text-body",
      },
      orientation: {
        horizontal: "rounded-pill",
        vertical: "rounded-control",
      },
    },
    defaultVariants: {
      size: "md",
      orientation: "horizontal",
    },
  }
)

type SegmentedControlProps<T extends string> = {
  ariaLabel: string
  options: Array<SegmentedControlOption<T>>
  value: T
  onValueChange: (value: T) => void
  className?: string
  /**
   * 배치 방향. horizontal(기본) = 균등폭 가로 세그먼트,
   * vertical = 한 칸씩 세로 스택(좁은 컨트롤 패널·옵션 목록용).
   * Base UI RadioGroup 이 두 방향 모두 화살표 키를 보장한다.
   */
  orientation?: "horizontal" | "vertical"
} & VariantProps<typeof segmentedControlVariants>

function SegmentedControl<T extends string>({
  ariaLabel,
  className,
  onValueChange,
  options,
  orientation = "horizontal",
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
        className={cn(
          segmentedControlVariants({ size, orientation, className })
        )}
        style={
          orientation === "vertical"
            ? undefined
            : {
                gridTemplateColumns: `repeat(${Math.max(options.length, 1)}, minmax(0, 1fr))`,
              }
        }
      >
        {options.map((option) => {
          const selected = value === option.value

          return (
            <Radio.Root
              key={option.value}
              value={option.value}
              className={cn(segmentedItemVariants({ size, orientation }))}
            >
              {selected ? (
                <motion.span
                  layoutId="segmented-control-selection"
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 bg-surface-raised shadow-elevation-2",
                    orientation === "vertical"
                      ? "rounded-control"
                      : "rounded-pill"
                  )}
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
