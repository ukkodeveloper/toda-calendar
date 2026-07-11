import { type ComponentPropsWithoutRef, type Ref } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Avatar — 이니셜·이미지 컨테이너. 순수 표현(터치 타깃 44px 예외).
 * tone 은 상태 색이 아니라 이니셜 배경 색조. 색·라운드는 semantic 토큰 유틸만(규칙1·2·3).
 * 상태 tone 은 fill 위 14% 틴트 = opacity step 만(매직 알파 아님).
 */
const avatarVariants = cva(
  "inline-grid shrink-0 place-items-center overflow-hidden bg-fill-neutral font-strong text-text-tertiary",
  {
    variants: {
      size: {
        xs: "size-7 text-label",
        sm: "size-9 text-label",
        md: "size-12 text-caption",
        lg: "size-16 text-body",
        xl: "size-20 text-body",
      },
      shape: {
        circle: "rounded-pill",
        rounded: "rounded-card",
        squircle: "rounded-hero",
      },
      tone: {
        neutral: "bg-fill-neutral text-text-tertiary",
        brand: "bg-fill-brand/14 text-text-brand",
        success: "bg-fill-success/14 text-fill-success",
        danger: "bg-fill-danger/14 text-fill-danger",
      },
    },
    defaultVariants: {
      shape: "circle",
      size: "md",
      tone: "neutral",
    },
  }
)

/** `tone="accent"` 는 `brand` 의 하위호환 alias (기존 소비처 유지). */
type AvatarTone = "neutral" | "brand" | "accent" | "success" | "danger"

type AvatarProps = Omit<ComponentPropsWithoutRef<"span">, "color"> &
  Omit<VariantProps<typeof avatarVariants>, "tone"> & {
    tone?: AvatarTone
    /** React 19: ref 는 일반 prop. */
    ref?: Ref<HTMLSpanElement>
  }

function Avatar({
  className,
  ref,
  shape,
  size,
  tone = "neutral",
  ...props
}: AvatarProps) {
  const resolvedTone = tone === "accent" ? "brand" : tone
  return (
    <span
      ref={ref}
      data-slot="avatar"
      aria-hidden={props.children ? undefined : true}
      className={cn(
        avatarVariants({ shape, size, tone: resolvedTone, className })
      )}
      {...props}
    />
  )
}

export { Avatar, avatarVariants }
export type { AvatarProps, AvatarTone }
