"use client"

import * as React from "react"
import {
  AnimatePresence,
  LayoutGroup,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "framer-motion"
import { createPortal } from "react-dom"

import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

import type { CalendarDayRecord, ContentType, EditorDraft } from "../model/types"
import {
  createSessionPhotoSlot,
  releaseSessionPhotoSlot,
} from "../utils/session-photo"
import { parseIsoDate } from "../utils/date"
import {
  floatingSheetUi,
  getDockHandoffFrame,
  getFloatingSheetDetents,
} from "../utils/sheet-detents"
import { calendarInteractionUi } from "../utils/interactions"
import { DoodleCanvas } from "./doodle-canvas"
import { PhotoEditor } from "./photo-editor"
import { TextEditor } from "./text-editor"

const editorTabs: Array<{ value: ContentType; label: string }> = [
  { value: "photo", label: "Photo" },
  { value: "doodle", label: "Sketch" },
  { value: "text", label: "Text" },
]

type SheetStage = "peek" | "expanded"

type DayEditorSheetProps = {
  initialLift?: number
  onOpenChange: (open: boolean) => void
  onSave: (record: CalendarDayRecord) => Promise<void> | void
  open: boolean
  record: CalendarDayRecord | null
}

export function DayEditorSheet({
  initialLift = 0,
  onOpenChange,
  onSave,
  open,
  record,
}: DayEditorSheetProps) {
  const reducedMotion = useReducedMotion()
  const dragControls = useDragControls()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [mounted, setMounted] = React.useState(false)
  const [draft, setDraft] = React.useState<EditorDraft | null>(record)
  const [activeTab, setActiveTab] = React.useState<ContentType>(
    record?.currentPreviewType ?? "photo"
  )
  const [stage, setStage] = React.useState<SheetStage>("peek")
  const [contentStage, setContentStage] = React.useState<SheetStage>("peek")
  const [isDrawing, setIsDrawing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [viewportWidth, setViewportWidth] = React.useState(393)
  const [viewportHeight, setViewportHeight] = React.useState(780)
  const [viewportBottomInset, setViewportBottomInset] = React.useState(0)
  const stageTimerRef = React.useRef<number | null>(null)
  const latestDraftRef = React.useRef<EditorDraft | null>(record)
  const latestRecordRef = React.useRef(record)
  const dockLaunchFrame = getDockHandoffFrame(initialLift, viewportWidth)
  const dockExitFrame = getDockHandoffFrame(0, viewportWidth)
  const { expanded: expandedFrame, peek: peekFrame } = getFloatingSheetDetents({
    bottomInset: viewportBottomInset,
    height: viewportHeight,
    width: viewportWidth,
  })

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    return () => {
      if (stageTimerRef.current !== null) {
        window.clearTimeout(stageTimerRef.current)
      }

      const draftPhoto = latestDraftRef.current?.photo
      const persistedPhoto = latestRecordRef.current?.photo

      if (draftPhoto?.src !== persistedPhoto?.src) {
        releaseSessionPhotoSlot(draftPhoto)
      }
    }
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const syncViewport = () => {
      const nextWidth = window.visualViewport?.width ?? window.innerWidth
      const nextHeight = window.visualViewport?.height ?? window.innerHeight
      const nextBottomInset = Math.max(
        0,
        window.innerHeight -
          ((window.visualViewport?.height ?? window.innerHeight) +
            (window.visualViewport?.offsetTop ?? 0))
      )

      setViewportWidth(nextWidth)
      setViewportHeight(nextHeight)
      setViewportBottomInset(nextBottomInset)
    }

    syncViewport()
    window.addEventListener("resize", syncViewport)
    window.visualViewport?.addEventListener("resize", syncViewport)
    window.visualViewport?.addEventListener("scroll", syncViewport)

    return () => {
      window.removeEventListener("resize", syncViewport)
      window.visualViewport?.removeEventListener("resize", syncViewport)
      window.visualViewport?.removeEventListener("scroll", syncViewport)
    }
  }, [])

  React.useEffect(() => {
    setDraft((current) => {
      if (current?.photo?.src !== record?.photo?.src) {
        releaseSessionPhotoSlot(current?.photo)
      }

      return record
    })

    if (record) {
      setActiveTab(record.currentPreviewType)
      setStage("peek")
      setContentStage("peek")
      x.set(0)
      y.set(0)
    }
  }, [record, x, y])

  React.useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  React.useEffect(() => {
    if (!open) {
      setIsDrawing(false)
    }
  }, [open])

  React.useEffect(() => {
    latestDraftRef.current = draft
  }, [draft])

  React.useEffect(() => {
    latestRecordRef.current = record
  }, [record])

  function clearStageTimer() {
    if (stageTimerRef.current !== null) {
      window.clearTimeout(stageTimerRef.current)
      stageTimerRef.current = null
    }
  }

  function syncContentStage(nextStage: SheetStage) {
    clearStageTimer()

    if (reducedMotion) {
      setContentStage(nextStage)
      return
    }

    if (nextStage === "expanded") {
      stageTimerRef.current = window.setTimeout(() => {
        setContentStage("expanded")
        stageTimerRef.current = null
      }, motionTokens.duration.sheetStageSync * 1000)
      return
    }

    setContentStage("peek")
  }

  function settleDrag() {
    animate(
      x,
      0,
      reducedMotion
        ? { duration: motionTokens.duration.instant }
        : motionTokens.intent.dragFollow
    )
    animate(
      y,
      0,
      reducedMotion
        ? { duration: motionTokens.duration.instant }
        : motionTokens.intent.dragFollow
    )
  }

  function commitStage(nextStage: SheetStage) {
    if (nextStage === stage && nextStage === contentStage) {
      settleDrag()
      return
    }

    if (nextStage === "peek") {
      setContentStage("peek")
      setStage("peek")
      clearStageTimer()
      settleDrag()
      return
    }

    setStage("expanded")
    syncContentStage("expanded")
    settleDrag()
  }

  function updatePhoto(nextSlot?: EditorDraft["photo"]) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      if (current.photo?.src !== nextSlot?.src && current.photo?.src !== record?.photo?.src) {
        releaseSessionPhotoSlot(current.photo)
      }

      return {
        ...current,
        photo: nextSlot,
      }
    })
  }

  function updateDoodle(nextSlot?: EditorDraft["doodle"]) {
    setDraft((current) => (current ? { ...current, doodle: nextSlot } : current))
  }

  function updateText(nextSlot?: EditorDraft["text"]) {
    setDraft((current) => (current ? { ...current, text: nextSlot } : current))
  }

  async function persistDraft() {
    if (!draft) {
      return
    }

    setIsSaving(true)

    try {
      await onSave({
        ...draft,
        currentPreviewType: activeTab,
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function closeEditor() {
    if (isSaving) {
      return
    }

    clearStageTimer()

    try {
      await persistDraft()
      onOpenChange(false)
    } catch {
      return
    }
  }

  function handleDragEnd(
    _: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo
  ) {
    if (isDrawing || isSaving) {
      settleDrag()
      return
    }

    if (stage === "peek") {
      if (
        info.offset.y > motionTokens.gesture.sheetDismissOffset ||
        info.velocity.y > motionTokens.gesture.sheetDismissVelocity
      ) {
        void closeEditor()
        return
      }

      if (
        info.offset.y < -motionTokens.gesture.sheetExpandOffset ||
        info.velocity.y < -motionTokens.gesture.sheetDismissVelocity
      ) {
        commitStage("expanded")
        return
      }

      settleDrag()
      return
    }

    if (
      info.offset.y > motionTokens.gesture.sheetCollapseOffset ||
      info.velocity.y > motionTokens.gesture.sheetDismissVelocity
    ) {
      commitStage("peek")
      return
    }

    settleDrag()
  }

  function renderPeekEditor() {
    if (!draft) {
      return null
    }

    if (activeTab === "photo") {
      return (
        <PhotoEditor
          mode="peek"
          onSelectFile={(file) => updatePhoto(createSessionPhotoSlot(file))}
          slot={draft.photo}
        />
      )
    }

    if (activeTab === "doodle") {
      return (
        <DoodleCanvas
          mode="peek"
          onChange={updateDoodle}
          onDrawingChange={setIsDrawing}
          recordKey={draft.date}
          slot={draft.doodle}
        />
      )
    }

    return <TextEditor mode="peek" onChange={updateText} slot={draft.text} />
  }

  if (!mounted) {
    return null
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            aria-label="Close editor"
            className="absolute inset-0 bg-[color:var(--sheet-backdrop)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reducedMotion
                ? motionTokens.duration.instant
                : motionTokens.duration.quick,
              ease: motionTokens.ease.fade,
            }}
            onClick={() => {
              if (!isDrawing && !isSaving) {
                void closeEditor()
              }
            }}
          />

          <motion.section
            aria-modal="true"
            role="dialog"
            drag
            dragControls={dragControls}
            dragConstraints={{
              top: -Math.max(180, viewportHeight * 0.5),
              right: Math.max(72, viewportWidth * 0.48),
              bottom:
                stage === "peek"
                  ? Math.max(80, viewportHeight * 0.18)
                  : Math.max(64, viewportHeight * 0.14),
              left: -Math.max(72, viewportWidth * 0.48),
            }}
            dragElastic={0.12}
            dragListener={false}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="pointer-events-auto fixed z-10 flex flex-col overflow-hidden text-foreground shadow-[var(--calendar-sheet-shadow)] backdrop-blur-[32px] backdrop-saturate-[1.35]"
            style={{
              x,
              y,
              left: stage === "expanded" ? expandedFrame.left : peekFrame.left,
              right: stage === "expanded" ? expandedFrame.right : peekFrame.right,
              bottom: stage === "expanded" ? expandedFrame.bottom : peekFrame.bottom,
              borderTopLeftRadius:
                stage === "expanded"
                  ? expandedFrame.borderTopLeftRadius
                  : peekFrame.borderTopLeftRadius,
              borderTopRightRadius:
                stage === "expanded"
                  ? expandedFrame.borderTopRightRadius
                  : peekFrame.borderTopRightRadius,
              borderBottomLeftRadius:
                stage === "expanded"
                  ? expandedFrame.borderBottomLeftRadius
                  : peekFrame.borderBottomLeftRadius,
              borderBottomRightRadius:
                stage === "expanded"
                  ? expandedFrame.borderBottomRightRadius
                  : peekFrame.borderBottomRightRadius,
              height: stage === "expanded" ? expandedFrame.height : peekFrame.height,
              scale: 1,
              backgroundColor: "var(--calendar-sheet-surface-strong)",
              boxShadow: "var(--calendar-sheet-shadow), var(--calendar-sheet-inner-shadow)",
            }}
            initial={reducedMotion ? { opacity: 0 } : dockLaunchFrame}
            animate={
              reducedMotion
                ? { opacity: 1 }
                : stage === "peek"
                  ? peekFrame
                  : expandedFrame
            }
            exit={reducedMotion ? { opacity: 0 } : dockExitFrame}
            transition={
              reducedMotion
                ? { duration: motionTokens.duration.instant }
                : stage === contentStage
                  ? motionTokens.intent.floatingSheet.detent
                  : motionTokens.intent.floatingSheet.resize
            }
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[var(--calendar-sheet-surface-strong)]" />
              <div className="absolute inset-0 bg-[image:var(--calendar-sheet-glass-overlay)]" />
              <div className="absolute inset-0 bg-[image:var(--calendar-sheet-top-sheen)]" />
              <div className="absolute inset-x-0 top-0 h-px bg-[var(--calendar-sheet-edge-highlight)]" />
            </div>

            <header
              className="relative z-10 flex flex-col"
              style={{
                paddingLeft: floatingSheetUi.headerPaddingX,
                paddingRight: floatingSheetUi.headerPaddingX,
                paddingTop: floatingSheetUi.headerPaddingTop,
                paddingBottom: floatingSheetUi.headerPaddingBottom,
              }}
            >
              <div className="flex justify-center">
                <button
                  type="button"
                  aria-label="Drag editor"
                  className={cn(
                    "flex w-full cursor-grab items-center justify-center rounded-full active:cursor-grabbing",
                    isDrawing && "cursor-default"
                  )}
                  style={{
                    height: floatingSheetUi.handleTouchHeight,
                    maxWidth: 88,
                    touchAction: isDrawing || isSaving ? "auto" : "none",
                    WebkitTapHighlightColor: "transparent",
                    WebkitUserSelect: "none",
                    userSelect: "none",
                  }}
                  onPointerDown={(event) => {
                    if (!isDrawing && !isSaving) {
                      dragControls.start(event)
                    }
                  }}
                >
                  <span
                    className="rounded-full"
                    style={{
                      width: floatingSheetUi.handleWidth,
                      height: floatingSheetUi.handleHeight,
                      backgroundColor: "var(--calendar-sheet-handle)",
                    }}
                  />
                </button>
              </div>

              <div className="mt-[8px] text-center">
                <h2
                  className="truncate font-semibold"
                  style={{
                    fontSize: floatingSheetUi.titleSize,
                    letterSpacing: `${floatingSheetUi.titleTracking}px`,
                  }}
                >
                  {record
                    ? new Intl.DateTimeFormat("en-US", {
                        weekday: "short",
                        month: "long",
                        day: "numeric",
                      }).format(parseIsoDate(record.date))
                    : "Edit day"}
                </h2>
              </div>

              {contentStage === "peek" ? (
                <LayoutGroup>
                  <div
                    className="mt-[10px] grid grid-cols-3 gap-2 bg-black/[0.045] p-[4px]"
                    style={{ borderRadius: floatingSheetUi.segmentContainerRadius }}
                  >
                    {editorTabs.map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        className={cn(
                          "relative px-[8px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--calendar-accent)]/40",
                          activeTab === tab.value ? "text-foreground" : "text-foreground/46"
                        )}
                        style={{
                          minHeight: calendarInteractionUi.minTouchTarget,
                          height: floatingSheetUi.segmentHeight,
                          borderRadius: floatingSheetUi.segmentRadius,
                          fontSize: 12,
                          letterSpacing: "-0.22px",
                        }}
                        onClick={() => setActiveTab(tab.value)}
                      >
                        {activeTab === tab.value ? (
                          <motion.span
                            layoutId="editor-active-tab"
                            className="absolute inset-0 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
                            style={{ borderRadius: floatingSheetUi.segmentRadius }}
                            transition={
                              reducedMotion
                                ? { duration: motionTokens.duration.instant }
                                : motionTokens.intent.selectionFlow
                            }
                          />
                        ) : null}
                        <motion.span
                          className="relative z-10"
                          animate={{ opacity: activeTab === tab.value ? 1 : 0.72 }}
                          transition={{
                            duration: reducedMotion
                              ? motionTokens.duration.instant
                              : motionTokens.duration.quick,
                            ease: motionTokens.ease.fade,
                          }}
                        >
                          {tab.label}
                        </motion.span>
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
              ) : null}
            </header>

            <div
              className="relative z-10 min-h-0 flex-1"
              style={{
                paddingLeft: floatingSheetUi.contentPaddingX,
                paddingRight: floatingSheetUi.contentPaddingX,
                paddingBottom: floatingSheetUi.contentPaddingBottom,
              }}
            >
              {draft ? (
                contentStage === "peek" ? (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeTab}
                      className="h-full"
                      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                      transition={
                        reducedMotion
                          ? { duration: motionTokens.duration.instant }
                          : {
                              duration: motionTokens.duration.quick,
                              ease: motionTokens.ease.enter,
                            }
                      }
                    >
                      {renderPeekEditor()}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="grid h-full min-h-0 grid-cols-2 grid-rows-[auto_minmax(0,1fr)] gap-3">
                    <section className="min-h-0">
                      <PhotoEditor
                        label="Photo"
                        mode="expanded"
                        onSelectFile={(file) => updatePhoto(createSessionPhotoSlot(file))}
                        slot={draft.photo}
                      />
                    </section>
                    <section className="min-h-0">
                      <DoodleCanvas
                        label="Sketch"
                        mode="expanded"
                        onChange={updateDoodle}
                        onDrawingChange={setIsDrawing}
                        recordKey={draft.date}
                        slot={draft.doodle}
                      />
                    </section>

                    <section className="col-span-2 min-h-0">
                      <TextEditor
                        label="Text"
                        mode="expanded"
                        onChange={updateText}
                        slot={draft.text}
                      />
                    </section>
                  </div>
                )
              ) : null}
            </div>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}
