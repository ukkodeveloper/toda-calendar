"use client"

import * as React from "react"
import { Tabs } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { LayoutGroup, motion, useReducedMotion } from "framer-motion"

import { Badge } from "@workspace/ui/components/badge"
import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

/**
 * PillTabs — Base UI Tabs(headless) 위의 상단 필터/네비 탭. (규칙5)
 *
 * 키보드는 Base UI 가 보장한다: roving tabindex·←→ 화살표·Home/End·loop.
 * `Tabs.List`+`Tabs.Tab` 로 `role="tablist"`/`role="tab"`·`aria-selected` 자동.
 * activateOnFocus=false = 화살표로 포커스 이동, Enter/Space 로 선택(수동 활성).
 *
 * 최소 높이 44px(규칙12) — sm 도 min-h-11. 색·라운드는 semantic 토큰만(규칙1·2·3).
 */
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
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 font-strong tracking-normal whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface-canvas",
  {
    variants: {
      variant: {
        chip: "rounded-pill bg-fill-neutral",
        soft: "rounded-pill bg-surface-raised",
        text: "px-0",
      },
      size: {
        sm: "min-h-11 px-2.5 text-caption",
        md: "min-h-11 px-3.5 text-body",
        lg: "min-h-12 px-4 text-body",
      },
    },
    compoundVariants: [
      {
        variant: "chip",
        className:
          "text-text-tertiary hover:text-text-primary data-[active]:text-text-on-brand",
      },
      {
        variant: "soft",
        className:
          "text-text-tertiary hover:text-text-primary data-[active]:text-text-primary",
      },
      {
        variant: "text",
        className:
          "text-text-quaternary hover:text-text-secondary data-[active]:text-text-primary",
      },
    ],
    defaultVariants: {
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
      <Tabs.Root
        value={value}
        onValueChange={(next) => onValueChange(next as T)}
      >
        <Tabs.List
          activateOnFocus={false}
          aria-label={ariaLabel}
          className={cn(pillTabsVariants({ gap, scrollable, className }))}
        >
          {options.map((option) => {
            const selected = option.value === value

            return (
              <Tabs.Tab
                key={option.value}
                value={option.value}
                className={cn(pillTabVariants({ size, variant }))}
              >
                {selected && variant !== "text" ? (
                  <motion.span
                    layoutId="pill-tab-selection"
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-0 rounded-pill",
                      variant === "chip"
                        ? "bg-fill-brand"
                        : "bg-surface-raised shadow-elevation-2"
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
                    className="absolute right-0 -bottom-1 left-0 h-1 rounded-pill bg-fill-brand"
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
                    <span className="size-1.5 rounded-pill bg-fill-brand" />
                  ) : null}
                  {option.badge ? (
                    <Badge tone="accent" size="sm">
                      {option.badge}
                    </Badge>
                  ) : null}
                </span>
              </Tabs.Tab>
            )
          })}
        </Tabs.List>
      </Tabs.Root>
    </LayoutGroup>
  )
}

export { PillTabs, pillTabVariants, pillTabsVariants }
