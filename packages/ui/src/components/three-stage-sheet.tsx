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
 *
 * 접근성: 시트는 `role="dialog"`. `modal` 이면 `aria-modal` + 열림/닫힘 시 포커스
 * 이동·복귀. 핸들은 포커스 가능한 버튼으로 ↑/↓(크게/작게)·Home/End(최대/최소)로
 * detent 를 옮기고, Esc 는(dismissible 시) 시트를 닫는다. reduced-motion 에서는
 * 스프링 대신 즉시 전환.
 * 배경 inert·전면 Tab 트랩은 이 컴포넌트가 안 만든다 — 필요하면 소비 측이 Base UI
 * Dialog 로 감싼다(`modal` prop 주석 참고). 즉 드래그 가능한 presentational dialog.
 */
/**
 * 하나의 detent = 시트가 멈추는 높이 한 칸. 노출량을 둘 중 하나로 정의한다.
 * 한 detent 에 `ratio` 와 `peekPx` 를 함께 주면 `peekPx` 가 이긴다.
 */
export type ThreeStageSheetDetent = {
  /** 이 detent 의 고유 키. `activeDetentId`·`onActiveDetentChange` 와 짝. */
  id: string
  /** 컨테이너 높이 대비 노출 비율(0..1). 예: half=0.5, tall=0.8. */
  ratio?: number
  /** 고정 노출 px(핸들만 보이는 peek). 지정 시 `ratio` 를 무시한다. */
  peekPx?: number
}

