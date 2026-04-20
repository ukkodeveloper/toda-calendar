"use client"

import type { ReactNode } from "react"
import { MotionConfig } from "motion/react"

import { motionTokens } from "@workspace/ui/lib/motion"

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={motionTokens.transition.default}
    >
      {children}
    </MotionConfig>
  )
}
