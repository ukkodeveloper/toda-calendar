"use client"

import type { ReactNode } from "react"

import { Theme } from "@astryxdesign/core/theme"

import { the_court_themeTheme } from "@/the-court-theme"

/**
 * Astryx theme provider (the_court_theme).
 * Unbuilt defineTheme() → Theme injects the token <style> at runtime,
 * so no `astryx theme build` CLI step is needed.
 * Flip `mode` (and <html data-theme> in layout) to switch light/dark.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <Theme theme={the_court_themeTheme} mode="dark">
      {children}
    </Theme>
  )
}
