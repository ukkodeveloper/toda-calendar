"use client"

import * as React from "react"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { motionTokens } from "@workspace/ui/lib/motion"

/**
 * Toast — 짧은 비침습 피드백(복사됨·실패 등). 화면 하단 중앙에 잠깐 떴다 사라진다.
 *
 * 포털 없이 provider 하위 in-tree `fixed` 컨테이너로 렌더한다(SSR 안전).
 * a11y: `role="status"` + `aria-live="polite"` 로 스크린리더에 알린다.
 * 색·라운드·그림자는 semantic 토큰만(규칙1·2·3), 모션은 토큰(규칙11, reduce-motion 대안).
 *
 *   <ToastProvider> … </ToastProvider>   // 앱 루트 1회
 *   const toast = useToast()
 *   toast({ body: "복사됐어요" })
 */
type ToastOptions = {
  body: React.ReactNode
  /** 자동 소멸까지 ms. 기본 3000. */
  duration?: number
}

type ToastItem = { id: number; body: React.ReactNode }

const ToastContext = React.createContext<((opts: ToastOptions) => void) | null>(
  null
)

function ToastProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion()
  const [items, setItems] = React.useState<ToastItem[]>([])
  const idRef = React.useRef(0)

  const toast = React.useCallback((opts: ToastOptions) => {
    const id = ++idRef.current
    setItems((prev) => [...prev, { id, body: opts.body }])
    const duration = opts.duration ?? 3000
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[max(var(--p-space-6),var(--inset-safe-bottom),var(--inset-keyboard,0px))] z-[100] flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              role="status"
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 12, scale: 0.96 }
              }
              animate={
                reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
              }
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 8, scale: 0.96 }
              }
              transition={{
                duration: reducedMotion
                  ? motionTokens.duration.instant
                  : motionTokens.duration.quick,
                ease: motionTokens.ease.fade,
              }}
              className="pointer-events-auto max-w-[22rem] rounded-control bg-fill-neutral-strong px-4 py-2.5 text-center text-body text-text-primary shadow-elevation-3"
            >
              {t.body}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast 는 <ToastProvider> 안에서만 쓸 수 있어요.")
  }
  return ctx
}

export { ToastProvider, useToast }
export type { ToastOptions }
