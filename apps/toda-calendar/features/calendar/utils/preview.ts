import { contentTypes, type CalendarDayRecord, type ContentType, type PreviewFilterState } from "../model/types"

export function createDefaultPreviewFilter(): PreviewFilterState {
  return {
    photo: true,
    doodle: true,
    text: true,
  }
}

export function hasSlotContent(record: CalendarDayRecord, type: ContentType) {
  if (type === "photo") {
    return Boolean(record.photo?.src)
  }

  if (type === "doodle") {
    return Boolean(
      record.doodle?.strokes.some((stroke) => stroke.points.length > 1)
    )
  }

  return Boolean(record.text?.title?.trim() || record.text?.body.trim())
}

export function getFilledContentTypes(record: CalendarDayRecord) {
  return contentTypes.filter((type) => hasSlotContent(record, type))
}

export function getEnabledContentTypes(filter: PreviewFilterState) {
  return contentTypes.filter((type) => filter[type])
}

export function resolveVisiblePreviewType(
  record: CalendarDayRecord,
  activeType: ContentType,
  filter: PreviewFilterState
) {
  if (!filter[activeType]) {
    return null
  }

  if (!hasSlotContent(record, activeType)) {
    return null
  }

  return activeType
}

export function cyclePreviewMode(activeType: ContentType, filter: PreviewFilterState) {
  const enabled = getEnabledContentTypes(filter)

  if (!enabled.length) {
    return activeType
  }

  if (enabled.length === 1) {
    return enabled[0] ?? activeType
  }

  const currentIndex = enabled.indexOf(activeType)

  if (currentIndex === -1) {
    return enabled[0] ?? activeType
  }

  return enabled[(currentIndex + 1) % enabled.length] ?? activeType
}

export function resolvePreviewModeAfterFilter(
  activeType: ContentType,
  filter: PreviewFilterState
) {
  const enabled = getEnabledContentTypes(filter)

  if (!enabled.length) {
    return activeType
  }

  if (enabled.includes(activeType)) {
    return activeType
  }

  return enabled[0] ?? activeType
}
