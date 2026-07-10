"use client"

import type { ReactNode } from "react"

import { MotionConfig } from "framer-motion"

import { ThemeProvider } from "@/components/theme-provider"

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>{children}</ThemeProvider>
    </MotionConfig>
  )
}
