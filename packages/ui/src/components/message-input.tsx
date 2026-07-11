import { type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * MessageInput — 메시지 입력줄의 시각 껍데기(플레이스홀더 표시용). 순수 표현.
 * 실제 입력이 필요하면 안에 Input 을 슬롯한다. 색·라운드·타이포는 semantic 토큰만(규칙1·2·3).
 */
const messageInputVariants = cva(
  "flex min-w-0 items-center gap-2 rounded-pill bg-fill-neutral px-3",
  {
    variants: {
      size: {
        sm: "min-h-9 text-caption",
        md: "min-h-11 text-body",
        lg: "min-h-12 text-body",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

type MessageInputProps = {
  leading?: ReactNode
  placeholder?: string
  trailing?: ReactNode
  ref?: Ref<HTMLDivElement>
} & ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof messageInputVariants>

function MessageInput({
  className,
  leading,
  placeholder = "메시지를 입력하세요",
  ref,
  size,
  trailing,
  ...props
}: MessageInputProps) {
  return (
    <div
      ref={ref}
      data-slot="message-input"
      className={cn(messageInputVariants({ size, className }))}
      {...props}
    >
      {leading ? (
        <div className="shrink-0 text-text-tertiary">{leading}</div>
      ) : null}
      <div className="min-w-0 flex-1 truncate font-emphasis text-text-tertiary">
        {placeholder}
      </div>
      {trailing ? (
        <div className="shrink-0 text-text-tertiary">{trailing}</div>
      ) : null}
    </div>
  )
}

export { MessageInput, messageInputVariants }
export type { MessageInputProps }
