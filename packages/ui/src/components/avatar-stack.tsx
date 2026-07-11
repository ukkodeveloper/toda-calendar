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
 * 각 원엔 표면색 링을 둘러 경계를 분리 — 링이 뒤 배경과 같아야 원끼리만 떨어져 보인다.
 * 기본 `ring-surface-raised`(카드 위 가정). 다른 surface·호버 상태 위에 놓이면
 * `separatorClassName` 으로 링 색을 그 배경에 맞춰 넘긴다(예: `group-hover:ring-surface-hover`).
 * 색·라운드·간격은 토큰만(규칙1·2·3).
 *
 * 오버플로: 총원이 표시 개수보다 많으면 마지막에 중립 fill 원 `+{나머지}`. 숫자만(좁은 원).
 *
 * 순수 표현·비인터랙티브. 작은 사이즈라 오브 ambient 모션은 끈다(animated=false).
 */

type AvatarStackSize = "xxs" | "xs" | "sm"

interface AvatarStackItem {
  seed: string
  color?: string
}

/**
 * 스택 전용 컴팩트 스케일. 리스트 보조 메타 자리엔 아바타가 작아야 해서
 * Avatar/ColorAvatar 스케일(xs=28 최소)보다 한 단(xxs=24) 아래를 연다.
 * xxs 는 이 요약 패턴에만 필요해 여기서 소유한다 — ColorAvatar 엔 이 px 를 숫자로 넘긴다
 * (ColorAvatar `size: number` 경로). 값은 4px 그리드·Tailwind size-* 와 정합(매직값 아님).
 */
const AVATAR_PX: Record<AvatarStackSize, number> = {
  xxs: 24,
  xs: 28,
  sm: 36,
}

/** 오버플로 `+N` 원의 박스·타이포. AVATAR_PX 와 같은 지름(size-6/7/9). */
const SIZE_CLASS: Record<AvatarStackSize, string> = {
  xxs: "size-6 text-label",
  xs: "size-7 text-label",
  sm: "size-9 text-label",
}

/** 겹침 폭 — 원 지름의 약 절반. 앞 원이 뒤 원을 절반 덮어 다닥다닥 물린다. */
const OVERLAP_CLASS: Record<AvatarStackSize, string> = {
  xxs: "-ml-3", // 12/24 = 50%
  xs: "-ml-3.5", // 14/28 = 50%
  sm: "-ml-4", // 16/36 ≈ 44%
}

/**
 * 오버플로 `+N` 원의 겹침 + 라벨 패딩. 카운터는 z 최하라 왼쪽이 앞 원에 덮인다.
 * 겹침을 아바타보다 얕게 두고(노출 폭 확보), 같은 값의 left-padding 으로 `+N` 을
 * 노출 영역 정중앙에 앉혀 "+" 까지 온전히 보이게 한다(border-box: pad = 겹침 → 중심 +겹침/2 이동).
 */
const OVERFLOW_CLASS: Record<AvatarStackSize, string> = {
  xxs: "-ml-2 pl-2", // 겹침 8/24 ≈ 33%, 노출 16px
  xs: "-ml-2.5 pl-2.5", // 겹침 10/28 ≈ 36%, 노출 18px
  sm: "-ml-3 pl-3", // 겹침 12/36 ≈ 33%, 노출 24px
}

type AvatarStackProps = Omit<ComponentPropsWithoutRef<"div">, "color"> & {
  /** 표시할 아바타들. 앞에서 max 개까지 렌더. */
  items: AvatarStackItem[]
  /** 총 참여자 수(오버플로 계산). 없으면 items.length. */
  total?: number
  /** 표시 상한. 기본 3. */
  max?: number
  /** 아바타 크기. 기본 xxs(리스트 보조 메타). */
  size?: AvatarStackSize
  /**
   * 분리 링 색 유틸. 뒤 배경과 같은 surface 를 넘긴다. 기본 `ring-surface-raised`.
   * 호버 등 배경이 바뀌는 컨텍스트에선 `group-hover:ring-*` 를 함께 넘겨 동기화.
   */
  separatorClassName?: string
  /** React 19: ref 는 일반 prop. */
  ref?: Ref<HTMLDivElement>
}

function AvatarStack({
  className,
  items,
  max = 3,
  ref,
  separatorClassName = "ring-surface-raised",
  size = "xxs",
  total,
  ...props
}: AvatarStackProps) {
  const shown = items.slice(0, max)
  const totalCount = total ?? items.length
  const overflow = totalCount - shown.length
  // 앞 원이 위로: z 는 index 역순. 오버플로 원이 가장 아래.
  const topZ = shown.length + 1
  const ringClass = cn("relative rounded-pill ring-2", separatorClassName)

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
          size={AVATAR_PX[size]}
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
            shown.length > 0 && OVERFLOW_CLASS[size]
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
