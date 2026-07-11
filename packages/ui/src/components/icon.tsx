import { type ComponentPropsWithoutRef, type Ref } from "react"

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Icon — hugeicons 를 DS 로 감싼 단일 아이콘 표현. 앱은 raw <svg> 대신 이걸 쓴다(규칙7 정신).
 *
 * 규칙:
 *  - 크기는 토큰(size)만: sm=16 · md=20 · lg=24 (4px 그리드). 임의 px 금지(규칙2).
 *  - 색은 currentColor 상속 → 부모 text-* 토큰을 따른다. 직접 색 지정 안 함(규칙1·3).
 *  - 선 두께는 mono-line 1.5 고정(SETLOG/Linear 톤).
 *  - 기본은 장식(aria-hidden). 아이콘이 유일한 의미 전달자면 `label` 을 주면
 *    role="img" + aria-label 로 승격한다(규칙6).
 *
 * 사용:
 *   import { Add01Icon } from "@hugeicons/core-free-icons"
 *   <Icon icon={Add01Icon} />                 // 장식 (버튼이 라벨을 가짐)
 *   <Icon icon={Add01Icon} label="추가" />    // 단독 의미 전달
 */
const iconVariants = cva("inline-block shrink-0", {
  variants: {
    size: {
      sm: "size-4", // 16px
      md: "size-5", // 20px
      lg: "size-6", // 24px
    },
  },
  defaultVariants: {
    size: "md",
  },
})

/** hugeicons mono-line 기본 두께. 컴포넌트 전역에서 일관되게 고정한다. */
const ICON_STROKE_WIDTH = 1.5

type IconProps = Omit<
  ComponentPropsWithoutRef<"svg">,
  "color" | "ref" | "strokeWidth"
> &
  VariantProps<typeof iconVariants> & {
    /** hugeicons/core-free-icons 의 아이콘 데이터 (예: `Add01Icon`). */
    icon: IconSvgElement
    /** 의미 전달 아이콘의 접근 가능한 이름. 주면 role=img, 없으면 장식(aria-hidden). */
    label?: string
    /** React 19: ref 는 일반 prop. hugeicons 가 렌더하는 svg 로 전달. */
    ref?: Ref<SVGSVGElement>
  }

function Icon({ className, icon, label, size, ref, ...props }: IconProps) {
  return (
    <HugeiconsIcon
      ref={ref}
      data-slot="icon"
      icon={icon}
      color="currentColor"
      strokeWidth={ICON_STROKE_WIDTH}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn(iconVariants({ size }), className)}
      {...props}
    />
  )
}

export { Icon, iconVariants, ICON_STROKE_WIDTH }
export type { IconProps, IconSvgElement }
