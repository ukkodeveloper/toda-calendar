const touchFeedback = {
  type: "spring" as const,
  stiffness: 420,
  damping: 30,
  mass: 0.62,
}

const selectionFlow = {
  type: "spring" as const,
  stiffness: 460,
  damping: 38,
  mass: 0.8,
}

const dragFollow = {
  type: "spring" as const,
  stiffness: 500,
  damping: 42,
  mass: 0.76,
}

const floatingSheetEnter = {
  type: "spring" as const,
  stiffness: 300,
  damping: 34,
  mass: 0.96,
}

const floatingSheetDetent = {
  type: "spring" as const,
  stiffness: 360,
  damping: 38,
  mass: 0.94,
}

const floatingSheetResize = {
  type: "spring" as const,
  stiffness: 280,
  damping: 34,
  mass: 1.02,
}

const modePageSwap = {
  duration: 0.26,
  ease: [0.24, 1, 0.32, 1] as const,
}

const modeCellSwap = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1] as const,
}

const cellReveal = {
  type: "spring" as const,
  stiffness: 300,
  damping: 32,
  mass: 0.86,
}

export const motionTokens = {
  duration: {
    instant: 0.12,
    quick: 0.18,
    base: 0.24,
    emphasis: 0.32,
    screen: 0.42,
    sheetStageSync: 0.26,
  },
  ease: {
    enter: [0.22, 1, 0.36, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
    fade: [0.2, 0, 0, 1] as const,
  },
  spring: {
    sheet: floatingSheetDetent,
    press: touchFeedback,
    preview: cellReveal,
    drag: dragFollow,
    modeSwap: modePageSwap,
  },
  intent: {
    touchFeedback,
    selectionFlow,
    dragFollow,
    modePageSwap,
    modeCellSwap,
    cellReveal,
    floatingSheet: {
      enter: floatingSheetEnter,
      detent: floatingSheetDetent,
      resize: floatingSheetResize,
    },
  },
  gesture: {
    sheetDismissOffset: 120,
    sheetDismissVelocity: 700,
    sheetExpandOffset: 96,
    sheetCollapseOffset: 88,
  },
  preview: {
    photoAspectRatio: 4 / 5,
    doodleAspectRatio: 4 / 5,
    textPreviewLines: 3,
  },
} as const

export function getCalmTransition(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      duration: motionTokens.duration.instant,
      ease: motionTokens.ease.fade,
    }
  }

  return {
    duration: motionTokens.duration.base,
    ease: motionTokens.ease.enter,
  }
}
