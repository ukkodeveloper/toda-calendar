"use client"

import type { ReactNode } from "react"

import { Theme } from "@astryxdesign/core/theme"
import { stoneTheme } from "@astryxdesign/theme-stone/built"

/**
 * Astryx theme provider — Stone (프리셋, 기본값 그대로).
 * 토큰은 프리컴파일 CSS(`@astryxdesign/theme-stone/theme.css`, layout 에서 import)로 오고,
 * <Theme> 는 래퍼에 data-astryx-theme="stone" + 색 모드만 붙인다.
 * 커스텀 오버라이드 없음 — /themes?theme=stone 그대로. (폰트만 globals 에서 로드본 연결)
 * 라이트/다크 전환: 여기 mode 와 layout.tsx 의 <html data-theme> 를 함께 바꾼다.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <Theme theme={stoneTheme} mode="light">
      {children}
    </Theme>
  )
}
