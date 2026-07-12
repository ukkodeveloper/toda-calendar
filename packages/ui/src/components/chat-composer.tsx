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
 *
 * 키보드 유지(버그 A): 전송·액션 버튼을 탭하면 네이티브 포커스가 textarea 에서 버튼으로
 * 넘어가 blur → iOS 소프트 키보드가 닫힌다. 카톡·라인·인스타가 다 쓰는 표준 해법대로,
 * 입력바 안의 버튼은 `pointerdown` 에서 `preventDefault()` 해 포커스가 textarea 에 남게
 * 한다 → 키보드가 유지되고 연속 전송이 된다. click 은 그대로 발화하므로 전송 로직·
 * 데스크톱 클릭·disabled(pointer-events-none) 는 영향 없다. Enter 전송도 그대로.
 */

/**
 * 입력바 버튼이 textarea 포커스를 뺏지 않게 하는 가드. pointerdown 의 기본 동작(포커스
 * 이동)만 막고 click 은 살린다 → 키보드 유지 + 전송/액션은 정상 동작.
 * disabled 버튼은 애초에 pointer-events-none 이라 여기 안 온다.
 */
function keepFocusOnPointerDown(event: { preventDefault: () => void }) {
  event.preventDefault()
}
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
        "flex items-end gap-2 border-t border-border-subtle bg-surface-canvas px-3 pt-2 pb-safe",
        className
      )}
    >
      {actions ? (
        // 액션 슬롯 전체에 pointerdown 가드 — 슬롯 안 아이콘 버튼(공표·고발 등)도
        // textarea 포커스를 뺏지 않게 한다. 이벤트는 버블링하므로 컨테이너 한 곳이면 충분.
        <div
          className="flex shrink-0 items-center gap-0.5 pb-0.5"
          onPointerDown={keepFocusOnPointerDown}
        >
          {actions}
        </div>
      ) : null}

      <div className="flex min-h-10 min-w-0 flex-1 items-center rounded-panel bg-fill-neutral px-3.5 py-1.5">
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
          className="max-h-40 min-w-0 flex-1 resize-none bg-transparent text-input text-text-primary outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <Button
        size="icon"
        variant="primary"
        aria-label={sendLabel}
        disabled={!canSend}
        onPointerDown={keepFocusOnPointerDown}
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
