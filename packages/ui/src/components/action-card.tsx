"use client"

import { type ReactNode, type Ref } from "react"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * ActionCard — 탭하면 다음 화면/시트를 여는 카드형 어포던스(리스트 행보다 강조).
 * Base UI Button(headless) 위라 포커스·키보드·네이티브 button 이 보장된다(규칙5·7).
 * leading 아이콘칩 · title · subtitle · trailing(기본 chevron slot). 색·라운드는 semantic 토큰만.
 * tone 은 leading 칩의 색조(neutral/brand/danger). 카드 자체는 raised 표면 + subtle 보더.
 */
const actionCardVariants = cva(
  "group/action-card flex w-full items-center gap-3 rounded-panel border border-border-subtle bg-surface-raised px-3.5 py-3 text-left shadow-elevation-1 transition-[background-color,box-shadow,transform] outline-none hover:bg-surface-hover hover:shadow-elevation-2 focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface-canvas active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      density: {
        regular: "min-h-16",
        compact: "min-h-14 py-2.5",
      },
    },
    defaultVariants: {
      density: "regular",
    },
  }
)

const actionCardLeadingVariants = cva(
  "flex size-11 shrink-0 items-center justify-center rounded-card [&_svg]:size-5",
  {
    variants: {
      tone: {
        neutral: "bg-fill-neutral text-text-secondary",
        brand: "bg-fill-brand/14 text-text-brand",
        danger: "bg-fill-danger/14 text-fill-danger",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

type ActionCardProps = ButtonPrimitive.Props &
  VariantProps<typeof actionCardVariants> & {
    leading?: ReactNode
    leadingTone?: VariantProps<typeof actionCardLeadingVariants>["tone"]
    title: ReactNode
    subtitle?: ReactNode
    /** 우측 slot. 기본은 소비처가 chevron 아이콘을 넘긴다. */
    trailing?: ReactNode
    ref?: Ref<HTMLButtonElement>
  }

function ActionCard({
  className,
  density,
  leading,
  leadingTone,
  ref,
  subtitle,
  title,
  trailing,
  type,
  ...props
}: ActionCardProps) {
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="action-card"
      type={props.render ? type : (type ?? "button")}
      className={cn(actionCardVariants({ density, className }))}
      {...props}
    >
      {leading ? (
        <span className={cn(actionCardLeadingVariants({ tone: leadingTone }))}>
          {leading}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body font-strong text-text-primary">
          {title}
        </span>
        {subtitle ? (
          <span className="truncate text-caption font-emphasis text-text-tertiary">
            {subtitle}
          </span>
        ) : null}
      </span>
      {trailing ? (
        <span className="flex shrink-0 items-center text-text-tertiary transition-transform group-hover/action-card:translate-x-0.5">
          {trailing}
        </span>
      ) : null}
    </ButtonPrimitive>
  )
}

export { ActionCard, actionCardVariants }
export type { ActionCardProps }
