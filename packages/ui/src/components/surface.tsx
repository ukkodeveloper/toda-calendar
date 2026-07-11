import { type ComponentPropsWithoutRef, type Ref } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Surface — 깊이 있는 컨테이너(카드·패널·눌린 표면). 순수 표현.
 * 색·라운드·그림자는 semantic 토큰 유틸만(규칙1·2·3). 흰 보더·raw 그림자 제거,
 * Linear 정체성상 surface 는 luminance step(bg-surface-*) + subtle 보더로 깊이를 낸다.
 */
const surfaceVariants = cva(
  "rounded-hero border border-border-subtle text-text-primary",
  {
    variants: {
      variant: {
        floating: "bg-surface-raised shadow-elevation-3",
        inset: "bg-surface-inset shadow-elevation-1",
        panel: "bg-surface-panel shadow-elevation-2",
      },
      padding: {
        none: "",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "floating",
      padding: "md",
    },
  }
)

type SurfaceProps = ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof surfaceVariants> & {
    /** React 19: ref 는 일반 prop. */
    ref?: Ref<HTMLDivElement>
  }

function Surface({ className, padding, ref, variant, ...props }: SurfaceProps) {
  return (
    <div
      ref={ref}
      data-slot="surface"
      className={cn(surfaceVariants({ variant, padding, className }))}
      {...props}
    />
  )
}

export { Surface, surfaceVariants }
export type { SurfaceProps }
