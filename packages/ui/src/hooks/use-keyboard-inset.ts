"use client"

import { useEffect, useState } from "react"

/**
 * useKeyboardInset — 소프트 키보드가 하단을 가리는 높이를 측정해
 * `--inset-keyboard` CSS 변수(document.documentElement)에 write 하고, px 값을 반환한다.
 *
 * 왜 JS 인가: CSS 만으로는 iOS Safari 의 키보드 높이를 못 얻는다(VirtualKeyboard API·
 * env(keyboard-inset-*) 미지원). `visualViewport` 가 크로스플랫폼 단일 진실 공급원이다.
 * 이 훅이 유일한 측정 지점 — 셸·시트·컴포저는 `--inset-keyboard`(→ h-viewport·pb-keyboard·
 * BottomSheet)만 읽고 각자 visualViewport 를 재지 않는다.
 *
 * 측정식(양팀 확정): raw = innerHeight - visualViewport.height - visualViewport.offsetTop.
 * - interactiveWidget 은 OFF(기본 resizes-visual) 전제 → innerHeight(layout)는 고정, vv 만 축소.
 * - 60px 미만 잔차는 0 으로 클램프(iOS26 accessory bar·offsetTop 잔차 흡수).
 * - 값 변화 없으면 skip(스타일 write thrash 방지), rAF 로 스로틀.
 * - focusout 시 강제 0(iOS26 fixed/sticky 잔상 제거).
 *
 * 앱 루트에 한 번 장착한다(예: providers). SSR/미지원 환경은 no-op(0 반환).
 */
const CLAMP_FLOOR_PX = 60
const VAR_NAME = "--inset-keyboard"

export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null
    if (!vv) return

    const root = document.documentElement
    let raf = 0
    let last = -1

    const apply = (next: number) => {
      if (next === last) return
      last = next
      root.style.setProperty(VAR_NAME, `${next}px`)
      setInset(next)
    }

    const measure = () => {
      const raw = window.innerHeight - vv.height - vv.offsetTop
      apply(raw < CLAMP_FLOOR_PX ? 0 : Math.round(raw))
    }

    const schedule = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        measure()
      })
    }

    // 포커스가 빠지면 키보드가 내려간다 — iOS26 은 잔상으로 vv 가 늦게 복원되므로 즉시 0.
    const forceZero = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      apply(0)
    }

    vv.addEventListener("resize", schedule)
    vv.addEventListener("scroll", schedule)
    window.addEventListener("focusout", forceZero)

    measure()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      vv.removeEventListener("resize", schedule)
      vv.removeEventListener("scroll", schedule)
      window.removeEventListener("focusout", forceZero)
      root.style.removeProperty(VAR_NAME)
    }
  }, [])

  return inset
}
