import type { ComponentProps, ReactNode } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const chatBubbleVariants = cva(
  "max-w-[78%] rounded-[22px] px-4 py-2.5 text-[0.93rem] font-medium leading-6",
  {
    variants: {
      side: {
        incoming: "rounded-bl-[8px] bg-foreground/[0.06] text-foreground",
        outgoing:
          "ml-auto rounded-br-[8px] bg-[var(--ds-accent)] text-white",
      },
      size: {
        sm: "px-3 py-2 text-[0.82rem] leading-5",
        md: "px-4 py-2.5 text-[0.93rem] leading-6",
        lg: "px-4 py-3 text-[1rem] leading-6",
      },
    },
    defaultVariants: {
      side: "incoming",
      size: "md",
    },
  }
)

type ChatBubbleProps = {
  meta?: ReactNode
} & ComponentProps<"div"> &
  VariantProps<typeof chatBubbleVariants>

function ChatBubble({
  children,
  className,
  meta,
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
      <div className={cn(chatBubbleVariants({ side, size, className }))} {...props}>
        {children}
      </div>
      {meta ? (
        <span className="pb-1 text-[0.72rem] font-medium text-foreground/36">
          {meta}
        </span>
      ) : null}
    </div>
  )
}

export { ChatBubble, chatBubbleVariants }
