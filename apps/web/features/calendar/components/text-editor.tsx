"use client"

import { cn } from "@workspace/ui/lib/utils"

import type { CalendarTextSlot } from "../model/types"

type TextEditorProps = {
  mode?: "peek" | "expanded"
  onChange: (slot?: CalendarTextSlot) => void
  slot?: CalendarTextSlot
}

export function TextEditor({
  mode = "peek",
  onChange,
  slot,
}: TextEditorProps) {
  const compact = mode === "expanded"

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="min-h-0 flex-1 overflow-hidden rounded-[22px] border border-black/[0.06]">
        <textarea
          aria-label="Write a note"
          className={cn(
            "h-full w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-foreground/28",
            compact
              ? "px-3 py-3 text-[0.88rem] leading-5"
              : "px-4 py-4 text-[0.96rem] leading-6"
          )}
          maxLength={compact ? 160 : 180}
          onChange={(event) =>
            onChange({
              type: "text",
              body: event.target.value,
            })
          }
          placeholder="Write a sentence for the day."
          value={slot?.body ?? ""}
        />
      </div>

      <div className="flex h-9 items-center justify-between">
        <div className="text-[0.76rem] font-medium text-foreground/34">
          {(slot?.body ?? "").length}/{compact ? 160 : 180}
        </div>
        <button
          type="button"
          className={cn(
            "rounded-full border border-black/[0.08] text-foreground/56 outline-none transition-colors hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-[var(--calendar-accent)]/40 disabled:opacity-35",
            compact ? "h-9 px-3 text-[0.8rem] font-medium" : "h-10 px-4 text-[0.88rem] font-medium"
          )}
          disabled={!slot?.body}
          onClick={() => onChange(undefined)}
        >
          Clear
        </button>
      </div>
    </div>
  )
}
