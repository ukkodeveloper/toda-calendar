"use client"

import * as React from "react"
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "framer-motion"

import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

/**
 * ThreeStageSheet — floating drag 다단계 시트 (앱 종속 없음).
 *
 * S2: 세로 위치(translateY) 기반 4단 detent. detent = 목표 `y` 하나로 표현하고,
 * 드래그 변위·detent 전환·스냅을 전부 같은 `y` MotionValue/스프링으로 통합한다.
 *
 * - 단일 소스: 위치는 `style.y`(MotionValue) 하나뿐. 선언적 `animate` prop 은
 *   opacity(enter/exit)만 다뤄 키가 겹치지 않는다 — 같은 기하 prop 을 style·animate
 *   에 이중 선언하지 않는다.
 * - 기준 컨테이너: 자기 위치 부모(데모=폰 프레임, 앱=뷰포트)의 높이를 ref +
 *   ResizeObserver 로 측정해 detent 를 상대 계산한다. 리사이즈 시 재계산.
 * - detent: 시트를 넉넉한 높이(가장 큰 detent 의 visible)로 두고, y 로 아래로
 *   밀어 노출량을 정한다. y = sheetHeight − visible. peek 는 핸들 px 만 보이고
 *   본체는 컨테이너 하단 아래로 숨는다(overflow-hidden 컨테이너에 clip).
 * - snap: 놓으면 velocity 로 착지 y 를 예측해 최근접 detent 로 스냅(관성 크면 다단
 *   점프). peek 아래(hidden) 가 최근접이면 `onRequestClose`(언마운트/dismiss).
 *
 * detent 는 컨테이너 높이 비율(`ratio`) 또는 고정 노출 px(`peekPx`)로 정의한다.
 * closed(0단)는 detent 가 아니라 부모의 언마운트로 표현한다(AnimatePresence).
 */
export type ThreeStageSheetDetent = {
  id: string
  /** 컨테이너 높이 대비 노출 비율(0..1). half=0.5, tall=0.8. */
  ratio?: number
  /** 고정 노출 px(핸들 peek). 지정 시 ratio 대신 사용. */
  peekPx?: number
}

type ThreeStageSheetProps = {
  activeDetentId: string
  children?: React.ReactNode
  className?: string
  detents: ThreeStageSheetDetent[]
  /**
   * peek 아래로 던져 닫을 수 있는지. 기본 true. false 면 최저 detent(peek)가
   * 바닥이라 어떤 드래그·플릭으로도 closed 에 도달하지 못하고 `onRequestClose`
   * 도 부르지 않는다.
   */
  dismissible?: boolean
  handleLabel?: string
  onActiveDetentChange: (id: string) => void
  onRequestClose?: () => void
}

// 놓는 순간 velocity(px/s)로 착지 위치를 예측하는 창(초).
const VELOCITY_PROJECTION = 0.12

function ThreeStageSheet({
  activeDetentId,
  children,
  className,
  detents,
  dismissible = true,
  handleLabel = "시트 크기 조절 핸들",
  onActiveDetentChange,
  onRequestClose,
}: ThreeStageSheetProps) {
  const reducedMotion = useReducedMotion()
  const dragControls = useDragControls()
  const y = useMotionValue(0)
  const sheetRef = React.useRef<HTMLElement | null>(null)
  const mountedRef = React.useRef(false)
  const [containerHeight, setContainerHeight] = React.useState(0)
  const [settleTick, setSettleTick] = React.useState(0)

  // 자기 위치 부모(폰 프레임/뷰포트) 높이를 측정. 리사이즈 반영.
  React.useEffect(() => {
    const parent = sheetRef.current?.parentElement
    if (!parent) {
      return
    }

    const update = () => setContainerHeight(parent.clientHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(parent)

    return () => observer.disconnect()
  }, [])

  const visibleOf = React.useCallback(
    (detent: ThreeStageSheetDetent) =>
      detent.peekPx ?? (detent.ratio ?? 0) * containerHeight,
    [containerHeight]
  )

  const sheetHeight = detents.reduce(
    (max, detent) => Math.max(max, visibleOf(detent)),
    0
  )
  const hiddenY = sheetHeight
  // 최저 detent(가장 적게 보이는 = peek)의 y. dismiss 불가일 때 드래그·스냅 바닥.
  const minVisible = detents.reduce(
    (min, detent) => Math.min(min, visibleOf(detent)),
    Number.POSITIVE_INFINITY
  )
  const floorY = Number.isFinite(minVisible)
    ? sheetHeight - minVisible
    : hiddenY
  const dragBottom = dismissible ? hiddenY : floorY

  const detentY = React.useCallback(
    (id: string) => {
      const detent =
        detents.find((item) => item.id === id) ?? detents[detents.length - 1]
      return sheetHeight - (detent ? visibleOf(detent) : 0)
    },
    [detents, sheetHeight, visibleOf]
  )

  const transition = React.useMemo(
    () =>
      reducedMotion
        ? { duration: motionTokens.duration.instant }
        : motionTokens.intent.floatingSheet.detent,
    [reducedMotion]
  )

  // 위치의 유일한 애니메이션 소스: activeDetentId·컨테이너·settle 변화 때마다
  // y 를 목표 detent 로 애니메이트. 첫 실행은 hidden 에서 슬라이드 인.
  React.useEffect(() => {
    if (containerHeight <= 0) {
      return
    }

    if (!mountedRef.current) {
      y.set(hiddenY)
      mountedRef.current = true
    }

    const controls = animate(y, detentY(activeDetentId), transition)
    return () => controls.stop()
  }, [
    activeDetentId,
    containerHeight,
    detentY,
    hiddenY,
    settleTick,
    transition,
    y,
  ])

  function handleDragEnd(
    _: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo
  ) {
    const projected = y.get() + info.velocity.y * VELOCITY_PROJECTION

    let nearestId = detents[0]?.id ?? activeDetentId
    let nearestDist = Number.POSITIVE_INFINITY
    for (const detent of detents) {
      const distance = Math.abs(detentY(detent.id) - projected)
      if (distance < nearestDist) {
        nearestDist = distance
        nearestId = detent.id
      }
    }

    // dismiss 가능일 때만: peek 아래(hidden)가 최근접이면 닫는다.
    if (
      dismissible &&
      onRequestClose &&
      Math.abs(hiddenY - projected) < nearestDist
    ) {
      onRequestClose()
      return
    }

    onActiveDetentChange(nearestId)
    setSettleTick((tick) => tick + 1)
  }

  return (
    <motion.section
      ref={sheetRef}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.12}
      dragConstraints={{ top: 0, bottom: dragBottom }}
      onDragEnd={handleDragEnd}
      className={cn(
        "absolute inset-x-3 bottom-0 z-10 flex flex-col overflow-hidden rounded-hero border border-border-subtle bg-surface-overlay text-text-primary shadow-elevation-3",
        className
      )}
      style={{ y, height: sheetHeight > 0 ? sheetHeight : undefined }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: reducedMotion
          ? motionTokens.duration.instant
          : motionTokens.duration.quick,
        ease: motionTokens.ease.fade,
      }}
    >
      <div className="flex shrink-0 justify-center pt-2.5">
        <button
          type="button"
          aria-label={handleLabel}
          className="flex w-full max-w-24 cursor-grab touch-none items-center justify-center rounded-pill py-2 active:cursor-grabbing"
          onPointerDown={(event) => dragControls.start(event)}
        >
          <span className="h-1.5 w-10 rounded-pill bg-fill-neutral-strong" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4">{children}</div>
    </motion.section>
  )
}

export { ThreeStageSheet }
