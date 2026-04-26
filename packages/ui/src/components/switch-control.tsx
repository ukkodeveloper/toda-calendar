"use client"

import type { ComponentProps } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const switchVariants = cva(
  "inline-flex shrink-0 items-center rounded-full p-1 transition-[background-color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/45 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-8 w-13",
        md: "h-9 w-15",
        lg: "h-11 w-18",
      },
      checked: {
        true: "bg-[var(--ds-accent)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]",
        false: "bg-foreground/[0.12]",
      },
    },
    defaultVariants: {
      checked: false,
      size: "md",
    },
  }
)

const switchThumbVariants = cva(
  "rounded-full bg-white shadow-[0_3px_10px_rgba(15,23,42,0.18)] transition-transform",
  {
    variants: {
      size: {
        sm: "size-6",
        md: "size-7",
        lg: "size-9",
      },
      checked: {
        true: "",
        false: "translate-x-0",
      },
    },
    compoundVariants: [
      { checked: true, size: "sm", className: "translate-x-5" },
      { checked: true, size: "md", className: "translate-x-6" },
      { checked: true, size: "lg", className: "translate-x-7" },
    ],
    defaultVariants: {
      checked: false,
      size: "md",
    },
  }
)

type SwitchControlProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
} & Omit<ComponentProps<"button">, "children" | "onChange"> &
  VariantProps<typeof switchVariants>

function SwitchControl({
  checked,
  className,
  label,
  onCheckedChange,
  size,
  type = "button",
  ...props
}: SwitchControlProps) {
  return (
    <button
      type={type}
      aria-checked={checked}
      aria-label={label}
      className={cn(switchVariants({ checked, size, className }))}
      role="switch"
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(switchThumbVariants({ checked, size }))}
      />
    </button>
  )
}

export { SwitchControl, switchVariants }