export type ThreeStageSheetProps = {
  /** 지금 멈춰 있는 detent 의 id(controlled). 부모가 소유하는 단일 소스. */
  activeDetentId: string
  /**
   * 사용자가 드래그·키보드로 detent 를 바꾸려 할 때 부모에게 알린다.
   * 부모가 `activeDetentId` 를 갱신해야 실제로 이동한다(controlled).
   */
  onActiveDetentChange: (id: string) => void
  /** 시트 본문. 각 detent 높이에 맞는 콘텐츠를 넣는 slot. */
  children?: React.ReactNode
  /** 시트 표면에 덧붙일 클래스. 기본 스타일 뒤에 병합된다. */
  className?: string
  /** 멈출 높이들. 배열 순서와 무관하게 노출량으로 정렬해 다룬다. */
  detents: ThreeStageSheetDetent[]
  /**
   * peek 아래로 던지거나 Esc 로 닫을 수 있는지. 기본 `true`. `false` 면 최저
   * detent(peek)가 바닥이라 어떤 드래그·플릭·키로도 closed 에 못 가고
   * `onRequestClose` 도 부르지 않는다.
   */
  dismissible?: boolean
  /**
   * 모달 여부. 기본 `false`(비모달) — 인라인 프리뷰·상시 노출 시트를 위한 값이라
   * 포커스를 빼앗지 않는다. `true` 면 열릴 때 핸들로 포커스를 옮기고 닫힐 때
   * 직전 요소로 복귀하며 `aria-modal="true"` 를 건다.
   *
   * 경계(의도적): 이 컴포넌트는 **드래그 가능한 presentational dialog** 다 —
   * role/aria-modal + 포커스 이동·복원까지만 책임진다. 배경 inert·전면 Tab 트랩은
   * 손수 만들지 않는다(headless 재발명 금지, 규칙5). 진짜 모달(배경 비활성 +
   * Tab 순환 가둠)이 필요하면 **소비 측이 Base UI Dialog 로 감싼다** — BottomSheet
   * 가 이미 그 경로다(로드맵과 정합).
   */
  modal?: boolean
  /**
   * 시트(dialog)의 접근성 이름. dialog 는 이름이 있어야 하므로 소비 측에서
   * 콘텐츠에 맞는 값을 넘기는 것을 권장한다. 기본 `"시트"`.
   */
  label?: string
  /** 드래그 핸들의 스크린리더 라벨. 기본 `"시트 크기 조절 핸들"`. */
  handleLabel?: string
  /**
   * 닫기 요청. dismiss 가능한 드래그·플릭, Esc, 최저 detent 에서의 닫기 시도에
   * 반응해 호출된다. 부모가 시트를 언마운트(AnimatePresence)해 닫는다.
   */
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
  modal = false,
  label = "시트",
  handleLabel = "시트 크기 조절 핸들",
  onActiveDetentChange,
  onRequestClose,
}: ThreeStageSheetProps) {
  const reducedMotion = useReducedMotion()
  const dragControls = useDragControls()
  const y = useMotionValue(0)
  const sheetRef = React.useRef<HTMLElement | null>(null)
  const handleRef = React.useRef<HTMLButtonElement | null>(null)
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

  // detent 를 노출량 오름차순으로 정렬한 id 목록. 키보드 ↑/↓ 이동의 기준.
  const orderedIds = React.useMemo(
    () =>
      [...detents]
        .map((detent) => ({ id: detent.id, visible: visibleOf(detent) }))
        .sort((a, b) => a.visible - b.visible)
        .map((item) => item.id),
    [detents, visibleOf]
  )

  // 위치의 유일한 애니메이션 소스: activeDetentId·컨테이너·settle 변화 때마다
  // y 를 목표 detent 로 애니메이트. 첫 실행은 hidden 에서 슬라이드 인 —
  // 엔트런스는 detent 전환보다 부드러운 enter 스프링으로 한 동작처럼 올린다.
  React.useEffect(() => {
    if (containerHeight <= 0) {
      return
    }

    const isEntrance = !mountedRef.current
    if (isEntrance) {
      y.set(hiddenY)
      mountedRef.current = true
    }

    const transition = reducedMotion
      ? { duration: motionTokens.duration.instant }
      : isEntrance
        ? motionTokens.intent.floatingSheet.enter
        : motionTokens.intent.floatingSheet.detent

    const controls = animate(y, detentY(activeDetentId), transition)
    return () => controls.stop()
  }, [
    activeDetentId,
    containerHeight,
    detentY,
    hiddenY,
    reducedMotion,
    settleTick,
    y,
  ])

  // 모달일 때만: 열릴 때 핸들로 포커스, 닫힐 때 직전 요소로 복귀.
  // 비모달은 콘텐츠가 주인이라 포커스를 빼앗지 않는다.
  React.useEffect(() => {
    if (!modal) {
      return
    }

    const previouslyFocused = document.activeElement as HTMLElement | null
    handleRef.current?.focus()

    return () => previouslyFocused?.focus?.()
  }, [modal])

  function moveDetent(direction: 1 | -1) {
    const currentIndex = orderedIds.indexOf(activeDetentId)
    if (currentIndex < 0) {
      return
    }
    const nextIndex = currentIndex + direction
    if (nextIndex < 0 || nextIndex > orderedIds.length - 1) {
      return
    }
    const nextId = orderedIds[nextIndex]
    if (nextId) {
      onActiveDetentChange(nextId)
    }
  }

  // 핸들 키보드: ↑ 크게 / ↓ 작게 / Home 최대 / End 최소. detent 밖으로는 안 나간다.
  function handleHandleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault()
        moveDetent(1)
        break
      case "ArrowDown":
        event.preventDefault()
        moveDetent(-1)
        break
      case "Home":
        event.preventDefault()
        onActiveDetentChange(
          orderedIds[orderedIds.length - 1] ?? activeDetentId
        )
        break
      case "End":
        event.preventDefault()
        onActiveDetentChange(orderedIds[0] ?? activeDetentId)
        break
    }
  }

  // Esc: dismissible 이면 어디에 포커스가 있든 시트를 닫는다(dialog 관례).
  function handleSheetKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && dismissible && onRequestClose) {
      event.preventDefault()
      onRequestClose()
    }
  }

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
      role="dialog"
      aria-modal={modal || undefined}
      aria-label={label}
      onKeyDown={handleSheetKeyDown}
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
          ref={handleRef}
          type="button"
          aria-label={handleLabel}
          aria-keyshortcuts="ArrowUp ArrowDown Escape"
          className="flex w-full max-w-24 cursor-grab touch-none items-center justify-center rounded-pill py-2 active:cursor-grabbing"
          onKeyDown={handleHandleKeyDown}
          onPointerDown={(event) => dragControls.start(event)}
        >
          <span className="h-1.5 w-10 rounded-pill bg-fill-neutral-strong" />
        </button>
      </div>
      {/* pb-safe: 하단 홈 인디케이터 회피(= max(space-4, safe-area-inset-bottom)).
       * 표면은 bottom-0 까지 붙고 padding 은 내부라 detent 수학(ratio→visible)에 무영향.
       * NOTE: 키보드 회피(포커스 입력을 키보드 위로)는 폼이 들어오는 P0 몫. 여기선 안 한다. */}
      <div className="min-h-0 flex-1 overflow-hidden px-4 pb-safe">
        {children}
      </div>
    </motion.section>
  )
}

export { ThreeStageSheet }
