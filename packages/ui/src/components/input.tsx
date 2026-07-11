"use client"

import { type ComponentPropsWithoutRef, type Ref } from "react"

import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Input — 한 줄 텍스트/날짜 입력. Base UI Input(headless) 위(규칙5).
 * Field 안에 두면 label·error 와 자동 연결된다. 색·라운드·타이포는 semantic 토큰만(규칙1·2·3).
 * 높이 44px 이상(규칙12). focus 는 테두리 안쪽(inset) brand ring —
 * 바깥 ring 은 좁은 컨테이너(시트 overflow-hidden)에서 잘리고 크기 변동처럼
 * 보이므로, 테두리 두께·레이아웃은 그대로 두고 안쪽에 색만 얹는다.
 */
type InputProps = ComponentPropsWithoutRef<typeof InputPrimitive> & {
  ref?: Ref<HTMLInputElement>
}

function Input({ className, ref, ...props }: InputProps) {
  return (
    <InputPrimitive
      ref={ref}
      data-slot="input"
      className={cn(
        "flex min-h-11 w-full rounded-control border border-border-standard bg-surface-inset px-3.5 py-2.5 text-input text-text-primary transition-colors outline-none",
        "placeholder:text-text-tertiary",
        "hover:border-border-strong",
        "focus-visible:border-border-brand focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-inset",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid]:border-fill-danger aria-[invalid]:ring-fill-danger",
        className
      )}
      {...props}
    />
  )
}

export { Input }
export type { InputProps }
