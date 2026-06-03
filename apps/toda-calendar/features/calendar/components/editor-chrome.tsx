"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type EditorSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: string
  mode?: "peek" | "expanded"
}

export function EditorSurface({
  children,
  className,
  label,
  mode = "peek",
  ...props
}: EditorSurfaceProps) {
  const compact = mode === "expanded"

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-white/44 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_18px_32px_rgba(15,23,42,0.08)]",
        compact ? "rounded-[24px]" : "rounded-[28px]",
        className
      )}
      {...props}
    >
      {label ? (
        <EditorBadge className="pointer-events-none absolute top-3 left-3 z-[1]">
          {label}
        </EditorBadge>
      ) : null}

      {children}
    </div>
  )
}

type EditorBadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "muted"
}

export function EditorBadge({
  children,
  className,
  tone = "default",
  ...props
}: EditorBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-[-0.01em] backdrop-blur-[12px]",
        tone === "default"
          ? "bg-white/76 text-foreground/58"
          : "bg-white/68 text-foreground/40",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

type EditorActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "soft" | "accent"
}

function getEditorActionPillClassName(
  tone: "soft" | "accent",
  className?: string
) {
  return cn(
    "inline-flex h-9 items-center justify-center rounded-full px-3.5 text-center text-[11px] font-semibold leading-none tracking-[-0.01em]",
    tone === "accent"
      ? "bg-[linear-gradient(180deg,rgba(255,110,100,0.98)_0%,rgba(255,59,48,0.98)_100%)] text-white shadow-[0_12px_24px_rgba(255,59,48,0.24),inset_0_1px_0_rgba(255,255,255,0.32)]"
      : "bg-white/82 text-foreground/68 shadow-[0_10px_22px_rgba(15,23,42,0.1)] backdrop-blur-[14px]",
    className
  )
}

type EditorActionPillProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "soft" | "accent"
}

export function EditorActionPill({
  children,
  className,
  tone = "soft",
  ...props
}: EditorActionPillProps) {
  return (
    <div
      className={getEditorActionPillClassName(tone, className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function EditorActionButton({
  children,
  className,
  tone = "soft",
  type = "button",
  ...props
}: EditorActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        getEditorActionPillClassName(tone, className),
        "outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      )}
      {...props}
    >
      {children}
    </button>
  )
}
