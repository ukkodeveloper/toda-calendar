import type { ComponentProps, ReactNode } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const metricCardVariants = cva("rounded-[24px] bg-foreground/[0.055] text-left", {
  variants: {
    size: {
      sm: "min-h-18 p-4",
      md: "min-h-24 p-5",
      lg: "min-h-32 p-6",
    },
    tone: {
      neutral: "",
      accent: "bg-[var(--ds-accent)]/10",
      success: "bg-[var(--ds-success)]/10",
      danger: "bg-[var(--ds-danger)]/10",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "neutral",
  },
})

type MetricCardProps = {
  label: ReactNode
  value: ReactNode
  description?: ReactNode
} & ComponentProps<"div"> &
  VariantProps<typeof metricCardVariants>

function MetricCard({
  className,
  description,
  label,
  size,
  tone,
  value,
  ...props
}: MetricCardProps) {
  return (
    <div className={cn(metricCardVariants({ size, tone, className }))} {...props}>
      <p className="text-[0.78rem] font-semibold leading-5 text-foreground/58">
        {label}
      </p>
      <p className="mt-1 truncate text-[1.32rem] font-semibold leading-8 text-foreground">
        {value}
      </p>
      {description ? (
        <p className="mt-1 text-[0.78rem] font-medium leading-5 text-foreground/48">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export { MetricCard, metricCardVariants }
