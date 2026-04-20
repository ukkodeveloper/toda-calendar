import type { Transition, Variants } from "motion/react"

export const motionTokens = {
  duration: {
    tap: 0.14,
    fast: 0.18,
    default: 0.24,
    navigation: 0.3,
    modeSwap: 0.34,
    sheet: 0.38,
    floatingSheet: 0.42,
    toast: 0.18,
  },
  ease: {
    standard: [0.22, 1, 0.36, 1],
    emphasized: [0.16, 1, 0.3, 1],
    exit: [0.4, 0, 1, 1],
    linear: [0, 0, 1, 1],
  },
  spring: {
    touch: {
      type: "spring",
      stiffness: 560,
      damping: 36,
      mass: 0.66,
    } satisfies Transition,
    selection: {
      type: "spring",
      stiffness: 430,
      damping: 34,
      mass: 0.82,
    } satisfies Transition,
    content: {
      type: "spring",
      stiffness: 360,
      damping: 32,
      mass: 0.88,
    } satisfies Transition,
    navigation: {
      type: "spring",
      stiffness: 320,
      damping: 30,
      mass: 0.92,
    } satisfies Transition,
    sheet: {
      type: "spring",
      stiffness: 250,
      damping: 30,
      mass: 0.98,
    } satisfies Transition,
    floatingSheet: {
      type: "spring",
      stiffness: 235,
      damping: 28,
      mass: 1.02,
    } satisfies Transition,
    drag: {
      type: "spring",
      stiffness: 340,
      damping: 29,
      mass: 0.94,
    } satisfies Transition,
    modeSwap: {
      type: "spring",
      stiffness: 305,
      damping: 31,
      mass: 0.92,
    } satisfies Transition,
    cell: {
      type: "spring",
      stiffness: 390,
      damping: 30,
      mass: 0.84,
    } satisfies Transition,
  },
  transition: {
    fade: {
      duration: 0.18,
      ease: [0.22, 1, 0.36, 1],
    } satisfies Transition,
    default: {
      duration: 0.24,
      ease: [0.22, 1, 0.36, 1],
    } satisfies Transition,
    navigationExit: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1],
    } satisfies Transition,
    toast: {
      duration: 0.18,
      ease: [0.16, 1, 0.3, 1],
    } satisfies Transition,
    modeSwapExit: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    } satisfies Transition,
  },
  stagger: {
    compact: 0.03,
    relaxed: 0.045,
  },
  scale: {
    press: 0.97,
    settle: 0.992,
  },
  distance: {
    micro: 4,
    chip: 10,
    card: 14,
    screen: 24,
    mode: 26,
    sheet: 36,
    floatingSheet: 28,
    cell: 12,
    toast: 16,
  },
} as const

export const mobileMotionPrinciples = [
  "모션은 장식을 만들기보다 계층과 맥락을 설명해야 한다.",
  "터치 피드백은 거의 보이지 않을 정도로 빠르되, 신뢰감 있게 눌려야 한다.",
  "화면 전환과 시트는 짧은 거리만 이동해 한 손 사용 흐름을 깨지 않아야 한다.",
  "Reduced Motion에서는 이동량보다 opacity, tint, highlight를 우선 사용한다.",
] as const

export type MobileMotionTokenRow = {
  layer:
    | "Touch"
    | "Selection"
    | "Navigation"
    | "Surface"
    | "Feedback"
    | "Gesture"
  token: string
  motion: string
  mobileUsage: string
  guardrail: string
  reducedMotion: string
}

