"use client"

import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react"

import { SentIcon } from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"

import { Button } from "./button"
import { Icon } from "./icon"

/**
 * ChatComposer — 스트림 하단 입력 바. Base UI 필요 없는 순수 폼(네이티브 textarea)이라
 * DS 안에서 원시 요소를 직접 소유한다(규칙7: 앱은 raw 대신 이 컴포넌트를 쓴다).
 *
 * - 자동 증가 textarea(1줄→최대 5줄), Enter 전송·Shift+Enter 줄바꿈(모바일이 아닌 데스크톱 데모 대비).
 * - actions slot: 입력줄 왼쪽 보조 액션(공표·고발 등 아이콘 버튼).
 * - 전송 버튼은 Button size="icon"(brand 채움) — 값이 비었거나 disabled 면 잠근다.
 * 색·라운드·타이포는 semantic 토큰만(규칙1·2·3). 터치 타깃 44px(규칙12)는 Button 이 보장.
 */
type ChatComposerProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** 입력줄 왼쪽 보조 액션 slot. */
  actions?: ReactNode
  /** 전송 버튼 aria-label. */
  sendLabel?: string
  className?: string
  ref?: Ref<HTMLTextAreaElement>
}

const MAX_ROWS = 5

function ChatComposer({
  actions,
  className,
  disabled = false,
  onChange,
  onSubmit,
  placeholder = "메시지를 입력하세요",
  ref,
  sendLabel = "전송",
  value,
}: ChatComposerProps) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null)
  const canSend = value.trim().length > 0 && !disabled

  // 값이 바뀔 때마다 내용에 맞춰 높이 재계산(최대 MAX_ROWS 줄).
  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    el.style.height = "auto"
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20
    const max = lineHeight * MAX_ROWS
    el.style.height = `${Math.min(el.scrollHeight, max)}px`
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden"
  }, [value])

  function submit() {
    if (!canSend) return
    onSubmit(value)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div
      data-slot="chat-composer"
      className={cn(
        "flex items-end gap-2 border-t border-border-subtle bg-surface-canvas px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]",
        className
      )}
    >
      {actions ? (
        <div className="flex shrink-0 items-center gap-0.5 pb-0.5">
          {actions}
        </div>
      ) : null}

      <div className="flex min-h-11 min-w-0 flex-1 items-center rounded-panel bg-fill-neutral px-3.5 py-2">
        <textarea
          ref={(node) => {
            innerRef.current = node
            if (typeof ref === "function") ref(node)
            else if (ref) ref.current = node
          }}
          data-slot="chat-composer-input"
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className="max-h-40 min-w-0 flex-1 resize-none bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <Button
        size="icon"
        variant="primary"
        aria-label={sendLabel}
        disabled={!canSend}
        onClick={submit}
        className="shrink-0"
      >
        <Icon icon={SentIcon} />
      </Button>
    </div>
  )
}

export { ChatComposer }
export type { ChatComposerProps }
