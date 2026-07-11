import { type ComponentPropsWithoutRef, type Ref } from "react"

import { ColorAvatar } from "@workspace/ui/components/color-avatar"
import { cn } from "@workspace/ui/lib/utils"

/**
 * AvatarStack — 참여자를 겹친 ColorAvatar 오브로 요약하는 순수 표현 컴포넌트.
 *
 * 왜 별도인가: 단일 아바타(ColorAvatar)가 아니라 "N명 중 앞 몇" 을 압축해 보여주는
 * 리스트-요약 패턴이다. 방 목록 meta 자리에 들어간다. 관심사가 달라 조합으로 얹는다.
 *
 * 겹침: 두번째부터 음수 마진으로 물리고, 앞 원이 위(z)로 온다.
 * 각 원엔 표면색 링(`ring-surface-raised`)을 둘러 경계를 분리 — 스택은 카드(surface-raised)
 * 위에 놓이므로 링이 배경과 같아 원끼리만 떨어져 보인다. 색·라운드·간격은 토큰만(규칙1·2·3).
 *
 * 오버플로: 총원이 표시 개수보다 많으면 마지막에 중립 fill 원 `+{나머지}`. 숫자만(좁은 원).
 *
 * 순수 표현·비인터랙티브. 작은 사이즈라 오브 ambient 모션은 끈다(animated=false).
 */

type AvatarStackSize = "xs" | "sm"

interface AvatarStackItem {
  seed: string
  color?: string
}

/** ColorAvatar SIZE_PX(xs=28·sm=36)와 정합하는 박스 유틸(Avatar size-7/size-9). */
const SIZE_CLASS: Record<AvatarStackSize, string> = {
  xs: "size-7 text-label",
  sm: "size-9 text-label",
}

/** 겹침 폭 — 원 지름의 약 30%. 앞 원이 뒤 원을 덮는다. */
const OVERLAP_CLASS: Record<AvatarStackSize, string> = {
  xs: "-ml-2",
  sm: "-ml-2.5",
}

type AvatarStackProps = Omit<ComponentPropsWithoutRef<"div">, "color"> & {
  /** 표시할 아바타들. 앞에서 max 개까지 렌더. */
  items: AvatarStackItem[]
  /** 총 참여자 수(오버플로 계산). 없으면 items.length. */
  total?: number
  /** 표시 상한. 기본 3. */
  max?: number
  /** 아바타 크기. 기본 sm. */
  size?: AvatarStackSize
  /** React 19: ref 는 일반 prop. */
  ref?: Ref<HTMLDivElement>
}

function AvatarStack({
  className,
  items,
  max = 3,
  ref,
  size = "sm",
  total,
  ...props
}: AvatarStackProps) {
  const shown = items.slice(0, max)
  const totalCount = total ?? items.length
  const overflow = totalCount - shown.length
  // 앞 원이 위로: z 는 index 역순. 오버플로 원이 가장 아래.
  const topZ = shown.length + 1
  const ringClass = "relative rounded-pill ring-2 ring-surface-raised"

  return (
    <div
      ref={ref}
      data-slot="avatar-stack"
      role="group"
      aria-label={`참여자 ${totalCount}명`}
      className={cn("flex items-center", className)}
      {...props}
    >
      {shown.map((item, i) => (
        <ColorAvatar
          key={`${item.seed}-${i}`}
          seed={item.seed}
          color={item.color}
          size={size}
          animated={false}
          aria-hidden
          className={cn(ringClass, i > 0 && OVERLAP_CLASS[size])}
          style={{ zIndex: topZ - i }}
        />
      ))}
      {overflow > 0 ? (
        <span
          aria-hidden
          className={cn(
            "inline-grid place-items-center bg-fill-neutral font-strong text-text-secondary",
            SIZE_CLASS[size],
            ringClass,
            shown.length > 0 && OVERLAP_CLASS[size]
          )}
          style={{ zIndex: 0 }}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  )
}

export { AvatarStack }
export type { AvatarStackProps, AvatarStackItem, AvatarStackSize }
