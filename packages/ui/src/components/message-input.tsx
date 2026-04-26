import type { ComponentProps, ReactNode } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const messageInputVariants = cva(
  "flex min-w-0 items-center gap-2 rounded-full bg-foreground/[0.055] px-3",
  {
    variants: {
      size: {
        sm: "min-h-9 text-[0.8rem]",
        md: "min-h-11 text-[0.88rem]",
        lg: "min-h-12 text-[0.96rem]",
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
} & ComponentProps<"div"> &
  VariantProps<typeof messageInputVariants>

function MessageInput({
  className,
  leading,
  placeholder = "메시지를 입력하세요",
  size,
  trailing,
  ...props
}: MessageInputProps) {
  return (
    <div className={cn(messageInputVariants({ size, className }))} {...props}>
      {leading ? <div className="shrink-0 text-foreground/42">{leading}</div> : null}
      <div className="min-w-0 flex-1 truncate font-semibold text-foreground/32">
        {placeholder}
      </div>
      {trailing ? <div className="shrink-0 text-foreground/42">{trailing}</div> : null}
    </div>
  )
}

export { MessageInput, messageInputVariants }
