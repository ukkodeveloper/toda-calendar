"use client"

import { type ReactNode, type Ref } from "react"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Button — 우리 축(emphasis+tone)으로 재정의한 핵심 CTA.
 *   primary = Spotify green --fill-brand + 검정 on-brand 텍스트 (핵심 CTA)
 *   neutral = 중립 채움 · outline = 보더 · ghost = 투명 (보조)
 *   danger  = 빨강 danger 틴트 + 빨강 텍스트 (의미색) · link = 텍스트 링크
 * 색·라운드는 semantic 토큰 유틸리티만 참조(규칙1·2·3). Base UI 위(네이티브 button).
 * 모든 인터랙티브 size 는 터치 타깃 44px 이상(규칙12).
 *
 * 아이콘 슬롯: 자식 svg 에 data-icon="inline-start|inline-end" 를 달면
 * 해당 방향 패딩이 좁혀져 아이콘·라벨 밸런스가 잡힌다.
 * 로딩: loading 이면 스피너가 leading 아이콘 자리를 대체하고 포인터/포커스를 막는다.
 */
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-pill border border-transparent text-sm font-strong whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface-canvas active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-fill-brand text-text-on-brand hover:bg-fill-brand-hover active:brightness-95",
        neutral:
          "bg-fill-neutral-strong text-text-primary hover:bg-surface-hover active:brightness-95",
        outline:
          "border-border-standard text-text-primary hover:border-border-strong hover:bg-fill-neutral active:bg-fill-neutral-strong aria-expanded:bg-fill-neutral",
        ghost:
          "text-text-secondary hover:bg-fill-neutral hover:text-text-primary active:bg-fill-neutral-strong aria-expanded:bg-fill-neutral aria-expanded:text-text-primary",
        danger:
          "bg-fill-danger/14 text-fill-danger hover:bg-fill-danger/20 active:bg-fill-danger/24",
        link: "text-text-brand underline-offset-4 hover:underline focus-visible:ring-offset-0 active:opacity-80",
      },
      size: {
        sm: "h-11 gap-1 px-3 text-sm has-data-[icon=inline-end]:pe-2.5 has-data-[icon=inline-start]:ps-2.5",
        default:
          "h-11 px-4 has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3",
        lg: "h-12 gap-2 px-5 text-base has-data-[icon=inline-end]:pe-4 has-data-[icon=inline-start]:ps-4",
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

/**
 * Spinner — 로딩 표시. currentColor 를 상속해 각 variant 의 텍스트색을 따른다.
 * 로딩 스피너는 상태를 전달하는 기능 요소라 reduce-motion 에서도 유지한다(규칙11 예외).
 * motion-reduce 에선 회전을 느리게 해 자극을 줄인다.
 */
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn(
        "size-4 animate-spin motion-reduce:[animation-duration:1.6s]",
        className
      )}
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** true 면 스피너를 렌더하고 aria-busy 를 세팅, 포인터/포커스를 막는다. */
    loading?: boolean
    /** 로딩 중 스피너 옆에 보일 라벨. 없으면 기존 children 을 유지한다. */
    loadingText?: ReactNode
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
  loading = false,
  loadingText,
  disabled,
  type,
  ref,
  children,
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

  // 로딩: icon-only 는 스피너만, 그 외엔 스피너(leading) + 라벨(loadingText ?? children).
  // 스피너에 data-icon="inline-start" 를 달아 leading 아이콘과 같은 패딩 밸런스를 쓴다.
  const content = loading ? (
    isIconOnly ? (
      <Spinner />
    ) : (
      <>
        <Spinner data-icon="inline-start" />
        {loadingText ?? children}
      </>
    )
  ) : (
    children
  )

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
    >
      {content}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
