"use client"

import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion"

import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

/**
 * BottomSheet — Base UI Dialog(headless) 위의 모바일 하단 시트. (규칙5)
 *
 * a11y 는 Base UI 가 보장한다: 포커스 트랩·초기 포커스·닫힐 때 트리거로
 * 포커스 복원·Escape·`aria-modal`·`role="dialog"`, 그리고 title/description 을
 * `Dialog.Title`/`Dialog.Description` 로 렌더해 `aria-labelledby`/`describedby`
 * 자동 연결. 손수 만든 body-scroll-lock·포털·backdrop 버튼 제거.
 *
 * 모션: 시트 spring·drag-to-dismiss(framer)는 유지한다. Base UI 가 애니메이션
 * 도중 언마운트하지 않도록 `actionsRef.unmount` + `preventUnmountOnClose` 로
 * AnimatePresence 가 exit 를 끝낸 뒤에 실제 언마운트한다(공식 external-animation 패턴).
 * 색·라운드·그림자는 semantic 토큰 유틸리티만(규칙1·2·3).
 */
type BottomSheetProps = {
  children: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  leadingAccessory?: React.ReactNode
  onOpenChange: (open: boolean) => void
  open: boolean
  trailingAccessory?: React.ReactNode
  title?: React.ReactNode
  className?: string
  contentClassName?: string
  scrollable?: boolean
}

function BottomSheet({
  children,
  className,
  contentClassName,
  description,
  footer,
  leadingAccessory,
  onOpenChange,
  open,
  scrollable = true,
  trailingAccessory,
  title,
}: BottomSheetProps) {
  const reducedMotion = useReducedMotion()
  const actionsRef = React.useRef<Dialog.Root.Actions | null>(null)

  function handleDragEnd(_: PointerEvent, info: PanInfo) {
    if (
      info.offset.y > motionTokens.gesture.sheetDismissOffset ||
      info.velocity.y > motionTokens.gesture.sheetDismissVelocity
    ) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        // framer 가 exit 를 그리는 동안 Base UI 가 즉시 언마운트하지 않게 막고,
        // AnimatePresence.onExitComplete 에서 수동 언마운트한다.
        if (!nextOpen) {
          eventDetails.preventUnmountOnClose()
        }
        onOpenChange(nextOpen)
      }}
      actionsRef={actionsRef}
    >
      <Dialog.Portal keepMounted>
        <AnimatePresence onExitComplete={() => actionsRef.current?.unmount()}>
          {open ? (
            <div className="fixed inset-0 z-50 flex items-end justify-center overscroll-contain">
              <Dialog.Backdrop
                render={
                  <motion.div
                    className="absolute inset-0 bg-backdrop-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: reducedMotion
                        ? motionTokens.duration.instant
                        : motionTokens.duration.quick,
                      ease: motionTokens.ease.fade,
                    }}
                  />
                }
              />
              <Dialog.Popup
                render={
                  <motion.section
                    drag="y"
                    dragDirectionLock
                    dragElastic={0.12}
                    dragMomentum={false}
                    onDragEnd={
                      handleDragEnd as (
                        event: MouseEvent | TouchEvent | PointerEvent,
                        info: PanInfo
                      ) => void
                    }
                    initial={
                      reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }
                    }
                    animate={
                      reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                    }
                    exit={
                      reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }
                    }
                    transition={
                      reducedMotion
                        ? { duration: motionTokens.duration.instant }
                        : motionTokens.spring.sheet
                    }
                  />
                }
                className={cn(
                  "relative z-10 flex max-h-[82dvh] w-full max-w-[34rem] flex-col overflow-hidden overscroll-contain rounded-t-hero border border-border-subtle bg-surface-overlay text-text-primary shadow-elevation-3 outline-none",
                  className
                )}
              >
                <div className="flex justify-center pt-2.5">
                  <div className="h-1.5 w-10 rounded-pill bg-fill-neutral-strong" />
                </div>
                {title ||
                description ||
                leadingAccessory ||
                trailingAccessory ? (
                  <header className="px-4 pt-2 pb-3 sm:px-5">
                    <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
                      <div className="min-h-9 min-w-12">{leadingAccessory}</div>
                      <div className="min-w-0 pt-1 text-center">
                        {title ? (
                          <Dialog.Title className="truncate text-title font-strong text-text-primary">
                            {title}
                          </Dialog.Title>
                        ) : null}
                        {description ? (
                          <Dialog.Description className="mt-1 text-caption text-text-tertiary">
                            {description}
                          </Dialog.Description>
                        ) : null}
                      </div>
                      <div className="flex min-h-9 min-w-12 justify-end">
                        {trailingAccessory}
                      </div>
                    </div>
                  </header>
                ) : null}
                <div
                  className={cn(
                    "min-h-0 flex-1 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5",
                    scrollable ? "overflow-y-auto" : "overflow-hidden",
                    contentClassName
                  )}
                >
                  {children}
                </div>
                {footer ? (
                  <footer className="border-t border-border-subtle px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
                    {footer}
                  </footer>
                ) : null}
              </Dialog.Popup>
            </div>
          ) : null}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { BottomSheet }
