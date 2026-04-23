import { appCopy } from "@/lib/copy"
import type { CalendarPhotoSlot } from "../model/types"

type RevokeObjectUrl = (value: string) => void

const sessionPhotoFiles = new Map<string, File>()

function normalizePhotoAlt(name: string) {
  const trimmedName = name.trim()
  const withoutExtension = trimmedName.replace(/\.[^.]+$/, "")

  if (withoutExtension) {
    return withoutExtension
  }

  return appCopy.common.selectedPhotoAlt
}

export function createSessionPhotoSlot(
  file: File,
  createObjectUrl: (value: File) => string = (value) => URL.createObjectURL(value),
  createAssetId: () => string = () => `session:${crypto.randomUUID()}`
): CalendarPhotoSlot {
  const assetId = createAssetId()

  sessionPhotoFiles.set(assetId, file)

  return {
    type: "photo",
    assetId,
    src: createObjectUrl(file),
    alt: normalizePhotoAlt(file.name),
    source: "session",
  }
}

export function getSessionPhotoFile(slot: CalendarPhotoSlot | undefined) {
  if (!slot?.assetId) {
    return undefined
  }

  return sessionPhotoFiles.get(slot.assetId)
}

export function releaseSessionPhotoSlot(
  slot: CalendarPhotoSlot | undefined,
  revokeObjectUrl: RevokeObjectUrl = (value) => URL.revokeObjectURL(value)
) {
  if (slot?.assetId) {
    sessionPhotoFiles.delete(slot.assetId)
  }

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
