"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * toda-calendar 는 라이트 고정이다.
 *
 * 공유 DS(@workspace/ui)는 Sprint 01 부터 다크 네이티브가 기본(:root)이고
 * .light 가 보조 테마다. 하지만 toda 는 "조용하고 따뜻한 종이 저널링" 정체성이라
 * 화면·시트·셀이 라이트 표면에 맞춰 그려졌다(warm off-white bg, 유리질 white 오버레이).
 * 그래서 앱을 .light 로 고정해 DS semantic 토큰(bg-background 등)과
 * --calendar-* 앱 토큰(:root=light)이 같은 라이트 표면에서 정합하게 한다.
 *
 * forcedTheme 으로 system/다크를 무시한다(다크는 이 앱에서 감사되지 않은 표면).
 */
function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