export const mobileMotionTable = [
  {
    layer: "Touch",
    token: "touch-feedback",
    motion: "spring 560/36 + scale 0.97",
    mobileUsage: "하단 탭, 날짜 셀, 아이콘 버튼, CTA, 토글",
    guardrail: "y 이동이나 glow를 겹쳐 넣지 않는다.",
    reducedMotion: "scale 제거, 색과 opacity 변화만 유지",
  },
  {
    layer: "Selection",
    token: "selection-flow",
    motion: "shared layout + spring 430/34",
    mobileUsage: "세그먼트 컨트롤, 활성 탭, 선택된 날짜, 필터 칩",
    guardrail: "선택 배경을 remount 하지 말고 surface를 이동시킨다.",
    reducedMotion: "crossfade 하이라이트",
  },
  {
    layer: "Navigation",
    token: "screen-slide",
    motion: "x 24px + spring 320/30 + scale 0.992",
    mobileUsage: "탭 내용 전환, 캘린더 뷰 전환, 경량 detail push",
    guardrail: "32px 이상 이동하거나 bounce를 넣지 않는다.",
    reducedMotion: "opacity crossfade",
  },
  {
    layer: "Surface",
    token: "sheet-stack",
    motion: "y 36px + spring 250/30 + backdrop fade",
    mobileUsage: "바텀시트, quick add composer, 필터 패널, day details",
    guardrail: "센터 팝업처럼 보이게 scale을 크게 주지 않는다.",
    reducedMotion: "fade + shadow only",
  },
  {
    layer: "Surface",
    token: "floating-sheet",
    motion: "y 28px + scale 0.988 + spring 235/28",
    mobileUsage: "핵심 quick-add, detail peek, safe-area 위에 뜨는 바텀시트",
    guardrail: "전체 화면을 덮는 풀스크린 시트처럼 움직이지 않는다.",
    reducedMotion: "fade + shadow + detent snap only",
  },
  {
    layer: "Gesture",
    token: "drag-follow",
    motion: "direct finger tracking + spring settle on release",
    mobileUsage: "시트 drag-dismiss, swipe action, pull reveal",
    guardrail: "손가락보다 늦게 따라오는 easing을 쓰지 않는다.",
    reducedMotion: "drag threshold를 줄이고 즉시 snap",
  },
  {
    layer: "Navigation",
    token: "mode-page-swap",
    motion: "x 26px + scale 0.992 + spring 305/31",
    mobileUsage: "photo -> sketch -> sentence 같은 전면 모드 전환",
    guardrail:
      "단순 crossfade만으로 끝내지 않고 전체 표면이 넘어가듯 바뀌게 한다.",
    reducedMotion: "opacity crossfade + content replace",
  },
  {
    layer: "Feedback",
    token: "list-cascade",
    motion: "stagger 30-45ms + y 14px settle",
    mobileUsage: "agenda rows, reminder cards, quick add 결과 목록",
    guardrail: "여러 행을 동시에 크게 움직이지 않는다.",
    reducedMotion: "opacity stagger",
  },
  {
    layer: "Feedback",
    token: "cell-reveal",
    motion: "stagger 28-40ms + y 12px + spring 390/30",
    mobileUsage: "모드 전환 후 각 셀/칩/문장 조각 등장",
    guardrail: "페이지 전체 전환보다 더 과하게 튀지 않게 한다.",
    reducedMotion: "opacity stagger + instant layout",
  },
  {
    layer: "Feedback",
    token: "toast-confirm",
    motion: "y 16px + 180ms fade/settle",
    mobileUsage: "저장 완료, 완료 처리, undo 가능한 snackbar",
    guardrail: "2초 이상 떠 있거나 화면 중심을 가리지 않는다.",
    reducedMotion: "fade only",
  },
] as const satisfies readonly MobileMotionTokenRow[]

export function getScreenSlideVariants(
  prefersReducedMotion: boolean
): Variants {
  if (prefersReducedMotion) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1, transition: motionTokens.transition.fade },
      exit: { opacity: 0, transition: motionTokens.transition.navigationExit },
    }
  }

  return {
    enter: (direction: 1 | -1) => ({
      opacity: 0.56,
      x:
        direction > 0
          ? motionTokens.distance.screen
          : -motionTokens.distance.screen,
      scale: motionTokens.scale.settle,
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: motionTokens.spring.navigation,
    },
    exit: (direction: 1 | -1) => ({
      opacity: 0,
      x:
        direction > 0
          ? -motionTokens.distance.card
          : motionTokens.distance.card,
      transition: motionTokens.transition.navigationExit,
    }),
  }
}

