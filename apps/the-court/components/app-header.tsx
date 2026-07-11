"use client"

import type { ReactNode } from "react"
import Link from "next/link"

// 온보딩을 제외한 모든 페이지 공통 헤더.
// 왼쪽 상단에 현행범 로고(→ /home), 오른쪽에 페이지별 액션(endContent).
// @workspace/ui semantic 토큰 유틸만 사용(규칙1·3). 프로스티드 sticky 헤더(home 과 정합).
export function AppHeader({ endContent }: { endContent?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex min-h-14 shrink-0 items-center justify-between gap-3 bg-surface-canvas/80 px-5 py-2 backdrop-blur-xl">
      <Link href="/home" aria-label="현행범 홈" className="inline-flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hyeonhaengbeom_logo.png"
          alt="현행범"
          className="block h-6 w-auto"
        />
      </Link>

      {endContent}
    </header>
  )
}
