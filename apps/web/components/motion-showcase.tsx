"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  AnimatePresence,
  LayoutGroup,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react"

import { buttonVariants } from "@workspace/ui/components/button"
import {
  getBackdropVariants,
  getCellRevealContainerVariants,
  getCellRevealItemVariants,
  getFloatingSheetVariants,
  getListContainerVariants,
  getListItemVariants,
  getModePageSwapVariants,
  getScreenSlideVariants,
  getToastVariants,
  mobileMotionPrinciples,
  mobileMotionTable,
  motionTokens,
} from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

type ScreenId = "calendar" | "agenda" | "insights"

type ToastState = {
  key: number
  message: string
}

const appScreens = [
  {
    id: "calendar" as const,
    label: "Calendar",
    eyebrow: "Primary",
    title: "Dates stay visually anchored",
  },
  {
    id: "agenda" as const,
    label: "Agenda",
    eyebrow: "Focus",
    title: "Daily list enters with quiet rhythm",
  },
  {
    id: "insights" as const,
    label: "Insights",
    eyebrow: "Summary",
    title: "State changes read as context, not spectacle",
  },
] as const

const mobileDays = [
  { day: "Mon", date: 14 },
  { day: "Tue", date: 15 },
  { day: "Wed", date: 16 },
  { day: "Thu", date: 17 },
  { day: "Fri", date: 18 },
  { day: "Sat", date: 19 },
  { day: "Sun", date: 20 },
] as const

const agendaCards = [
  {
    time: "09:30",
    title: "Stand-up",
    note: "List items settle in with 14px travel only.",
  },
  {
    time: "13:00",
    title: "Quiet block",
    note: "State changes should feel readable with one thumb.",
  },
  {
    time: "18:20",
    title: "Review notes",
    note: "Supportive transitions, no drama.",
  },
] as const

const sheetModes = [
  {
    id: "quick",
    label: "Quick",
    note: "Fast capture with only the essentials.",
  },
  {
    id: "balanced",
    label: "Balanced",
    note: "Default mode for everyday event creation.",
  },
  {
    id: "deep",
    label: "Deep",
    note: "Adds prep, reminders, and follow-up detail.",
  },
] as const

const reminderSeed = [
  {
    id: "reminder-1",
    time: "08:40",
    title: "Prepare agenda",
    note: "Inserted with list-cascade, then settled by layout spring.",
    tone: "bg-blue-500/14 text-blue-700 dark:bg-blue-500/18 dark:text-blue-200",
  },
  {
    id: "reminder-2",
    time: "11:10",
    title: "Leave for client lunch",
    note: "Dismissed cards fade and close without collapsing the list harshly.",
    tone: "bg-emerald-500/14 text-emerald-700 dark:bg-emerald-500/18 dark:text-emerald-200",
  },
  {
    id: "reminder-3",
    time: "15:20",
    title: "Review launch notes",
    note: "Toast confirms the action without stealing the whole screen.",
    tone: "bg-violet-500/14 text-violet-700 dark:bg-violet-500/18 dark:text-violet-200",
  },
  {
    id: "reminder-4",
    time: "18:00",
    title: "Send day summary",
    note: "Late-day feedback should feel light and disappear quickly.",
    tone: "bg-amber-500/16 text-amber-700 dark:bg-amber-500/18 dark:text-amber-200",
  },
] as const

