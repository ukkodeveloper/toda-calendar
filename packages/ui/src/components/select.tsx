"use client"

import { type Ref } from "react"

import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@workspace/ui/lib/utils"

import { Icon } from "./icon"

/**
 * Select — 단일 선택 드롭다운. Base UI Select(headless) 위(규칙5).
 * a11y·키보드·타이핑 탐색·portal·Field 연동은 Base UI 가 내장. 표면만 입힌다.
 * 팝업은 Menu 와 같은 프로스티드(유리) 룩(surface-glass + blur + elevation-3).
 * 데이터 주도(options) — 트리거 44px(규칙12). 색·라운드는 semantic 토큰만(규칙1·2·3).
 */
type SelectOption = { value: string; label: string; disabled?: boolean }

type SelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  ref?: Ref<HTMLButtonElement>
}

function Select({
  className,
  disabled,
  onValueChange,
  options,
  placeholder = "선택하세요",
  ref,
  value,
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={(next) => onValueChange(next ?? "")}
      disabled={disabled}
      items={options}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        data-slot="select-trigger"
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-2 rounded-control border border-border-standard bg-surface-inset px-3.5 py-2.5 text-input text-text-primary transition-colors outline-none",
          "hover:border-border-strong",
          "focus-visible:border-border-brand focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-inset",
          "data-[popup-open]:border-border-brand",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <SelectPrimitive.Value
          data-slot="select-value"
          className="min-w-0 truncate data-[placeholder]:text-text-tertiary"
        >
          {(val: string) =>
            options.find((option) => option.value === val)?.label ?? placeholder
          }
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon className="shrink-0 text-text-tertiary">
          <Icon icon={ArrowDown01Icon} size="sm" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          className="z-50 outline-none"
          sideOffset={8}
          alignItemWithTrigger={false}
        >
          <SelectPrimitive.Popup
            data-slot="select-popup"
            className={cn(
              "max-h-[min(20rem,var(--available-height))] w-[var(--anchor-width)] min-w-40 overflow-y-auto rounded-panel border border-border-subtle bg-surface-glass p-1.5 text-text-primary shadow-elevation-3 backdrop-blur-xl outline-none",
              "transition-[opacity,transform] duration-150 ease-out",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
              "motion-reduce:transition-none"
            )}
          >
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                data-slot="select-item"
                className={cn(
                  "flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-control px-3 py-2 text-body text-text-primary transition-colors outline-none select-none",
                  "data-[highlighted]:bg-surface-hover",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                )}
              >
                <SelectPrimitive.ItemText className="min-w-0 truncate">
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="shrink-0 text-text-brand">
                  <Icon icon={Tick02Icon} size="sm" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export { Select }
export type { SelectProps, SelectOption }
