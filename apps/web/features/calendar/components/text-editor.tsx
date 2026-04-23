"use client"

import { cn } from "@workspace/ui/lib/utils"

import { appCopy } from "@/lib/copy"
import type { CalendarTextSlot } from "../model/types"
import { EditorBadge, EditorSurface } from "./editor-chrome"

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
      <EditorSurface className="min-h-0 flex-1" label={label} mode={mode}>
        <textarea
          aria-label={appCopy.component.textEditor.writeAriaLabel}
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
          placeholder={appCopy.component.textEditor.placeholder}
          value={value.slice(0, TEXT_MAX_LENGTH)}
        />
        <EditorBadge
          className="pointer-events-none absolute right-3 bottom-3 px-2 py-0.5 text-[10px]"
          tone="muted"
        >
          {value.length}/{TEXT_MAX_LENGTH}
        </EditorBadge>
      </EditorSurface>
    </div>
  )
}
