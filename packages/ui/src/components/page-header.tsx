import { type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

/**
 * PageHeader — 화면 상단 헤더의 단일 구현. leading/title/meta/subtitle/trailing + size.
 * AppBar 는 이 컴포넌트의 얇은 alias(하위호환). 색·타이포는 semantic 토큰만(규칙1·2·3).
 * 순수 표현(레이아웃) — 인터랙션·터치 타깃은 슬롯한 요소(Button 등)가 책임진다.
 */
const pageHeaderVariants = cva("flex shrink-0 gap-3", {
  variants: {
    align: {
      start: "items-start",
      center: "items-center",
    },
    size: {
      compact: "min-h-14 px-5 py-2",
      regular: "min-h-16 px-5 py-3",
      large: "min-h-18 px-5 pt-5 pb-2.5",
    },
  },
  defaultVariants: {
    align: "start",
    size: "regular",
  },
})

const pageHeaderTitleVariants = cva(
  "min-w-0 shrink-0 font-strong text-text-primary",
  {
    variants: {
      size: {
        compact: "text-body",
        regular: "text-title",
        large: "text-display",
      },
    },
    defaultVariants: {
      size: "regular",
    },
  }
)

const pageHeaderMetaVariants = cva("min-w-0 font-strong text-text-tertiary", {
  variants: {
    size: {
      compact: "text-caption",
      regular: "text-caption",
      large: "text-body",
    },
  },
  defaultVariants: {
    size: "regular",
  },
})

type PageHeaderProps = {
  leading?: ReactNode
  meta?: ReactNode
  subtitle?: ReactNode
  title: ReactNode
  trailing?: ReactNode
  ref?: Ref<HTMLElement>
} & Omit<ComponentPropsWithoutRef<"header">, "title"> &
  VariantProps<typeof pageHeaderVariants>

function PageHeader({
  align,
  className,
  leading,
  meta,
  ref,
  size = "regular",
  subtitle,
  title,
  trailing,
  ...props
}: PageHeaderProps) {
  const centered = align === "center" && leading && trailing

  return (
    <header
      ref={ref}
      data-slot="page-header"
      className={cn(pageHeaderVariants({ align, size, className }))}
      {...props}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className={cn("min-w-0 flex-1", centered && "text-center")}>
        <div
          className={cn(
            "flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5",
            centered && "justify-center"
          )}
        >
          <h1 className={cn(pageHeaderTitleVariants({ size }))}>{title}</h1>
          {meta ? (
            <div className={cn(pageHeaderMetaVariants({ size }))}>{meta}</div>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-1 truncate text-caption font-emphasis text-text-tertiary">
            {subtitle}
          </p>
        ) : null}
      </div>
      {trailing ? (
        <div className="flex shrink-0 items-center gap-1.5">{trailing}</div>
      ) : null}
    </header>
  )
}

export {
  PageHeader,
  pageHeaderMetaVariants,
  pageHeaderTitleVariants,
  pageHeaderVariants,
}
export type { PageHeaderProps }
