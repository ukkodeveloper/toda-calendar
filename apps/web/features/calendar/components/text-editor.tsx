"use client"

import { cn } from "@workspace/ui/lib/utils"

import type { CalendarTextSlot } from "../model/types"

const TEXT_MAX_LENGTH = 8

type TextEditorProps = {
  label?: string
  mode?: "peek" | "expanded"
  onChange: (slot?: CalendarTextSlot) => void
  slot?: CalendarTextSlot
}

export function TextEditor({
  label,
  mode = "peek",
  onChange,
  slot,
}: TextEditorProps) {
  const compact = mode === "expanded"
  const value = slot?.body ?? ""

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden rounded-[24px] bg-white/42 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_18px_32px_rgba(15,23,42,0.06)]">
        {label ? (
          <div className="pointer-events-none absolute top-3 left-3 z-[1]">
            <div className="rounded-full bg-white/76 px-2.5 py-1 text-[11px] font-semibold tracking-[-0.01em] text-foreground/56 backdrop-blur-[12px]">
              {label}
            </div>
          </div>
        ) : null}

        <textarea
          aria-label="Write a note"
          className={cn(
            "h-full w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-foreground/28",
            compact
              ? "px-4 pt-10 pb-11 text-[14px] leading-5"
              : "px-4 pt-4 pb-10 text-[15px] leading-6"
          )}
          maxLength={TEXT_MAX_LENGTH}
          onChange={(event) =>
            onChange({
              type: "text",
              body: event.target.value.slice(0, TEXT_MAX_LENGTH),
            })
          }
          placeholder="Leave a tiny note."
          value={value.slice(0, TEXT_MAX_LENGTH)}
        />
        <div className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-white/68 px-2 py-0.5 text-[10px] font-semibold tracking-[-0.01em] text-foreground/38 backdrop-blur-[10px]">
          {value.length}/{TEXT_MAX_LENGTH}
        </div>
      </div>
    </div>
  )
}
