"use client"

import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { motionTokens } from "@workspace/ui/lib/motion"
import {
  ThreeStageSheet,
  type ThreeStageSheetDetent,
} from "@workspace/ui/components/three-stage-sheet"
import { useKeyboardAwareScroll } from "@workspace/ui/hooks/use-keyboard-aware-scroll"
import { cn } from "@workspace/ui/lib/utils"

/**
 * DetentSheet — 다단계(detent) 바텀시트 모달. (규칙5: 재발명 대신 조합)
 *
 * 왜 새로 두는가: ThreeStageSheet 는 **드래그 가능한 presentational dialog** 라
 * 포탈·backdrop·scroll-lock·focus-trap 을 만들지 않는다(그쪽 헤더 주석의 경계).
 * 진짜 모달이 필요한 앱은 "Base UI Dialog 로 감싼다" 가 정해진 경로 —
 * BottomSheet 가 이미 그 경로다. DetentSheet 는 그 경로를 **여러 detent** 로 넓힌
 * 것: Base UI Dialog(모달 인프라) 위에 ThreeStageSheet(2·3단 드래그 표면)를 얹는다.
 *
 * - 모달 인프라: Base UI Dialog 가 포탈·scroll-lock·focus·Escape·`aria-modal` 을 준다.
 *   framer 가 exit 를 그리는 동안 언마운트를 막고(`preventUnmountOnClose`)
 *   AnimatePresence.onExitComplete 에서 수동 언마운트(공식 external-animation 패턴).
 * - 표면: ThreeStageSheet 가 detent·드래그·스냅을 소유. 드래그는 **핸들에서만**
 *   시작(dragListener=false)이라 본문 스크롤·입력과 제스처가 겹치지 않는다 —
 *   이게 "시트 위 drawer 제스처 충돌" 의 구조적 해소다.
 * - 기본 detent 는 **2단(mid·full)**. peek(최소 stage)는 두지 않아 아래로는 닫힘만
 *   있고 peek 로 내려앉지 않는다(요구: stage-1 미렌더).
 * - 바깥 탭 닫기: 시트 뒤 전체를 덮는 투명 버튼(scrim). Base UI 의 outside-press 는
 *   Popup 이 뷰포트를 덮어(ThreeStageSheet 의 높이 기준 부모라 inset-0) 판정이 안
 *   서므로, 명시 scrim 으로 대신한다.
 *
 * 색·라운드·그림자는 ThreeStageSheet 가 semantic 토큰으로 그린다(규칙1·2·3).
 *
 * a11y 주석: Popup(Base UI)과 ThreeStageSheet 가 각각 role="dialog" 라 dialog 가
 * 겹친다. Base UI Popup 이 focus-trap·aria-modal·labelledby(Dialog.Title)를 소유하고
 * 안쪽 ThreeStageSheet 는 드래그 표면이다 — ThreeStageSheet 시그니처를 얼리기 위한
 * 의도적 절충(정해진 "Dialog 로 감싼다" 경로의 비용). 필요해지면 ThreeStageSheet 에
 * role 오버라이드를 뚫는 것이 다음 수순.
 */

/** 기본 2단 detent: 중간(2단)에서 시작해 위로 full(3단). peek(1단)은 없다. */
const DEFAULT_DETENTS: ThreeStageSheetDetent[] = [
  { id: "mid", ratio: 0.62 },
  { id: "full", ratio: 0.92 },
]

type DetentSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  leadingAccessory?: React.ReactNode
  trailingAccessory?: React.ReactNode
  className?: string
  contentClassName?: string
  /**
   * 멈출 높이들. 기본 2단(mid·full). 배열은 노출량 순서 무관.
   * peek(작은 stage)를 넣지 않는 한 시트는 아래로 닫힘만 하고 peek 에 안 앉는다.
   */
  detents?: ThreeStageSheetDetent[]
  /** 열릴 때 시작 detent id. 기본 `"mid"`(중간=2단). */
  initialDetentId?: string
  /**
   * 본문이 남은 높이를 채우고 스크롤하는지. 기본 `false`.
   * - `false`(폼): 콘텐츠를 상단 정렬해 짧은 폼은 mid 에서 푸터까지 다 보인다.
   * - `true`(리스트·재판): 본문 flex-1 + 스크롤, 푸터는 하단 고정. 푸터가 있으면
   *   mid 에선 가려지므로 `initialDetentId="full"` 와 함께 쓴다.
   */
  fill?: boolean
  /** 포탈 컨테이너. 기본 `<body>`(뷰포트 전면 모달). */
  container?: React.ComponentProps<typeof Dialog.Portal>["container"]
}

function DetentSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  footer,
  leadingAccessory,
  trailingAccessory,
  className,
  contentClassName,
  detents = DEFAULT_DETENTS,
  initialDetentId = "mid",
  fill = false,
  container,
}: DetentSheetProps) {
  const reducedMotion = useReducedMotion()
  const actionsRef = React.useRef<Dialog.Root.Actions | null>(null)
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const [activeDetentId, setActiveDetentId] = React.useState(initialDetentId)

  // 본문 스크롤 컨테이너 안 입력이 키보드에 가리면 컨테이너를 스크롤해 끌어올린다(버그 D).
  // 리프트(--inset-keyboard)로 컨테이너가 줄면 ResizeObserver 가 재보정한다.
  useKeyboardAwareScroll(scrollRef, open)

  // 열릴 때마다 시작 detent 로 리셋.
  React.useEffect(() => {
    if (open) {
      setActiveDetentId(initialDetentId)
    }
  }, [open, initialDetentId])

  const label = typeof title === "string" ? title : "시트"
  const hasHeader =
    title || description || leadingAccessory || trailingAccessory

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen) {
          eventDetails.preventUnmountOnClose()
        }
        onOpenChange(nextOpen)
      }}
      actionsRef={actionsRef}
    >
      <Dialog.Portal keepMounted container={container}>
        <AnimatePresence onExitComplete={() => actionsRef.current?.unmount()}>
          {open ? (
            <div className="fixed inset-0 z-50">
              <Dialog.Backdrop
                render={
                  <motion.div
                    className="pointer-events-none absolute inset-0 bg-backdrop-overlay"
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
              {/* Popup = focus-trap + 뷰포트 높이 기준 부모(ThreeStageSheet 가 clientHeight 로 측정).
               * 소프트 키보드가 열리면 하단을 `--inset-keyboard` 만큼 들어올려 이 박스를 줄인다 →
               * ThreeStageSheet 의 ResizeObserver 가 재측정 → detent 높이가 키보드 위 가시영역
               * 기준으로 재계산되고 시트(bottom-0)가 키보드 위로 물러난다. 키보드 닫힘=0px.
               * backdrop 은 바깥 fixed inset-0(전체)이라 리프트 seam 에 투명 틈이 없다. */}
              <Dialog.Popup className="absolute inset-x-0 top-0 bottom-[var(--inset-keyboard,0px)] outline-none">
                {/* 바깥 탭 닫기 scrim — 시트 뒤 전체를 덮는 투명 버튼. */}
                <button
                  type="button"
                  aria-label="닫기"
                  tabIndex={-1}
                  className="absolute inset-0 cursor-default"
                  onClick={() => onOpenChange(false)}
                />
                <ThreeStageSheet
                  activeDetentId={activeDetentId}
                  detents={detents}
                  label={label}
                  onActiveDetentChange={setActiveDetentId}
                  onRequestClose={() => onOpenChange(false)}
                  className={cn("pointer-events-auto", className)}
                >
                  <div className="flex h-full flex-col">
                    {hasHeader ? (
                      <header className="shrink-0 pt-1 pb-3">
                        <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
                          <div className="min-h-9 min-w-9">
                            {leadingAccessory}
                          </div>
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
                          <div className="flex min-h-9 min-w-9 justify-end">
                            {trailingAccessory}
                          </div>
                        </div>
                      </header>
                    ) : null}
                    {/* 스크롤 영역은 항상 flex-1 로 남은 높이를 채우고 overflow-y-auto —
                     * detent 로 보이는 높이보다 콘텐츠가 많으면 스크롤로 도달한다.
                     * fill=false(폼): 푸터를 스크롤 영역 안에 둬 콘텐츠 뒤에 흐르므로,
                     *   짧으면 mid 에서 푸터까지 보이고 길면 스크롤로 닿는다.
                     * fill=true(리스트·재판): 본문만 스크롤하고 푸터(컴포저 등)는 하단 고정. */}
                    <div
                      ref={scrollRef}
                      className={cn(
                        "min-h-0 flex-1 overflow-y-auto",
                        contentClassName
                      )}
                    >
                      {children}
                      {!fill && footer ? (
                        <footer className="mt-3 border-t border-border-subtle pt-3">
                          {footer}
                        </footer>
                      ) : null}
                    </div>
                    {fill && footer ? (
                      <footer className="shrink-0 border-t border-border-subtle pt-3">
                        {footer}
                      </footer>
                    ) : null}
                  </div>
                </ThreeStageSheet>
              </Dialog.Popup>
            </div>
          ) : null}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { DetentSheet, DEFAULT_DETENTS }
export type { DetentSheetProps }
