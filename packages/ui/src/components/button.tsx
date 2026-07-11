import { forwardRef } from "react"

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
  }

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "default",
    loading,
    disabled,
    ...props
  },
  ref
) {
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})

export { Button, buttonVariants }
export type { ButtonProps }
