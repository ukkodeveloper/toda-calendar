import type { ElementType, ComponentPropsWithoutRef } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const textVariants = cva("min-w-0 text-pretty", {
  variants: {
    variant: {
      display: "text-[1.9rem] leading-10 font-semibold tracking-normal",
      title: "text-[1.18rem] leading-7 font-semibold tracking-normal",
      body: "text-[0.93rem] leading-6 font-normal tracking-normal",
      label: "text-[0.82rem] leading-5 font-semibold tracking-normal",
      caption: "text-[0.72rem] leading-4 font-medium tracking-normal",
    },
    tone: {
      primary: "text-foreground",
      secondary: "text-foreground/68",
      muted: "text-foreground/46",
      accent: "text-[var(--ds-accent)]",
      danger: "text-[var(--ds-danger)]",
      success: "text-[var(--ds-success)]",
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

type TextOwnProps<TElement extends ElementType> = {
  as?: TElement
} & VariantProps<typeof textVariants>

type TextProps<TElement extends ElementType> = TextOwnProps<TElement> &
  Omit<ComponentPropsWithoutRef<TElement>, keyof TextOwnProps<TElement>>

function Text<TElement extends ElementType = "p">({
  align,
  as,
  className,
  tone,
  variant,
  ...props
}: TextProps<TElement>) {
  const Component = as ?? "p"

  return (
    <Component
      className={cn(textVariants({ align, tone, variant, className }))}
      {...props}
    />
  )
}

export { Text, textVariants }
