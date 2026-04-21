"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import Image from "next/image"

import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

import type { CalendarPhotoSlot } from "../model/types"

type PhotoEditorProps = {
  label?: string
  mode?: "peek" | "expanded"
  onChange: (slot?: CalendarPhotoSlot) => void
  slot?: CalendarPhotoSlot
}

export function PhotoEditor({
  label,
  mode = "peek",
  onChange,
  slot,
}: PhotoEditorProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const reducedMotion = useReducedMotion()
  const compact = mode === "expanded"
  const stageMaxWidth = compact ? 196 : 220
  const aspectRatio = motionTokens.preview.photoAspectRatio
  const pillLabel = slot ? "Tap to replace" : "Tap to add"

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (slot?.source === "session" && slot.src.startsWith("blob:")) {
      URL.revokeObjectURL(slot.src)
    }

    onChange({
      type: "photo",
      src: URL.createObjectURL(file),
      alt: file.name.replace(/\.[^.]+$/, "") || "Selected photo",
      source: "session",
    })
    event.target.value = ""
  }

  return (
    <div className="flex h-full min-h-0 items-center justify-center">
      <motion.div
        aria-label={slot ? "Replace photo" : "Add photo"}
        className={cn(
          "group relative w-full overflow-hidden rounded-[26px] bg-white/46 text-left outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_18px_32px_rgba(15,23,42,0.08)] transition-transform focus-visible:ring-2 focus-visible:ring-[var(--calendar-accent)]/35",
          compact ? "rounded-[24px]" : "rounded-[28px]"
        )}
        role="button"
        tabIndex={0}
        style={{
          maxHeight: "100%",
          maxWidth: stageMaxWidth,
          aspectRatio: `${aspectRatio}`,
          WebkitTapHighlightColor: "transparent",
        }}
        whileTap={reducedMotion ? undefined : { scale: 0.985 }}
        transition={motionTokens.intent.touchFeedback}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        {label ? (
          <div className="pointer-events-none absolute top-3 left-3 z-[1]">
            <div className="rounded-full bg-white/76 px-2.5 py-1 text-[11px] font-semibold tracking-[-0.01em] text-foreground/56 backdrop-blur-[12px]">
              {label}
            </div>
          </div>
        ) : null}

        {slot ? (
          <>
            <Image
              alt={slot.alt}
              className="object-cover"
              fill
              sizes={compact ? "34vw" : "(max-width: 768px) 58vw, 260px"}
              src={slot.src}
              unoptimized={slot.src.startsWith("blob:")}
            />
          </>
        ) : (
          <div className="h-full w-full bg-[linear-gradient(180deg,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0.16)_100%)]" />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/22 via-black/8 to-transparent px-3 pb-3 pt-7">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={pillLabel}
              className="inline-flex rounded-full bg-white/74 px-2.5 py-1 text-[11px] font-semibold tracking-[-0.01em] text-foreground/62 backdrop-blur-[12px]"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.985 }}
              transition={
                reducedMotion
                  ? { duration: motionTokens.duration.instant }
                  : {
                      duration: motionTokens.duration.quick,
                      ease: motionTokens.ease.enter,
                    }
              }
            >
              {pillLabel}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      <input
        ref={inputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        type="file"
      />
    </div>
  )
}
