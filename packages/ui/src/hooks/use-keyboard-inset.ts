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
 *
 * blur 처리(버그 B 개선): 예전엔 모든 `focusout` 에서 인셋을 즉시 0 으로 슬램했다.
 * 그러면 (a) 전송·버튼 탭처럼 포커스가 잠깐 튀는 순간에도, (b) 입력 간 이동에도 0 이
 * 되어 셸·시트가 확 커졌다가 vv resize 로 다시 줄어드는 **이중 점프**가 났다. 이제는:
 * - 다음 포커스가 또 다른 입력이면(relatedTarget 이 editable) 슬램하지 않는다 — 키보드
 *   유지, vv resize 가 알아서 수렴.
 * - 진짜 이탈이면 즉시 0 대신 짧게 debounce 후, 그 사이 다른 입력이 포커스를 도로
 *   가져갔으면 취소. 남아 있으면 0 으로 수렴(iOS26 잔상 방어는 이 지연 슬램으로 유지).
 * - focusin 은 대기 중 슬램을 취소하고 재측정을 건다.
 *
 * 앱 루트에 한 번 장착한다(예: providers). SSR/미지원 환경은 no-op(0 반환).
 */
const CLAMP_FLOOR_PX = 60
const VAR_NAME = "--inset-keyboard"
// focusout 뒤 "진짜 닫힘"으로 확정하기까지 기다리는 창. 이 사이 다른 입력이 포커스를
// 도로 가져가면(입력 간 이동) 슬램을 취소한다. vv resize 가 자연 수렴할 시간도 준다.
const BLUR_SETTLE_MS = 120

function isEditableElement(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable
}

export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null
    if (!vv) return

    const root = document.documentElement
    let raf = 0
    let last = -1
    let blurTimer = 0

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

    // iOS26 잔상 방어: 진짜 닫힘인데 vv 가 늦게 복원되면 인셋이 남는다 → 0 으로 슬램.
    const forceZero = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      apply(0)
    }

    // focusout: 즉시 슬램하지 않는다(버그 B). 다음 포커스가 또 다른 입력이면 키보드가
    // 유지되므로 그냥 둔다. 진짜 이탈이면 짧게 기다렸다가, 그 사이 입력으로 재포커스
    // 되지 않았을 때만 0 으로 확정한다.
    const onFocusOut = (event: FocusEvent) => {
      if (isEditableElement(event.relatedTarget)) return
      window.clearTimeout(blurTimer)
      blurTimer = window.setTimeout(() => {
        if (isEditableElement(document.activeElement)) return
        forceZero()
      }, BLUR_SETTLE_MS)
    }

    // focusin: 대기 중이던 슬램을 취소하고 재측정을 건다(입력 간 이동·재포커스).
    const onFocusIn = () => {
      window.clearTimeout(blurTimer)
      schedule()
    }

    vv.addEventListener("resize", schedule)
    vv.addEventListener("scroll", schedule)
    window.addEventListener("focusout", onFocusOut)
    window.addEventListener("focusin", onFocusIn)

    measure()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.clearTimeout(blurTimer)
      vv.removeEventListener("resize", schedule)
      vv.removeEventListener("scroll", schedule)
      window.removeEventListener("focusout", onFocusOut)
      window.removeEventListener("focusin", onFocusIn)
      root.style.removeProperty(VAR_NAME)
    }
  }, [])

  return inset
}
