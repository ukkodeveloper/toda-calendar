import { type ComponentPropsWithoutRef, type ElementType } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Text — polymorphic 타이포 프리미티브(`as`). 계층 타이포·색은 semantic 토큰만(규칙1·2·3).
 * variant 는 타입 계층 토큰(text-display/title/body/label/caption),
 * tone 은 텍스트 색 계층(text-primary/secondary/tertiary/brand …)에 매핑한다.
 */
const textVariants = cva("min-w-0 text-pretty", {
  variants: {
    variant: {
      display: "text-display font-emphasis",
      title: "text-title font-strong",
      body: "text-body font-read",
      label: "text-label font-strong",
      caption: "text-caption font-emphasis",
    },
    tone: {
      primary: "text-text-primary",
      secondary: "text-text-secondary",
      tertiary: "text-text-tertiary",
      quaternary: "text-text-quaternary",
      brand: "text-text-brand",
      danger: "text-fill-danger",
      success: "text-fill-success",
    },
    align: {
      start: "text-left",
      center: "text-center",
      end: "text-right",
    },
  },
  defaultVariants: {
    align: "start",
    tone: "primary",
    variant: "body",
  },
})

/** 하위호환 tone alias — 기존 소비처(muted/accent) 유지. */
type TextTone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "quaternary"
  | "brand"
  | "accent"
  | "muted"
  | "danger"
  | "success"

const toneAlias: Record<
  TextTone,
  NonNullable<VariantProps<typeof textVariants>["tone"]>
> = {
  primary: "primary",
  secondary: "secondary",
  tertiary: "tertiary",
  quaternary: "quaternary",
  brand: "brand",
  accent: "brand",
  muted: "tertiary",
  danger: "danger",
  success: "success",
}

type TextOwnProps<TElement extends ElementType> = {
  as?: TElement
  tone?: TextTone
} & Omit<VariantProps<typeof textVariants>, "tone">

type TextProps<TElement extends ElementType> = TextOwnProps<TElement> &
  Omit<ComponentPropsWithoutRef<TElement>, keyof TextOwnProps<TElement>>

// polymorphic 이라 ref 는 렌더 요소의 네이티브 ref 로 자연히 흘려보낸다(별도 타입 강제 X).
function Text<TElement extends ElementType = "p">({
  align,
  as,
  className,
  tone = "primary",
  variant,
  ...props
}: TextProps<TElement>) {
  const Component = as ?? "p"

  return (
    <Component
      className={cn(
        textVariants({ align, tone: toneAlias[tone], variant, className })
      )}
      {...props}
    />
  )
}

export { Text, textVariants }
export type { TextProps, TextTone }
