"use client"

import { type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * IconButton — 원형(pill) 아이콘-only 어포던스. 역할 경계:
 *   Button size="icon"  = 사각 라운드(rounded-control) CTA 계열의 아이콘 버튼.
 *   IconButton          = 원형(rounded-pill) chrome 버튼(툴바·헤더·오버레이 위 floating).
 * 둘 다 Base UI Button(headless) 위. 색·라운드·그림자는 semantic 토큰만(규칙1·2·3).
 * 모든 size 44px 이상(규칙12). 아이콘-only 라 aria-label 필수(규칙6).
 *
 * variant:
 *   neutral = 중립 채움 (툴바 안쪽)
 *   ghost   = 투명 (리스트 행 trailing 등 저강조)
 *   surface = 흰/raised 표면 원 + 미세 보더·그림자 (헤더 위 떠 있는 chrome — SETLOG 룩)
 *   glass   = 반투명 프로스티드 (콘텐츠 위 floating — backdrop-blur)
 */
const iconButtonVariants = cva(
  "group/icon-button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-pill border border-transparent text-text-secondary transition-[background-color,border-color,color] outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-canvas active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        neutral:
          "bg-fill-neutral text-text-primary hover:bg-surface-hover aria-expanded:bg-surface-hover",
        ghost:
          "text-text-secondary hover:bg-fill-neutral hover:text-text-primary aria-expanded:bg-fill-neutral aria-expanded:text-text-primary",
        surface:
          "border-border-subtle bg-surface-raised text-text-primary shadow-elevation-2 hover:bg-surface-hover active:brightness-95 aria-expanded:bg-surface-hover",
        glass:
          "border-border-subtle bg-surface-glass text-text-primary shadow-elevation-2 backdrop-blur-xl hover:bg-surface-hover",
      },
      size: {
        sm: "size-11",
        md: "size-11",
        lg: "size-12",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "neutral",
    },
  }
)

type IconButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof iconButtonVariants> & {
    /** 아이콘-only 라 접근 가능한 이름은 필수. */
    "aria-label": string
    /** React 19: ref 는 일반 prop. Base UI 가 렌더하는 요소로 전달. */
    ref?: Ref<HTMLButtonElement>
  }

function IconButton({
  className,
  size,
  type,
  variant,
  ref,
  ...props
}: IconButtonProps) {
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="icon-button"
      type={props.render ? type : (type ?? "button")}
      className={cn(iconButtonVariants({ size, variant, className }))}
      {...props}
    />
  )
}

/**
 * IconButtonBadge — IconButton 우상단에 얹는 카운트/알림 칩. (벨 위 "1" 패턴)
 * 비인터랙티브 오버레이라 터치 타깃 예외. 색은 danger 의미색 토큰만.
 * ring-surface-canvas 로 버튼과 시각적으로 분리한다.
 *
 * 사용 — IconButton 을 relative wrapper 로 감싸 형제로 둔다:
 *   <span className="relative inline-flex">
 *     <IconButton aria-label="알림"><Icon icon={Notification03Icon} /></IconButton>
 *     <IconButtonBadge count={1} />
 *   </span>
 * count 를 안 주면 점(dot)만 표시한다.
 */
type IconButtonBadgeProps = ComponentPropsWithoutRef<"span"> & {
  /** 표시할 숫자. 없으면 dot 만. 99 초과는 `99+`. */
  count?: number
  ref?: Ref<HTMLSpanElement>
}

function IconButtonBadge({
  className,
  count,
  ref,
  ...props
}: IconButtonBadgeProps) {
  const isDot = count == null
  const label: ReactNode = isDot ? null : count > 99 ? "99+" : count

  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-slot="icon-button-badge"
      className={cn(
        "pointer-events-none absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-pill bg-fill-danger font-strong text-text-on-fill ring-2 ring-surface-canvas",
        isDot ? "size-2.5" : "min-h-4 min-w-4 px-1 text-label leading-none",
        className
      )}
      {...props}
    >
      {label}
    </span>
  )
}

export { IconButton, iconButtonVariants, IconButtonBadge }
export type { IconButtonProps, IconButtonBadgeProps }
