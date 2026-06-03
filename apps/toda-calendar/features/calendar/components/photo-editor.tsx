"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import Image from "next/image"

import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

import { appCopy } from "@/lib/copy"
import type { CalendarPhotoSlot } from "../model/types"
import {
  EditorActionPill,
  EditorSurface,
} from "./editor-chrome"

type PhotoEditorProps = {
  label?: string
  mode?: "peek" | "expanded"
  onSelectFile: (file: File) => void
  slot?: CalendarPhotoSlot
}

export function PhotoEditor({
  label,
  mode = "peek",
  onSelectFile,
  slot,
}: PhotoEditorProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const reducedMotion = useReducedMotion()
  const compact = mode === "expanded"
  const stageMaxWidth = compact ? 196 : 220
  const aspectRatio = motionTokens.preview.photoAspectRatio
  const pillLabel = slot
    ? appCopy.component.photoEditor.tapToReplace
    : appCopy.component.photoEditor.tapToAdd

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    onSelectFile(file)
    event.target.value = ""
  }

  return (
    <div className="flex h-full min-h-0 items-center justify-center">
      <motion.button
        type="button"
        aria-label={
          slot
            ? appCopy.component.photoEditor.replaceAriaLabel
            : appCopy.component.photoEditor.addAriaLabel
        }
        className={cn(
          "group relative w-full text-left outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--calendar-accent)]/35"
        )}
        style={{
          maxHeight: "100%",
          maxWidth: stageMaxWidth,
          aspectRatio: `${aspectRatio}`,
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
        whileTap={reducedMotion ? undefined : { scale: 0.985 }}
        transition={motionTokens.intent.touchFeedback}
        onClick={() => inputRef.current?.click()}
      >
        <EditorSurface label={label} mode={mode}>
          {slot ? (
            <Image
              alt={slot.alt}
              className="object-cover"
              fill
              sizes={compact ? "34vw" : "(max-width: 768px) 58vw, 260px"}
              src={slot.src}
              unoptimized={
                slot.src.startsWith("blob:") ||
                slot.src.startsWith("data:") ||
                slot.src.startsWith("http://") ||
                slot.src.startsWith("https://")
              }
            />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(180deg,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0.16)_100%)]" />
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/22 via-black/8 to-transparent px-3 pb-3 pt-7">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={pillLabel}
                initial={
                  reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }
                }
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
                <EditorActionPill>{pillLabel}</EditorActionPill>
              </motion.div>
            </AnimatePresence>
          </div>
        </EditorSurface>
      </motion.button>

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
