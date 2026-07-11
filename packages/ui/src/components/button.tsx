"use client"

import { type Ref } from "react"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Button — 우리 축(emphasis+tone)으로 재정의한 핵심 CTA.
 * shadcn 잔재(default/secondary/destructive)를 걷어내고 Linear 정체성으로:
 *   primary = 인디고 --fill-brand + on-brand 텍스트 (핵심 CTA)
 *   neutral = 중립 채움 · outline = 보더 · ghost = 투명 (보조)
 *   danger  = Linear 무채 danger(인디고-accent 틴트) · link = 텍스트 링크
 * 색·라운드는 semantic 토큰 유틸리티만 참조(규칙1·2·3). Base UI 위(네이티브 button).
 * 모든 인터랙티브 size 는 터치 타깃 44px 이상(규칙12).
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control border border-transparent text-sm font-emphasis whitespace-nowrap transition-[background-color,border-color,color] outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-canvas active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none aria-busy:opacity-70 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-fill-brand text-text-on-brand hover:bg-fill-brand-hover",
        neutral:
          "bg-fill-neutral-strong text-text-primary hover:bg-surface-hover",
        outline:
          "border-border-standard text-text-primary hover:bg-fill-neutral aria-expanded:bg-fill-neutral",
        ghost:
          "text-text-secondary hover:bg-fill-neutral hover:text-text-primary aria-expanded:bg-fill-neutral aria-expanded:text-text-primary",
        danger: "bg-fill-danger/14 text-text-brand hover:bg-fill-danger/20",
        link: "text-text-brand underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-11 px-3 has-data-[icon=inline-end]:pe-2.5 has-data-[icon=inline-start]:ps-2.5",
        default:
          "h-11 px-4 has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3",
        lg: "h-12 px-5 text-base has-data-[icon=inline-end]:pe-4 has-data-[icon=inline-start]:ps-4",
        icon: "size-11",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** true 면 aria-busy 를 세팅하고 포인터/포커스를 막는다. */
    loading?: boolean
    /** React 19: ref 는 일반 prop. Base UI 가 렌더하는 요소(기본 button)로 전달. */
    ref?: Ref<HTMLButtonElement>
  }

/**
 * 링크를 버튼처럼 쓰려면 Radix Slot 이 아니라 Base UI 의 `render` prop 을 쓴다:
 *   <Button render={<Link href="/next" />}>다음</Button>
 * `render` 가 대상 요소를 대체하고 우리 className·data-slot·핸들러를 병합한다.
 * 이때 렌더 요소가 <button> 이 아니면 `nativeButton={false}` 도 함께 넘긴다.
 */
function Button({
  className,
  variant = "primary",
  size = "default",
  loading,
  disabled,
  type,
  ref,
  ...props
}: ButtonProps) {
  const isIconOnly = size === "icon" || size === "icon-lg"

  if (
    // eslint-disable-next-line turbo/no-undeclared-env-vars -- 번들러가 치환하는 dev 전용 가드
    process.env.NODE_ENV !== "production" &&
    isIconOnly &&
    !props["aria-label"] &&
    !props["aria-labelledby"]
  ) {
    console.warn(
      'Button: size="icon" 는 접근 가능한 이름이 없습니다. aria-label 을 넘기세요.'
    )
  }

  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      // Base UI 네이티브 button 은 폼 안에서 기본 type=submit → 명시적으로 button.
      // render 로 <a>/<Link> 를 넘긴 경우엔 type 을 붙이지 않는다.
      type={props.render ? type : (type ?? "button")}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