export function getSheetStackVariants(prefersReducedMotion: boolean): Variants {
  if (prefersReducedMotion) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1, transition: motionTokens.transition.fade },
      exit: { opacity: 0, transition: motionTokens.transition.navigationExit },
    }
  }

  return {
    enter: {
      opacity: 0,
      y: motionTokens.distance.sheet,
      scale: motionTokens.scale.settle,
    },
    center: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: motionTokens.spring.sheet,
    },
    exit: {
      opacity: 0,
      y: motionTokens.distance.card,
      transition: motionTokens.transition.navigationExit,
    },
  }
}

export function getFloatingSheetVariants(
  prefersReducedMotion: boolean
): Variants {
  if (prefersReducedMotion) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1, transition: motionTokens.transition.fade },
      exit: { opacity: 0, transition: motionTokens.transition.navigationExit },
    }
  }

  return {
    enter: {
      opacity: 0,
      y: motionTokens.distance.floatingSheet,
      scale: 0.988,
    },
    center: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: motionTokens.spring.floatingSheet,
    },
    exit: {
      opacity: 0,
      y: motionTokens.distance.card,
      scale: motionTokens.scale.settle,
      transition: motionTokens.transition.navigationExit,
    },
  }
}

export function getBackdropVariants(prefersReducedMotion: boolean): Variants {
  if (prefersReducedMotion) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1, transition: motionTokens.transition.fade },
      exit: { opacity: 0, transition: motionTokens.transition.navigationExit },
    }
  }

  return {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: motionTokens.transition.fade },
    exit: { opacity: 0, transition: motionTokens.transition.navigationExit },
  }
}

export function getListContainerVariants(
  prefersReducedMotion: boolean
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion
          ? motionTokens.stagger.compact
          : motionTokens.stagger.relaxed,
        delayChildren: 0.03,
      },
    },
  }
}

export function getListItemVariants(prefersReducedMotion: boolean): Variants {
  if (prefersReducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: motionTokens.transition.fade },
    }
  }

  return {
    hidden: {
      opacity: 0,
      y: motionTokens.distance.card,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: motionTokens.spring.content,
    },
  }
}

export function getModePageSwapVariants(
  prefersReducedMotion: boolean
): Variants {
  if (prefersReducedMotion) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1, transition: motionTokens.transition.fade },
      exit: { opacity: 0, transition: motionTokens.transition.modeSwapExit },
    }
  }

  return {
    enter: (direction: 1 | -1) => ({
      opacity: 0.6,
      x:
        direction > 0
          ? motionTokens.distance.mode
          : -motionTokens.distance.mode,
      scale: motionTokens.scale.settle,
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: motionTokens.spring.modeSwap,
    },
    exit: (direction: 1 | -1) => ({
      opacity: 0,
      x:
        direction > 0
          ? -motionTokens.distance.card
          : motionTokens.distance.card,
      scale: motionTokens.scale.settle,
      transition: motionTokens.transition.modeSwapExit,
    }),
  }
}

export function getCellRevealContainerVariants(
  prefersReducedMotion: boolean
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0.028 : 0.04,
        delayChildren: 0.05,
      },
    },
  }
}

export function getCellRevealItemVariants(
  prefersReducedMotion: boolean
): Variants {
  if (prefersReducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: motionTokens.transition.fade },
    }
  }

  return {
    hidden: {
      opacity: 0,
      y: motionTokens.distance.cell,
      scale: motionTokens.scale.settle,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: motionTokens.spring.cell,
    },
  }
}

export function getToastVariants(prefersReducedMotion: boolean): Variants {
  if (prefersReducedMotion) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1, transition: motionTokens.transition.toast },
      exit: { opacity: 0, transition: motionTokens.transition.navigationExit },
    }
  }

  return {
    enter: {
      opacity: 0,
      y: motionTokens.distance.toast,
      scale: motionTokens.scale.settle,
    },
    center: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: motionTokens.spring.content,
    },
    exit: {
      opacity: 0,
      y: motionTokens.distance.micro,
      transition: motionTokens.transition.navigationExit,
    },
  }
}
