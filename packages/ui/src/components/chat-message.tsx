import { type ReactNode, type Ref } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { chatBubbleVariants, type ChatBubbleProps } from "./chat-bubble"

/**
 * ChatMessage — 스트림의 한 발화(아바타·이름·말풍선·시간)를 묶는 행. 순수 표현.
 *
 * ChatBubble 이 "말풍선 하나"라면 ChatMessage 는 "누가·언제" 문맥을 두른 한 줄이다.
 * 그룹핑(같은 사람 연속 발화에서 아바타/이름/시간 접기)은 소비처가 판단해 slot 으로 넘긴다:
 *   - incoming 첫 발화: avatar + name 노출
 *   - 그룹 중간: avatar 자리만 비워 정렬 유지(reserveAvatar), name·time 생략
 *   - 그룹 마지막: time 노출
 *
 * 색·라운드·타이포는 semantic 토큰만(규칙1·2·3). ChatBubble 의 side/size 축을 그대로 잇는다.
 */
type ChatMessageProps = {
  /** incoming = 상대(왼쪽·중립), outgoing = 나(오른쪽·brand). */
  side?: ChatBubbleProps["side"]
  size?: ChatBubbleProps["size"]
  /** 상대 아바타 slot. incoming 에서만 의미. */
  avatar?: ReactNode
  /** incoming 그룹 첫 발화의 발신자 이름. */
  name?: ReactNode
  /** 그룹 마지막 발화의 타임스탬프. */
  time?: ReactNode
  children: ReactNode
  className?: string
  ref?: Ref<HTMLDivElement>
}

function ChatMessage({
  avatar,
  children,
  className,
  name,
  ref,
  side = "incoming",
  size,
  time,
}: ChatMessageProps) {
  if (side === "outgoing") {
    // 나(outgoing): 버블은 오른쪽 정렬, 시간은 버블 "아래"에 우측 정렬로 건다.
    return (
      <div
        ref={ref}
        data-slot="chat-message"
        className={cn("flex flex-col items-end gap-1", className)}
      >
        <div
          data-slot="chat-bubble"
          className={cn(chatBubbleVariants({ side: "outgoing", size }))}
        >
          {children}
        </div>
        {time ? (
          <span className="px-1 text-label font-emphasis text-text-quaternary">
            {time}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      data-slot="chat-message"
      className={cn("flex items-end gap-2", className)}
    >
      <div className="w-9 shrink-0 self-end">{avatar}</div>
      <div className="flex min-w-0 flex-col items-start gap-1">
        {name ? (
          <span className="px-1 text-label font-strong text-text-tertiary">
            {name}
          </span>
        ) : null}
        <div className="flex items-end gap-1.5">
          <div
            data-slot="chat-bubble"
            className={cn(chatBubbleVariants({ side: "incoming", size }))}
          >
            {children}
          </div>
          {time ? (
            <span className="shrink-0 pb-1 text-label font-emphasis text-text-quaternary">
              {time}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export { ChatMessage }
export type { ChatMessageProps }
