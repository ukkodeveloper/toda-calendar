import { type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * ChatBubble — 채팅 말풍선. 순수 표현.
 * incoming = 중립 표면, outgoing = 옅은 브랜드 서피스(fill-brand-weak) + 어두운 텍스트.
 * outgoing 은 밝은 brand fill 대신 옅은 초록으로, 어두운 글자 대비를 높여 가독성 확보(WCAG AA).
 * 색·라운드·타이포는 semantic 토큰만(규칙1·2·3).
 */
const chatBubbleVariants = cva("max-w-[78%] rounded-panel font-emphasis", {
  variants: {
    side: {
      incoming: "rounded-bl-micro bg-fill-neutral text-text-primary",
      outgoing: "ml-auto rounded-br-micro bg-fill-brand-weak text-text-primary",
    },
    size: {
      sm: "px-3 py-2 text-caption",
      md: "px-4 py-2.5 text-body",
      lg: "px-4 py-3 text-body",
    },
  },
  defaultVariants: {
    side: "incoming",
    size: "md",
  },
})

type ChatBubbleProps = {
  meta?: ReactNode
  ref?: Ref<HTMLDivElement>
} & ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof chatBubbleVariants>

function ChatBubble({
  children,
  className,
  meta,
  ref,
  side = "incoming",
  size,
  ...props
}: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex items-end gap-2",
        side === "outgoing" ? "justify-end" : "justify-start"
      )}
    >
      <div
        ref={ref}
        data-slot="chat-bubble"
        className={cn(chatBubbleVariants({ side, size, className }))}
        {...props}
      >
        {children}
      </div>
      {meta ? (
        <span className="pb-1 text-label font-emphasis text-text-quaternary">
          {meta}
        </span>
      ) : null}
    </div>
  )
}

export { ChatBubble, chatBubbleVariants }
export type { ChatBubbleProps }
