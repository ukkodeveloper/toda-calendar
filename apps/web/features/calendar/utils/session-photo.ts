import type { CalendarPhotoSlot } from "../model/types"

type RevokeObjectUrl = (value: string) => void

function normalizePhotoAlt(name: string) {
  const trimmedName = name.trim()
  const withoutExtension = trimmedName.replace(/\.[^.]+$/, "")

  if (withoutExtension) {
    return withoutExtension
  }

  return "Selected photo"
}

export function createSessionPhotoSlot(
  file: File,
  createObjectUrl: (value: File) => string = (value) => URL.createObjectURL(value),
  createAssetId: () => string = () => `session:${crypto.randomUUID()}`
): CalendarPhotoSlot {
  return {
    type: "photo",
    assetId: createAssetId(),
    src: createObjectUrl(file),
    alt: normalizePhotoAlt(file.name),
    source: "session",
  }
}

export function releaseSessionPhotoSlot(
  slot: CalendarPhotoSlot | undefined,
  revokeObjectUrl: RevokeObjectUrl = (value) => URL.revokeObjectURL(value)
) {
  if (!slot || slot.source !== "session" || !slot.src.startsWith("blob:")) {
    return
  }

  revokeObjectUrl(slot.src)
}

export function releaseReplacedSessionPhoto(
  previous: CalendarPhotoSlot | undefined,
  next: CalendarPhotoSlot | undefined,
  revokeObjectUrl?: RevokeObjectUrl
) {
  if (!previous || previous.src === next?.src) {
    return
  }

  releaseSessionPhotoSlot(previous, revokeObjectUrl)
}
