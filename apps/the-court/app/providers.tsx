"use client"

import type { ReactNode } from "react"

import { ToastProvider } from "@workspace/ui/components/toast"
import { useKeyboardInset } from "@workspace/ui/hooks/use-keyboard-inset"

/**
 * KeyboardInsetListener — 소프트 키보드 높이를 측정해 `--inset-keyboard` CSS 변수에
 * write 한다(앱 전역 1회 장착). 셸(h-viewport)·시트(DetentSheet)·토스트가 이 변수를
 * 읽어 키보드 위로 물러난다. 리프 컴포넌트로 둬서 훅의 setState 리렌더가 앱 트리로
 * 번지지 않게 격리한다.
 */
function KeyboardInsetListener() {
  useKeyboardInset()
  return null
}

/**
 * 앱 프로바이더. 테마는 layout 의 `<html class="light">` 가 @workspace/ui 토큰을
 * 라이트에 고정하므로 별도 테마 프로바이더는 없다. 토스트 + 키보드 인셋 리스너를 마운트한다.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <KeyboardInsetListener />
      {children}
    </ToastProvider>
  )
}
