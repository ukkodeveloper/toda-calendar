import { useRef, useState } from "react"
import { Text, View } from "react-native"
import Svg, { Path } from "react-native-svg"

import { PrimaryButton } from "@/components/ui/primary-button"
import { SectionCard } from "@/components/ui/section-card"
import type { DoodlePoint, DoodleStroke } from "@/types/calendar"
import { palette, radius, spacing, typography } from "@/theme/tokens"

const CANVAS_HEIGHT = 260

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function toPath(points: DoodlePoint[], width: number, height: number) {
  if (!points.length) {
    return ""
  }

  return points
    .map((point, index) => {
      const x = (point.x / 100) * width
      const y = (point.y / 100) * height
      return `${index === 0 ? "M" : "L"} ${x} ${y}`
    })
    .join(" ")
}

function createStrokePoint(locationX: number, locationY: number, width: number, height: number) {
  return {
    x: clamp((locationX / Math.max(width, 1)) * 100, 0, 100),
    y: clamp((locationY / Math.max(height, 1)) * 100, 0, 100),
  }
}

export function DoodleCanvas({
  value,
  onChange,
}: {
  value: DoodleStroke[]
  onChange: (next: DoodleStroke[]) => void
}) {
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: CANVAS_HEIGHT })
  const [draftStroke, setDraftStroke] = useState<DoodleStroke | null>(null)
  const draftStrokeRef = useRef<DoodleStroke | null>(null)

  function commitDraft(stroke: DoodleStroke | null) {
    if (!stroke || stroke.points.length < 2) {
      draftStrokeRef.current = null
      setDraftStroke(null)
      return
    }

    onChange([...value, stroke])
    draftStrokeRef.current = null
    setDraftStroke(null)
  }

  return (
    <SectionCard>
      <Text style={[typography.sectionTitle, { color: palette.ink }]}>Sketch</Text>
      <Text style={[typography.body, { color: palette.inkMuted }]}>
        Draw one loose line. Each finished stroke saves right away.
      </Text>

      <View
        onLayout={event => {
          const { width, height } = event.nativeEvent.layout
          setCanvasSize({ width, height })
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={event => {
          const point = createStrokePoint(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
            canvasSize.width,
            canvasSize.height
          )

          const nextStroke = {
            id: `stroke-${Date.now()}`,
            color: palette.ink,
            width: 3,
            points: [point],
          }

          draftStrokeRef.current = nextStroke
          setDraftStroke(nextStroke)
        }}
        onResponderMove={event => {
          const point = createStrokePoint(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
            canvasSize.width,
            canvasSize.height
          )

          const current = draftStrokeRef.current

          if (!current) {
            return
          }

          const nextStroke = {
            ...current,
            points: [...current.points, point],
          }

          draftStrokeRef.current = nextStroke
          setDraftStroke(nextStroke)
        }}
        onResponderRelease={() => commitDraft(draftStrokeRef.current)}
        onResponderTerminate={() => commitDraft(draftStrokeRef.current)}
        style={{
          minHeight: CANVAS_HEIGHT,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.surfaceStrong,
          overflow: "hidden",
        }}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}>
          {[...value, ...(draftStroke ? [draftStroke] : [])].map(stroke => (
            <Path
              key={stroke.id}
              d={toPath(stroke.points, canvasSize.width, canvasSize.height)}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label="Undo"
            tone="secondary"
            onPress={() => onChange(value.slice(0, -1))}
            disabled={!value.length}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label="Clear"
            tone="secondary"
            onPress={() => onChange([])}
            disabled={!value.length}
          />
        </View>
      </View>
    </SectionCard>
  )
}