const expressionStages = [
  {
    id: "photo" as const,
    label: "Photo",
    eyebrow: "Captured",
    title: "A raw visual memory",
    caption:
      "The first state should feel immediate and tactile, like a captured moment still sitting on top of the calendar.",
    surfaceClass:
      "bg-[linear-gradient(180deg,#eef4ff_0%,#dde9ff_48%,#d4e3ff_100%)] dark:bg-[linear-gradient(180deg,#192033_0%,#172338_52%,#132033_100%)]",
    accentClass:
      "bg-blue-500/15 text-blue-700 dark:bg-blue-500/18 dark:text-blue-200",
    cells: [
      {
        title: "Photo layer",
        body: "Full-frame visual gets the priority first.",
      },
      {
        title: "Context chip",
        body: "Time, weather, or place arrives after the swap.",
      },
      { title: "Mood tag", body: "Small metadata should settle in quietly." },
    ],
  },
  {
    id: "sketch" as const,
    label: "Sketch",
    eyebrow: "Interpreted",
    title: "The image becomes a doodled memory",
    caption:
      "The whole canvas should page-swap first, then sketch notes and stickers can appear per cell.",
    surfaceClass:
      "bg-[linear-gradient(180deg,#fff7e5_0%,#fff0cc_46%,#ffe8b5_100%)] dark:bg-[linear-gradient(180deg,#302412_0%,#332713_48%,#2b2212_100%)]",
    accentClass:
      "bg-amber-500/18 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    cells: [
      {
        title: "Brush note",
        body: "Loose marks feel hand-touched, not machine-perfect.",
      },
      {
        title: "Sticker cue",
        body: "Secondary elements reveal with a short 28-40ms stagger.",
      },
      {
        title: "Margin memo",
        body: "Doodles should not outrun the main surface swap.",
      },
    ],
  },
  {
    id: "sentence" as const,
    label: "Sentence",
    eyebrow: "Reflected",
    title: "The memory resolves into language",
    caption:
      "This final mode should still feel like the same artifact, only re-authored into text and compact cards.",
    surfaceClass:
      "bg-[linear-gradient(180deg,#f4f5f8_0%,#eceff5_48%,#e4e8f0_100%)] dark:bg-[linear-gradient(180deg,#161b25_0%,#171e2a_48%,#131a24_100%)]",
    accentClass:
      "bg-violet-500/15 text-violet-700 dark:bg-violet-500/18 dark:text-violet-200",
    cells: [
      {
        title: "Sentence card",
        body: "Primary phrase lands first and anchors the state.",
      },
      {
        title: "Keyword chip",
        body: "Keywords appear after the line, not with it.",
      },
      {
        title: "Memory note",
        body: "Support text arrives with the quietest reveal.",
      },
    ],
  },
] as const

function Surface({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        "rounded-[32px] border border-white/70 bg-white/84 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/72 dark:shadow-[0_24px_64px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      {children}
    </section>
  )
}

function PhoneFrame({
  eyebrow,
  title,
  note,
  children,
}: {
  eyebrow: string
  title: string
  note: string
  children: ReactNode
}) {
  return (
    <Surface className="p-4">
      <div className="mx-auto w-full max-w-[390px]">
        <div className="rounded-[40px] border border-slate-200/80 bg-slate-950 p-2 shadow-[0_30px_100px_rgba(15,23,42,0.18)] dark:border-white/10">
          <div className="relative min-h-[760px] overflow-hidden rounded-[34px] bg-[linear-gradient(180deg,#f8fafc_0%,#f3f6fa_42%,#eef3f8_100%)] text-slate-950 dark:bg-[linear-gradient(180deg,#101520_0%,#111827_45%,#0d1118_100%)] dark:text-slate-50">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center pt-3">
              <div className="h-7 w-32 rounded-full bg-black/85 dark:bg-white/12" />
            </div>
            <div className="relative z-10 flex min-h-[760px] flex-col pt-12">
              {children}
            </div>
          </div>
        </div>

        <div className="px-2 pt-4">
          <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase dark:text-slate-400">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {note}
          </p>
        </div>
      </div>
    </Surface>
  )
}

