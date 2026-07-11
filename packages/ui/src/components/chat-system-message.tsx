import { type ReactNode, type Ref } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * ChatSystemMessage — 스트림 가운데 놓이는 비발화 안내. 순수 표현.
 *   divider = 좌우 hairline 사이 라벨(날짜·구간 구분: "오늘", "재판 시작")
 *   default = 가운데 중립 칩(시스템 공지: "최후진술이 종료되었습니다")
 * 색·라운드·타이포는 semantic 토큰만(규칙1·2·3).
 */
const chatSystemMessageVariants = cva(
  "flex items-center justify-center gap-3 px-4",
  {
    variants: {
      variant: {
        divider: "my-3",
        default: "my-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type ChatSystemMessageProps = {
  children: ReactNode
  className?: string
  ref?: Ref<HTMLDivElement>
} & VariantProps<typeof chatSystemMessageVariants>

function ChatSystemMessage({
  children,
  className,
  ref,
  variant = "default",
}: ChatSystemMessageProps) {
  return (
    <div
      ref={ref}
      data-slot="chat-system-message"
      role="separator"
      className={cn(chatSystemMessageVariants({ variant, className }))}
    >
      {variant === "divider" ? (
        <span className="h-px flex-1 bg-border-subtle" />
      ) : null}
      <span
        className={cn(
          "text-center text-label font-strong text-text-tertiary",
          variant === "default" &&
            "rounded-pill bg-fill-neutral px-3 py-1 text-caption font-emphasis text-text-secondary"
        )}
      >
        {children}
      </span>
      {variant === "divider" ? (
        <span className="h-px flex-1 bg-border-subtle" />
      ) : null}
    </div>
  )
}

export { ChatSystemMessage, chatSystemMessageVariants }
export type { ChatSystemMessageProps }
