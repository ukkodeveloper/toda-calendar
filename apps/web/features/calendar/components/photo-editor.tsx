"use client"

import * as React from "react"
import Image from "next/image"

import { cn } from "@workspace/ui/lib/utils"

import type { CalendarPhotoSlot } from "../model/types"

type PhotoEditorProps = {
  mode?: "peek" | "expanded"
  onChange: (slot?: CalendarPhotoSlot) => void
  slot?: CalendarPhotoSlot
}

export function PhotoEditor({
  mode = "peek",
  onChange,
  slot,
}: PhotoEditorProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const compact = mode === "expanded"

  function clearCurrentSlot() {
    if (slot?.source === "session" && slot.src.startsWith("blob:")) {
      URL.revokeObjectURL(slot.src)
    }

    onChange(undefined)
  }

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
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden rounded-[22px] border border-black/[0.06]",
          compact ? "rounded-[20px]" : "rounded-[24px]"
        )}
      >
        {slot ? (
          <Image
            alt={slot.alt}
            className="object-cover"
            fill
            sizes={compact ? "40vw" : "(max-width: 768px) 78vw, 320px"}
            src={slot.src}
            unoptimized={slot.src.startsWith("blob:")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center border border-dashed border-black/[0.08] text-[0.84rem] font-medium text-foreground/38">
            Add photo
          </div>
        )}
      </div>

      <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-[1fr_auto]")}>
        <button
          type="button"
          className={cn(
            "rounded-full bg-foreground text-background outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-[var(--calendar-accent)]/40",
            compact ? "h-9 px-3 text-[0.8rem] font-medium" : "h-11 px-4 text-[0.9rem] font-medium"
          )}
          onClick={() => inputRef.current?.click()}
        >
          {slot ? "Replace" : "Choose"}
        </button>
        <button
          type="button"
          className={cn(
            "rounded-full border border-black/[0.08] text-foreground/56 outline-none transition-colors hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-[var(--calendar-accent)]/40 disabled:opacity-35",
            compact ? "h-9 px-3 text-[0.8rem] font-medium" : "h-11 px-4 text-[0.88rem] font-medium"
          )}
          disabled={!slot}
          onClick={clearCurrentSlot}
        >
          Clear
        </button>
      </div>

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