function MotionTokenTable() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[980px] table-auto border-separate border-spacing-y-2 text-left">
        <thead>
          <tr className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">
            <th className="px-3 py-2">Layer</th>
            <th className="px-3 py-2">Token</th>
            <th className="px-3 py-2">Motion</th>
            <th className="px-3 py-2">Mobile Usage</th>
            <th className="px-3 py-2">Guardrail</th>
            <th className="px-3 py-2">Reduced Motion</th>
          </tr>
        </thead>
        <tbody>
          {mobileMotionTable.map((row) => (
            <tr
              key={row.token}
              className="rounded-[20px] bg-slate-50 text-sm text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.03)] dark:bg-white/5 dark:text-slate-200"
            >
              <td className="rounded-l-[20px] px-3 py-3 font-semibold text-slate-500 dark:text-slate-400">
                {row.layer}
              </td>
              <td className="px-3 py-3 font-semibold">{row.token}</td>
              <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                {row.motion}
              </td>
              <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                {row.mobileUsage}
              </td>
              <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                {row.guardrail}
              </td>
              <td className="rounded-r-[20px] px-3 py-3 text-slate-600 dark:text-slate-300">
                {row.reducedMotion}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScreenFlowPhone() {
  const prefersReducedMotion = useReducedMotion() ?? false
  const [activeScreen, setActiveScreen] = useState<ScreenId>("calendar")
  const [direction, setDirection] = useState<1 | -1>(1)
  const [selectedDate, setSelectedDate] = useState(16)

  const changeScreen = (nextScreen: ScreenId) => {
    const currentIndex = appScreens.findIndex(
      (screen) => screen.id === activeScreen
    )
    const nextIndex = appScreens.findIndex((screen) => screen.id === nextScreen)

    if (nextIndex === currentIndex) {
      return
    }

    setDirection(nextIndex > currentIndex ? 1 : -1)
    setActiveScreen(nextScreen)
  }

  return (
    <PhoneFrame
      eyebrow="Demo 1"
      title="Screen slide + selection flow"
      note="모바일에서는 탭 전환과 날짜 선택이 가장 자주 반복되기 때문에, 이 둘의 리듬이 전체 앱의 인상을 결정합니다."
    >
      <div className="flex h-full flex-col px-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
              Monday, Apr 21
            </p>
            <h4 className="mt-1 text-[30px] font-semibold tracking-[-0.05em]">
              Today
            </h4>
          </div>
          <motion.button
            whileTap={{ scale: motionTokens.scale.press }}
            transition={motionTokens.spring.touch}
            className={buttonVariants({
              size: "icon-sm",
              className:
                "rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950",
            })}
            aria-label="Create new item"
          >
            +
          </motion.button>
        </div>

        <div className="mt-5 flex-1">
          <AnimatePresence custom={direction} initial={false} mode="wait">
            <motion.div
              key={activeScreen}
              custom={direction}
              variants={getScreenSlideVariants(prefersReducedMotion)}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-4"
            >
              {activeScreen === "calendar" ? (
                <>
                  <div className="rounded-[28px] bg-slate-950 px-4 py-4 text-white shadow-[0_18px_42px_rgba(15,23,42,0.18)] dark:bg-white/8">
                    <p className="text-xs tracking-[0.18em] text-slate-400 uppercase">
                      Month
                    </p>
                    <div className="mt-2 flex items-end justify-between">
                      <h5 className="text-2xl font-semibold tracking-[-0.03em]">
                        April 2026
                      </h5>
                      <span className="text-xs text-slate-400">
                        screen-slide
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      View swaps move only 24px so the user still feels inside
                      the same calendar layer.
                    </p>
                  </div>

                  <LayoutGroup id="mobile-day-selector">
                    <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-3 dark:border-white/10 dark:bg-white/6">
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {mobileDays.map((item) => {
                          const isSelected = selectedDate === item.date

                          return (
                            <motion.button
                              key={item.date}
                              whileTap={{ scale: motionTokens.scale.press }}
                              transition={motionTokens.spring.touch}
                              onClick={() => setSelectedDate(item.date)}
                              className={cn(
                                "relative min-w-[74px] rounded-[22px] px-3 py-3 text-center",
                                isSelected
                                  ? "text-white"
                                  : "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-200"
                              )}
                            >
                              {isSelected ? (
                                <motion.div
                                  layoutId="selected-date-surface"
                                  transition={motionTokens.spring.selection}
                                  className="absolute inset-0 rounded-[22px] bg-[linear-gradient(180deg,#3978ff_0%,#2557da_100%)]"
                                />
                              ) : null}
                              <div className="relative z-10">
                                <p className="text-[11px] font-semibold tracking-[0.18em] text-current/70 uppercase">
                                  {item.day}
                                </p>
                                <p className="mt-1 text-lg font-semibold tracking-[-0.03em]">
                                  {item.date}
                                </p>
                              </div>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  </LayoutGroup>

                  <div className="grid gap-3">
                    {[
                      {
                        title: "Design review",
                        note: "Selection should move as a surface, not blink as separate elements.",
                      },
                      {
                        title: "Quiet block",
                        note: "Touch response is fast enough to trust with one thumb.",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-[26px] border border-slate-200/80 bg-white/90 p-4 dark:border-white/10 dark:bg-white/6"
                      >
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {activeScreen === "agenda" ? (
                <motion.div
                  variants={getListContainerVariants(prefersReducedMotion)}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {agendaCards.map((item) => (
                    <motion.div
                      key={item.title}
                      variants={getListItemVariants(prefersReducedMotion)}
                      className="rounded-[26px] border border-slate-200/80 bg-white/92 p-4 dark:border-white/10 dark:bg-white/6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {item.note}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:bg-white/6 dark:text-slate-400">
                          {item.time}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : null}

              {activeScreen === "insights" ? (
                <div className="space-y-3">
                  <div className="rounded-[28px] bg-slate-950 p-5 text-white dark:bg-white/8">
                    <p className="text-xs tracking-[0.18em] text-slate-400 uppercase">
                      Summary
                    </p>
                    <h5 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                      78%
                    </h5>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Insight cards still follow the same navigation rhythm so
                      the app feels coherent across tabs.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Completed", value: "6" },
                      { label: "Remaining", value: "3" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 dark:border-white/10 dark:bg-white/6"
                      >
                        <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <LayoutGroup id="mobile-bottom-tabs">
          <div className="mt-auto rounded-[28px] border border-white/70 bg-white/80 p-2 shadow-[0_-12px_36px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/8">
            <div className="grid grid-cols-3 gap-1">
              {appScreens.map((screen) => {
                const isSelected = activeScreen === screen.id

                return (
                  <motion.button
                    key={screen.id}
                    whileTap={{ scale: motionTokens.scale.press }}
                    transition={motionTokens.spring.touch}
                    onClick={() => changeScreen(screen.id)}
                    className="relative rounded-[22px] px-3 py-3 text-sm font-medium"
                  >
                    {isSelected ? (
                      <motion.div
                        layoutId="mobile-nav-surface"
                        transition={motionTokens.spring.selection}
                        className="absolute inset-0 rounded-[22px] bg-slate-950 dark:bg-white"
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10",
                        isSelected
                          ? "text-white dark:text-slate-950"
                          : "text-slate-500 dark:text-slate-300"
                      )}
                    >
                      {screen.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </LayoutGroup>
      </div>
    </PhoneFrame>
  )
}

function SheetPhone() {
  const prefersReducedMotion = useReducedMotion() ?? false
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] =
    useState<(typeof sheetModes)[number]["id"]>("balanced")
  const dragY = useMotionValue(0)
  const sheetScale = useTransform(dragY, [0, 240], [1, 0.986])
  const backdropOpacity = useTransform(dragY, [0, 240], [1, 0])

  const openSheet = () => {
    dragY.set(0)
    setIsOpen(true)
  }

  return (
    <PhoneFrame
      eyebrow="Demo 2"
      title="Floating bottom sheet"
      note="핵심 액션용 시트라면 단순한 bottom sheet보다 살짝 떠 있는 레이어처럼 느껴져야 합니다. Apple의 calm함과 Toss의 crisp함이 함께 살아야 하는 구간입니다."
    >
      <div className="relative flex h-full flex-col px-4 pb-4">
        <div className="rounded-[30px] bg-slate-950 px-4 py-5 text-white shadow-[0_18px_42px_rgba(15,23,42,0.18)] dark:bg-white/8">
          <p className="text-xs tracking-[0.18em] text-slate-400 uppercase">
            Day detail
          </p>
          <h4 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            Product sync
          </h4>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Open the sheet, then drag it downward. It should track the finger
            directly and only spring back on release.
          </p>
          <motion.button
            whileTap={{ scale: motionTokens.scale.press }}
            transition={motionTokens.spring.touch}
            onClick={openSheet}
            className={buttonVariants({
              size: "sm",
              className:
                "mt-4 rounded-full bg-white text-slate-950 hover:bg-white/90",
            })}
          >
            Open quick add
          </motion.button>
        </div>

        <div className="mt-4 space-y-3">
          {[
            "Reminder stays secondary to the main day context.",
            "Sheet enters from the bottom, never from nowhere.",
            "Dismiss motion should be faster than present motion.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300"
            >
              {item}
            </div>
          ))}
        </div>

        <AnimatePresence>
          {isOpen ? (
            <>
              <motion.div
                variants={getBackdropVariants(prefersReducedMotion)}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 bg-slate-950/28"
                style={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: backdropOpacity }
                }
                onClick={() => setIsOpen(false)}
              />

              <motion.div
                variants={getFloatingSheetVariants(prefersReducedMotion)}
                initial="enter"
                animate="center"
                exit="exit"
                drag={prefersReducedMotion ? false : "y"}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.14}
                onDragEnd={(_, info) => {
                  if (
                    prefersReducedMotion ||
                    info.offset.y > 130 ||
                    info.velocity.y > 900
                  ) {
                    dragY.set(0)
                    setIsOpen(false)
                    return
                  }

                  animate(dragY, 0, motionTokens.spring.drag)
                }}
                style={
                  prefersReducedMotion
                    ? undefined
                    : { y: dragY, scale: sheetScale }
                }
                className="absolute inset-x-2 bottom-2 rounded-[32px] border border-white/80 bg-white/96 p-4 shadow-[0_28px_80px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-zinc-950/96"
              >
                <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200 dark:bg-white/12" />

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                      floating-sheet
                    </p>
                    <h5 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                      Quick add
                    </h5>
                  </div>
                  <motion.button
                    whileTap={{ scale: motionTokens.scale.press }}
                    transition={motionTokens.spring.touch}
                    onClick={() => setIsOpen(false)}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon-sm",
                      className: "rounded-full",
                    })}
                    aria-label="Close sheet"
                  >
                    ✕
                  </motion.button>
                </div>

                <LayoutGroup id="sheet-mode-selector">
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-[24px] bg-slate-100 p-1 dark:bg-white/5">
                    {sheetModes.map((item) => {
                      const isSelected = mode === item.id

                      return (
                        <motion.button
                          key={item.id}
                          whileTap={{ scale: motionTokens.scale.press }}
                          transition={motionTokens.spring.touch}
                          onClick={() => setMode(item.id)}
                          className="relative rounded-[20px] px-3 py-2 text-sm font-medium"
                        >
                          {isSelected ? (
                            <motion.div
                              layoutId="sheet-mode-surface"
                              transition={motionTokens.spring.selection}
                              className="absolute inset-0 rounded-[20px] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:bg-white/10"
                            />
                          ) : null}
                          <span className="relative z-10">{item.label}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </LayoutGroup>

                <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {sheetModes.find((item) => item.id === mode)?.note}
                </p>

                <motion.div
                  variants={getListContainerVariants(prefersReducedMotion)}
                  initial="hidden"
                  animate="visible"
                  className="mt-4 space-y-2"
                >
                  {[
                    {
                      label: "Reminder",
                      value:
                        mode === "deep" ? "15 min before" : "At start time",
                    },
                    {
                      label: "Prep link",
                      value: mode === "quick" ? "Skip" : "Attach meeting doc",
                    },
                    {
                      label: "Follow-up",
                      value:
                        mode === "balanced"
                          ? "Optional"
                          : mode === "deep"
                            ? "Capture next actions"
                            : "Hidden",
                    },
                  ].map((row) => (
                    <motion.div
                      key={row.label}
                      variants={getListItemVariants(prefersReducedMotion)}
                      className="flex items-center justify-between rounded-[22px] border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/4"
                    >
                      <p className="text-sm font-medium">{row.label}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {row.value}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </PhoneFrame>
  )
}

function ExpressionMorphPhone() {
  const prefersReducedMotion = useReducedMotion() ?? false
  const [stageIndex, setStageIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const lastTapAt = useRef(0)

  const activeStage = expressionStages[stageIndex]!

  const goNext = () => {
    setDirection(1)
    setStageIndex(
      (currentIndex) => (currentIndex + 1) % expressionStages.length
    )
  }

  const handleStageTap = () => {
    const now = performance.now()

    if (now - lastTapAt.current < 280) {
      lastTapAt.current = 0
      goNext()
      return
    }

    lastTapAt.current = now
  }

  return (
    <PhoneFrame
      eyebrow="Demo 4"
      title="Photo -> sketch -> sentence"
      note="이 전환은 그냥 콘텐츠만 바뀌면 안 되고, 아티팩트 전체가 한 페이지 넘어가듯 바뀐 뒤 각 셀이 후속으로 드러나야 합니다."
    >
      <div className="flex h-full flex-col px-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
              Double tap core flow
            </p>
            <h4 className="mt-1 text-[28px] font-semibold tracking-[-0.05em]">
              Memory expression
            </h4>
          </div>
          <motion.button
            whileTap={{ scale: motionTokens.scale.press }}
            transition={motionTokens.spring.touch}
            onClick={goNext}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className:
                "rounded-full border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-white/6",
            })}
          >
            Next
          </motion.button>
        </div>

        <div className="mt-4 rounded-[24px] border border-slate-200/80 bg-white/88 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
          Double tap the card below. The whole surface should swap first with
          <span className="mx-1 font-semibold text-slate-900 dark:text-slate-100">
            mode-page-swap
          </span>
          and then each cell should arrive with
          <span className="mx-1 font-semibold text-slate-900 dark:text-slate-100">
            cell-reveal
          </span>
          .
        </div>

        <div className="mt-4 flex-1">
          <AnimatePresence custom={direction} initial={false} mode="wait">
            <motion.button
              key={activeStage.id}
              type="button"
              custom={direction}
              variants={getModePageSwapVariants(prefersReducedMotion)}
              initial="enter"
              animate="center"
              exit="exit"
              onPointerUp={handleStageTap}
              className={cn(
                "w-full touch-manipulation rounded-[32px] border border-slate-200/80 p-4 text-left shadow-[0_18px_42px_rgba(15,23,42,0.08)] dark:border-white/10",
                activeStage.surfaceClass
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                    {activeStage.eyebrow}
                  </p>
                  <h5 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                    {activeStage.label}
                  </h5>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase",
                    activeStage.accentClass
                  )}
                >
                  {activeStage.id}
                </span>
              </div>

              <div className="mt-4 rounded-[28px] border border-white/60 bg-white/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
                {activeStage.id === "photo" ? (
                  <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#91c1ff_0%,#5f86ff_42%,#2b4db8_100%)] p-5 text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_30%)]" />
                    <div className="relative">
                      <p className="text-xs tracking-[0.18em] text-white/70 uppercase">
                        Raw capture
                      </p>
                      <p className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                        Rain on the station window
                      </p>
                    </div>
                  </div>
                ) : null}

                {activeStage.id === "sketch" ? (
                  <div className="relative overflow-hidden rounded-[24px] bg-[#fff5da] p-5 dark:bg-[#2e2414]">
                    <div className="absolute inset-0 opacity-70">
                      <div className="absolute top-6 left-5 h-0.5 w-32 rotate-[8deg] rounded-full bg-[#6f4b11]" />
                      <div className="absolute top-14 left-14 h-0.5 w-24 -rotate-[6deg] rounded-full bg-[#6f4b11]" />
                      <div className="absolute top-8 right-8 h-20 w-20 rounded-full border-2 border-dashed border-[#c7902a]" />
                    </div>
                    <div className="relative">
                      <p className="text-xs tracking-[0.18em] text-[#8c6116] uppercase dark:text-[#efcb86]">
                        Doodled layer
                      </p>
                      <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#4b3510] dark:text-[#fff3d8]">
                        Umbrella, coffee, fast footsteps
                      </p>
                    </div>
                  </div>
                ) : null}

                {activeStage.id === "sentence" ? (
                  <div className="rounded-[24px] bg-slate-950 p-5 text-white dark:bg-white/10">
                    <p className="text-xs tracking-[0.18em] text-slate-400 uppercase">
                      Sentence layer
                    </p>
                    <p className="mt-3 text-xl leading-8 font-semibold tracking-[-0.04em]">
                      “비가 쏟아졌지만, 오늘 하루는 이상하게 가벼웠다.”
                    </p>
                  </div>
                ) : null}

                <motion.div
                  variants={getCellRevealContainerVariants(
                    prefersReducedMotion
                  )}
                  initial="hidden"
                  animate="visible"
                  className="mt-3 grid gap-2"
                >
                  {activeStage.cells.map((cell) => (
                    <motion.div
                      key={`${activeStage.id}-${cell.title}`}
                      variants={getCellRevealItemVariants(prefersReducedMotion)}
                      className="rounded-[22px] border border-slate-200/80 bg-white/88 px-4 py-3 dark:border-white/10 dark:bg-white/6"
                    >
                      <p className="text-sm font-semibold">{cell.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {cell.body}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {activeStage.caption}
              </p>
            </motion.button>
          </AnimatePresence>
        </div>
      </div>
    </PhoneFrame>
  )
}

function FeedbackPhone() {
  const prefersReducedMotion = useReducedMotion() ?? false
  const [items, setItems] = useState(() =>
    reminderSeed.slice(0, 3).map((item, index) => ({
      ...item,
      key: `${item.id}-${index}`,
    }))
  )
  const [cursor, setCursor] = useState(3)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [toastCounter, setToastCounter] = useState(0)

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeoutId = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const addReminder = () => {
    const nextItem = reminderSeed[cursor % reminderSeed.length]!
    const nextToastKey = toastCounter + 1

    setItems((currentItems) => [
      ...currentItems.slice(-3),
      {
        ...nextItem,
        key: `${nextItem.id}-${cursor}`,
      },
    ])
    setCursor((currentCursor) => currentCursor + 1)
    setToastCounter(nextToastKey)
    setToast({
      key: nextToastKey,
      message: "Reminder added quietly with list-cascade.",
    })
  }

  const completeReminder = (key: string, title: string) => {
    const nextToastKey = toastCounter + 1

    setItems((currentItems) => currentItems.filter((item) => item.key !== key))
    setToastCounter(nextToastKey)
    setToast({
      key: nextToastKey,
      message: `${title} completed.`,
    })
  }

  return (
    <PhoneFrame
      eyebrow="Demo 3"
      title="List cascade + toast confirm"
      note="모바일 피드백은 화면을 장악하면 안 됩니다. 리스트는 제자리에서 정리되고, 토스트는 짧게 확인만 해주는 쪽이 좋습니다."
    >
      <div className="relative flex h-full flex-col px-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
              Follow-up
            </p>
            <h4 className="mt-1 text-[28px] font-semibold tracking-[-0.05em]">
              Reminders
            </h4>
          </div>
          <motion.button
            whileTap={{ scale: motionTokens.scale.press }}
            transition={motionTokens.spring.touch}
            onClick={addReminder}
            className={buttonVariants({
              size: "sm",
              className: "rounded-full",
            })}
          >
            Add
          </motion.button>
        </div>

        <motion.div layout className="mt-5 space-y-3">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.key}
                layout
                variants={getListItemVariants(prefersReducedMotion)}
                initial="hidden"
                animate="visible"
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -8, scale: motionTokens.scale.settle }
                }
                transition={motionTokens.spring.content}
                className="rounded-[26px] border border-slate-200/80 bg-white/92 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/6"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase",
                      item.tone
                    )}
                  >
                    {item.time}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {item.note}
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: motionTokens.scale.press }}
                    transition={motionTokens.spring.touch}
                    onClick={() => completeReminder(item.key, item.title)}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon-sm",
                      className: "rounded-full",
                    })}
                    aria-label={`Complete ${item.title}`}
                  >
                    ✓
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="mt-auto rounded-[28px] border border-slate-200/80 bg-white/88 p-4 dark:border-white/10 dark:bg-white/6">
          <p className="text-sm font-semibold">Feedback rule</p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Completion should not reset the whole screen. Remove the card, keep
            the layout stable, then confirm with a short toast.
          </p>
        </div>

        <AnimatePresence>
          {toast ? (
            <motion.div
              key={toast.key}
              variants={getToastVariants(prefersReducedMotion)}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-x-4 bottom-24 rounded-[22px] bg-slate-950 px-4 py-3 text-white shadow-[0_24px_56px_rgba(15,23,42,0.2)] dark:bg-white dark:text-slate-950"
            >
              <p className="text-sm font-medium">{toast.message}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </PhoneFrame>
  )
}

export function MotionShowcase() {
  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(67,111,255,0.18),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef3f8_50%,#ebf0f5_100%)] px-4 py-5 text-slate-950 sm:px-6 sm:py-6 lg:px-8 dark:bg-[radial-gradient(circle_at_top,rgba(84,125,255,0.18),transparent_28%),linear-gradient(180deg,#0a0d14_0%,#0e121a_44%,#101622_100%)] dark:text-slate-50">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
        <Surface className="overflow-hidden p-0">
          <div className="relative px-5 py-8 sm:px-8 sm:py-10">
            <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_18%_0%,rgba(68,123,255,0.18),transparent_50%),radial-gradient(circle_at_82%_8%,rgba(15,23,42,0.08),transparent_30%)] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(99,143,255,0.22),transparent_46%),radial-gradient(circle_at_82%_8%,rgba(255,255,255,0.05),transparent_28%)]" />
            <div className="relative z-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <p className="text-sm font-medium tracking-[0.24em] text-slate-500 uppercase dark:text-slate-400">
                  Toda Mobile Motion System
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl">
                  Mobile-first motion tokens for a calm calendar app.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                  The token system is now rebuilt around phone-native patterns:
                  direct touch feedback, shared selection surfaces, short screen
                  transitions, bottom sheets, drag-follow gestures, list
                  insertion, and lightweight confirmation toasts.
                </p>
              </div>

              <div className="grid gap-3">
                {mobileMotionPrinciples.map((principle) => (
                  <div
                    key={principle}
                    className="rounded-[26px] border border-slate-200/70 bg-white/84 p-4 text-sm leading-6 text-slate-600 shadow-[0_16px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/6 dark:text-slate-300"
                  >
                    {principle}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Surface>

        <Surface>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase dark:text-slate-400">
                Token Matrix
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
                모바일 토큰 표
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                이 표를 기준으로 “어떤 상황에 어떤 모션을 쓰는지”를 관리하면,
                새로운 화면을 만들 때도 리듬이 흔들리지 않습니다.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                이번에 핵심 케이스용으로
                <span className="mx-1 font-semibold text-slate-900 dark:text-slate-100">
                  floating-sheet
                </span>
                ,
                <span className="mx-1 font-semibold text-slate-900 dark:text-slate-100">
                  mode-page-swap
                </span>
                ,
                <span className="mx-1 font-semibold text-slate-900 dark:text-slate-100">
                  cell-reveal
                </span>
                을 추가했습니다.
              </p>
            </div>
            <MotionTokenTable />
          </div>
        </Surface>

        <div className="grid gap-6 xl:grid-cols-4">
          <ScreenFlowPhone />
          <SheetPhone />
          <ExpressionMorphPhone />
          <FeedbackPhone />
        </div>
      </div>
    </main>
  )
}
