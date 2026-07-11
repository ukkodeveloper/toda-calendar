import { type ComponentPropsWithoutRef, type Ref } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * UnreadDot — "안 읽은 새 메시지 있음" 을 나타내는 최소 신호 점.
 *
 * 왜 Badge 가 아니라 별도 프리미티브인가: Badge 는 텍스트 라벨(min-h·padding·pill)이다.
 * 여기 필요한 건 개수가 아니라 유무(boolean)뿐 — 텍스트 없는 순수 점이라 모양이 다르다.
 * 그래서 Badge 재사용 대신 작은 프리미티브를 둔다(토스 Minimum Features: 형태가 맞을 때만 신설).
 *
 * 색은 brand fill semantic 토큰만(규칙1·3), 지름은 토큰 스케일(size-1.5/2 = 6/8px, 규칙2).
 * 순수 표현·비인터랙티브(터치 타깃 44px 예외 — 신호일 뿐 조작 대상 아님).
 *
 * 접근성(규칙6): 점만 있으면 SR 이 못 읽으니 sr-only 텍스트를 동봉한다. 리스트에서 한꺼번에
 * 렌더되므로 live-region(role="status")은 쓰지 않는다 — 초기 렌더 과다 announce 를 피한다.
 * 라벨은 리스트 행 문맥에 자연스레 읽힌다(예: "안 읽은 메시지 3분 전").
 *
 * 렌더는 유무(hasUnread) 조건을 소비처가 판단해 감싼다: `{hasUnread ? <UnreadDot /> : null}`.
 */
const unreadDotVariants = cva("inline-block shrink-0 rounded-pill", {
  variants: {
    tone: {
      brand: "bg-fill-brand",
      danger: "bg-fill-danger",
    },
    size: {
      sm: "size-1.5", // 6px — 텍스트 옆 보조 신호
      md: "size-2", // 8px — 단독/leading 신호
    },
  },
  defaultVariants: {
    tone: "brand",
    size: "md",
  },
})

type UnreadDotProps = Omit<ComponentPropsWithoutRef<"span">, "color"> &
  VariantProps<typeof unreadDotVariants> & {
    /** SR 이 읽을 라벨. 기본 "안 읽은 메시지". */
    label?: string
    /** React 19: ref 는 일반 prop. */
    ref?: Ref<HTMLSpanElement>
  }

function UnreadDot({
  className,
  label = "안 읽은 메시지",
  size,
  tone,
  ref,
  ...props
}: UnreadDotProps) {
  return (
    <span
      ref={ref}
      data-slot="unread-dot"
      className={cn(unreadDotVariants({ size, tone, className }))}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </span>
  )
}

export { UnreadDot, unreadDotVariants }
export type { UnreadDotProps }
