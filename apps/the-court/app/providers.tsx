"use client"

import type { ReactNode } from "react"

import { ToastProvider } from "@workspace/ui/components/toast"

/**
 * 앱 프로바이더. 테마는 layout 의 `<html class="light">` 가 @workspace/ui 토큰을
 * 라이트에 고정하므로 별도 테마 프로바이더는 없다. 여기선 토스트만 마운트한다.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
