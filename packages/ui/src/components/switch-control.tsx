"use client"

import { type Ref } from "react"

import { Switch } from "@base-ui/react/switch"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * SwitchControl — Base UI Switch(headless) 위의 온·오프 토글. (규칙5)
 * 손수 만든 role="switch" 를 걷어내고 Base UI 가 aria-checked·키보드를 보장한다.
 * 색·라운드는 semantic 토큰만(규칙1·2·3). 켜짐은 fill-brand, 트랙/썸은 표면 토큰.
 * 최소 높이 md 부터 44px(규칙12). label 은 aria-label 로 연결(규칙6).
 */
const switchVariants = cva(
  "group/switch inline-flex shrink-0 cursor-pointer items-center rounded-pill bg-fill-neutral-strong p-1 transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-canvas disabled:pointer-events-none disabled:opacity-50 data-[checked]:bg-fill-brand",
  {
    variants: {
      size: {
        sm: "h-8 w-13",
        md: "h-11 w-18",
        lg: "h-12 w-20",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const switchThumbVariants = cva(
  "block rounded-pill bg-surface-raised shadow-elevation-2 transition-transform",
  {
    variants: {
      size: {
        sm: "size-6 data-[checked]:translate-x-5",
        md: "size-9 data-[checked]:translate-x-7",
        lg: "size-10 data-[checked]:translate-x-8",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

type SwitchControlProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** 아이콘/텍스트 라벨이 없는 컨트롤이라 접근 가능한 이름은 필수. */
  label: string
  disabled?: boolean
  className?: string
  /** React 19: ref 는 일반 prop. */
  ref?: Ref<HTMLButtonElement>
} & VariantProps<typeof switchVariants>

function SwitchControl({
  checked,
  className,
  disabled,
  label,
  onCheckedChange,
  ref,
  size,
}: SwitchControlProps) {
  return (
    <Switch.Root
      ref={ref}
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      className={cn(switchVariants({ size, className }))}
    >
      <Switch.Thumb className={cn(switchThumbVariants({ size }))} />
    </Switch.Root>
  )
}

export { SwitchControl, switchVariants }
export type { SwitchControlProps }
