"use client"

import * as React from "react"

/**
 * useKeyboardAwareScroll — 시트·다이얼로그 본문의 **스크롤 컨테이너 안**에서, 지금
 * 포커스된 입력이 소프트 키보드에 가리지 않도록 컨테이너를 스크롤한다(버그 D).
 *
 * 왜 컨테이너 스크롤인가: iOS 는 입력 포커스 시 **문서 전체**를 스크롤해 입력을 화면
 * 중앙에 맞추려 한다 → 고정 셸에서 UI 가 밀린다. `scrollIntoView` 도 문서까지 밀 수
 * 있다. 그래서 여기선 요소의 위치를 직접 계산해 **주어진 컨테이너의 scrollTop 만**
 * 조정한다(문서 스크롤 0). 시트 리프트(`--inset-keyboard`)로 컨테이너가 키보드 위로
 * 물러난 뒤, 접힌 아래에 있던 입력을 가시영역으로 끌어올린다.
 *
 * 언제 보정하나:
 * - focusin(컨테이너 안 입력) — 어느 입력을 지킬지 정한다.
 * - 컨테이너 ResizeObserver — 키보드 열림/detent 변화/리프트로 가시영역이 줄면 재보정.
 *   (키보드 기하는 `--inset-keyboard` → Popup bottom → 컨테이너 높이로 전파되므로
 *    컨테이너 리사이즈가 "가시영역 바뀜"의 가장 정확한 신호다.)
 *
 * 컨테이너 밖(예: fill 시트의 고정 푸터 컴포저)은 리프트만으로 이미 키보드 위라 여기
 * 대상이 아니다 — 이 훅은 스크롤 컨테이너 내부 입력만 다룬다.
 */
export function useKeyboardAwareScroll(
  containerRef: React.RefObject<HTMLElement | null>,
  enabled = true
): void {
  React.useEffect(() => {
    if (!enabled) return
    const container = containerRef.current
    if (!container) return

    let focused: HTMLElement | null = null
    let raf = 0

    const isEditable = (el: EventTarget | null): el is HTMLElement =>
      el instanceof HTMLElement &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable)

    // 포커스된 입력이 컨테이너 가시영역(위/아래 12px 여백) 밖이면 그만큼만 스크롤.
    const ensureVisible = () => {
      if (!focused || !container.contains(focused)) return
      const margin = 12
      const c = container.getBoundingClientRect()
      const f = focused.getBoundingClientRect()
      if (f.bottom > c.bottom - margin) {
        container.scrollTop += f.bottom - (c.bottom - margin)
      } else if (f.top < c.top + margin) {
        container.scrollTop -= c.top + margin - f.top
      }
    }

    const schedule = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        ensureVisible()
      })
    }

    const onFocusIn = (event: FocusEvent) => {
      if (!isEditable(event.target)) return
      focused = event.target
      schedule()
    }

    const onFocusOut = (event: FocusEvent) => {
      // 포커스가 컨테이너 밖으로 나가면 대상 해제(키보드 닫힘·다른 영역).
      if (
        !isEditable(event.relatedTarget) ||
        !container.contains(event.relatedTarget)
      ) {
        focused = null
      }
    }

    container.addEventListener("focusin", onFocusIn)
    container.addEventListener("focusout", onFocusOut)
    const observer = new ResizeObserver(schedule)
    observer.observe(container)

    return () => {
      container.removeEventListener("focusin", onFocusIn)
      container.removeEventListener("focusout", onFocusOut)
      observer.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [containerRef, enabled])
}
