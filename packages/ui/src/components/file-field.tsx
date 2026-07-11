"use client"

import {
  useId,
  useRef,
  type ChangeEvent,
  type ReactNode,
  type Ref,
} from "react"

import { Camera01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"

import { Icon } from "./icon"

/**
 * FileField — 파일(사진) 선택 칸. 네이티브 file input 은 스타일 불가라 DS 가 직접 소유해
 * 시각적으로 감춘 input + label 드롭존으로 감싼다(규칙7). label↔input 연결로 a11y 확보(규칙6).
 * 색·라운드·타이포는 semantic 토큰만(규칙1·2·3). 드롭존 자체가 터치 타깃(44px+, 규칙12).
 */
type FileFieldProps = {
  label: ReactNode
  onChange: (file: File | null) => void
  accept?: string
  disabled?: boolean
  /** 선택된 파일명(또는 처리 상태 텍스트). */
  fileName?: string | null
  placeholder?: string
  className?: string
  ref?: Ref<HTMLInputElement>
}

function FileField({
  accept,
  className,
  disabled,
  fileName,
  label,
  onChange,
  placeholder = "사진 선택",
  ref,
}: FileFieldProps) {
  const id = useId()
  const innerRef = useRef<HTMLInputElement | null>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.files?.[0] ?? null)
  }

  return (
    <div
      data-slot="file-field"
      className={cn("flex flex-col gap-1.5", className)}
    >
      <label
        htmlFor={id}
        className="text-caption font-strong text-text-secondary"
      >
        {label}
      </label>
      <label
        htmlFor={id}
        data-slot="file-field-dropzone"
        className={cn(
          "flex min-h-12 cursor-pointer items-center gap-3 rounded-control border border-dashed border-border-standard bg-surface-inset px-3.5 py-2.5 text-body transition-colors",
          "hover:border-border-strong hover:bg-surface-hover",
          "focus-within:border-border-brand focus-within:ring-2 focus-within:ring-ring-focus",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-control",
            fileName
              ? "bg-fill-brand/14 text-text-brand"
              : "bg-fill-neutral text-text-tertiary"
          )}
        >
          <Icon icon={Camera01Icon} size="md" />
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate font-emphasis",
            fileName ? "text-text-primary" : "text-text-tertiary"
          )}
        >
          {fileName ?? placeholder}
        </span>
        <input
          id={id}
          ref={(node) => {
            innerRef.current = node
            if (typeof ref === "function") ref(node)
            else if (ref) ref.current = node
          }}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only"
        />
      </label>
    </div>
  )
}

export { FileField }
export type { FileFieldProps }
