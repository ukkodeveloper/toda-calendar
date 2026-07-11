"use client"

import * as React from "react"
import { Menu } from "@base-ui/react/menu"

import { IconButton } from "@workspace/ui/components/icon-button"
import { cn } from "@workspace/ui/lib/utils"

/**
 * FormatFilter — Base UI Menu(headless) 위의 다중선택 필터 메뉴. (규칙5)
 *
 * a11y 는 Base UI 가 보장한다: roving tabindex·↑↓ 화살표·Home/End·타입어헤드·
 * 바깥클릭 닫힘·Escape·트리거로 포커스 복원·`role="menu"`/`menuitemcheckbox`·
 * `aria-checked`. 손수 만든 pointerdown/keydown/포커스 로직 전부 제거.
 *
 * `Menu.CheckboxItem` 은 클릭해도 메뉴를 닫지 않으므로(체크 토글) 여러 옵션을
 * 연속 토글할 수 있다. 색·라운드는 semantic 토큰 유틸리티만(규칙1·2·3).
 */
export type FormatFilterOption<T extends string> = {
  value: T
  label: string
  description?: string
}

type FormatFilterProps<T extends string> = {
  options: Array<FormatFilterOption<T>>
  selected: Record<T, boolean>
  triggerLabel?: string
  title?: string
  description?: string
  onToggle: (value: T) => void
  className?: string
}

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-[1.05rem]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7h16" strokeLinecap="round" />
      <path d="M7 12h10" strokeLinecap="round" />
      <path d="M10 17h4" strokeLinecap="round" />
    </svg>
  )
}

function CheckMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
    >
      <path
        d="M3 8.5L6.5 12L13 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FormatFilter<T extends string>({
  className,
  description,
  onToggle,
  options,
  selected,
  triggerLabel = "필터 열기",
  title = "Preview filter",
}: FormatFilterProps<T>) {
  return (
    <Menu.Root>
      <div className={cn("relative", className)}>
        <Menu.Trigger
          render={<IconButton size="sm" aria-label={triggerLabel} />}
        >
          <FilterIcon />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner
            side="bottom"
            align="end"
            sideOffset={8}
            className="z-30 outline-none"
          >
            <Menu.Popup
              aria-label={title}
              className="w-[min(12rem,calc(100vw-1.5rem))] origin-[var(--transform-origin)] rounded-panel border border-border-subtle bg-surface-overlay p-1.5 text-left shadow-elevation-3 transition-[transform,opacity] duration-150 ease-out outline-none data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0"
            >
              <Menu.Group>
                <div className="px-2.5 pt-2 pb-1.5">
                  <Menu.GroupLabel className="text-label font-strong tracking-[0.12em] text-text-tertiary uppercase">
                    {title}
                  </Menu.GroupLabel>
                  {description ? (
                    <p className="mt-1 text-label leading-4 text-text-tertiary">
                      {description}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1">
                  {options.map((option) => (
                    <Menu.CheckboxItem
                      key={option.value}
                      checked={selected[option.value]}
                      closeOnClick={false}
                      onCheckedChange={() => onToggle(option.value)}
                      className={cn(
                        "group flex min-h-11 w-full cursor-pointer items-center justify-between rounded-card px-3 py-2.5 text-left transition-colors outline-none select-none data-[checked]:bg-fill-neutral-strong data-[highlighted]:bg-surface-hover"
                      )}
                    >
                      <span className="text-body font-emphasis text-text-secondary group-data-[checked]:text-text-primary">
                        {option.label}
                      </span>
                      <span
                        className={cn(
                          "inline-flex size-5 items-center justify-center rounded-pill border transition-colors",
                          selected[option.value]
                            ? "border-transparent bg-fill-brand text-text-on-brand"
                            : "border-border-standard bg-transparent text-transparent"
                        )}
                      >
                        <Menu.CheckboxItemIndicator>
                          <CheckMark />
                        </Menu.CheckboxItemIndicator>
                      </span>
                    </Menu.CheckboxItem>
                  ))}
                </div>
              </Menu.Group>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </div>
    </Menu.Root>
  )
}

export { FormatFilter }
