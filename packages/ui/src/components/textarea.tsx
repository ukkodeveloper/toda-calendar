"use client"

import { type ComponentPropsWithoutRef } from "react"

import { Field as FieldPrimitive } from "@base-ui/react/field"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Textarea — 여러 줄 입력. Base UI 엔 textarea 프리미티브가 없어 Field.Control 로
 * 네이티브 textarea 를 렌더한다 → Field 의 label·error 연결·validity 를 그대로 받는다(규칙5·6).
 * Field 밖 단독으로도 동작(Field.Control 은 컨텍스트 없으면 순수 textarea).
 * 색·라운드·타이포는 semantic 토큰만(규칙1·2·3).
 */
type TextareaProps = ComponentPropsWithoutRef<typeof FieldPrimitive.Control> & {
  rows?: number
}

function Textarea({ className, rows = 3, ...props }: TextareaProps) {
  return (
    <FieldPrimitive.Control
      render={<textarea rows={rows} />}
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full resize-y rounded-control border border-border-standard bg-surface-inset px-3.5 py-2.5 text-input text-text-primary transition-colors outline-none",
        "placeholder:text-text-tertiary",
        "hover:border-border-strong",
        "focus-visible:border-border-brand focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-inset",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid]:border-fill-danger",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
export type { TextareaProps }
