"use client"

import type { ReactNode } from "react"
import Link from "next/link"

import { HStack } from "@astryxdesign/core/Layout"

// 온보딩을 제외한 모든 페이지 공통 헤더.
// 왼쪽 상단에 현행범 로고(→ /home), 오른쪽에 페이지별 액션(endContent).
export function AppHeader({ endContent }: { endContent?: ReactNode }) {
  return (
    <HStack
      align="center"
      justify="between"
      style={{
        minHeight: 56,
        padding: "12px 20px",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <Link
        href="/home"
        aria-label="현행범 홈"
        style={{ display: "inline-flex" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hyeonhaengbeom_logo.png"
          alt="현행범"
          height={24}
          style={{ height: 24, width: "auto", display: "block" }}
        />
      </Link>

      {endContent}
    </HStack>
  )
}
