import { useEffect, useEffectEvent, useRef, useState } from "react"
import * as ImagePicker from "expo-image-picker"
import { ActivityIndicator, ScrollView, Text, View } from "react-native"

import { DoodleCanvas } from "@/components/day-record/doodle-canvas"
import { NoteEditor } from "@/components/day-record/note-editor"
import { PhotoCard } from "@/components/day-record/photo-card"
import { SaveStatusPill } from "@/components/ui/save-status-pill"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { useDayRecord } from "@/features/day-record/use-day-record"
import type { DayEditorMode, DoodleStroke } from "@/types/calendar"
import { palette, radius, spacing, typography } from "@/theme/tokens"

const editorOptions: Array<{ label: string; value: DayEditorMode }> = [
  { label: "Photo", value: "photo" },
  { label: "Sketch", value: "doodle" },
  { label: "Words", value: "text" },
]

export function DayRecordScreen({
  calendarId,
  localDate,
}: {
  calendarId: string
  localDate: string
}) {
  const { data, isPending, isError, refetch, saveNote, savePhoto, saveDoodle, saveState } =
    useDayRecord(calendarId, localDate)
  const [mode, setMode] = useState<DayEditorMode>("text")
  const [noteDraft, setNoteDraft] = useState("")
  const [doodleDraft, setDoodleDraft] = useState<DoodleStroke[]>([])
  const [photoBusy, setPhotoBusy] = useState(false)
  const hydratedDateRef = useRef<string | null>(null)

  useEffect(() => {
    if (!data) {
      return
    }

    if (hydratedDateRef.current === data.localDate) {
      return
    }

    hydratedDateRef.current = data.localDate

    setNoteDraft(data.note)
    setDoodleDraft(data.doodleStrokes)

    if (data.photoUri) {
      setMode("photo")
      return
    }

    if (data.doodleStrokes.length) {
      setMode("doodle")
      return
    }

    setMode("text")
  }, [data])

  const commitNote = useEffectEvent((nextNote: string) => {
    void saveNote(nextNote)
  })

  useEffect(() => {
    if (!data || noteDraft === data.note) {
      return
    }

    const timeoutId = setTimeout(() => {
      commitNote(noteDraft)
    }, 450)

    return () => clearTimeout(timeoutId)
  }, [noteDraft, data?.note, data])

  if (isPending) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: palette.background,
        }}
      >
        <ActivityIndicator size="small" color={palette.accent} />
      </View>
    )
  }

  if (isError || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.background, padding: spacing.xl }}>
        <Text style={[typography.sectionTitle, { color: palette.ink }]}>This day could not open</Text>
        <Text style={[typography.body, { color: palette.inkMuted, marginTop: spacing.sm }]}>
          Try loading the sheet again.
        </Text>
        <View style={{ marginTop: spacing.lg }}>
          <SaveStatusPill state="error" />
        </View>
        <View style={{ marginTop: spacing.lg }}>
          <Text
            accessibilityRole="button"
            onPress={() => void refetch()}
            style={[typography.button, { color: palette.accent }]}
          >
            Retry
          </Text>
        </View>
      </View>
    )
  }

  async function handlePickPhoto() {
    setPhotoBusy(true)

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.9,
      })

      if (!result.canceled) {
        await savePhoto(result.assets[0]?.uri ?? null)
      }
    } finally {
      setPhotoBusy(false)
    }
  }

  function handleDoodleChange(next: DoodleStroke[]) {
    setDoodleDraft(next)
    void saveDoodle(next)
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "transparent",
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: palette.background,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          overflow: "hidden",
        }}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: spacing.xxxl,
            gap: spacing.lg,
          }}
        >
          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.eyebrow, { color: palette.inkMuted }]}>Daily capture</Text>
            <Text style={[typography.title, { color: palette.ink }]}>
              One detail, saved before it slips.
            </Text>
            <SaveStatusPill state={saveState} />
          </View>

          <SegmentedControl options={editorOptions} value={mode} onChange={setMode} />

          {mode === "photo" ? (
            <PhotoCard
              photoUri={data.photoUri}
              onPickPhoto={handlePickPhoto}
              onClearPhoto={() => void savePhoto(null)}
              busy={photoBusy}
            />
          ) : null}

          {mode === "doodle" ? (
            <DoodleCanvas value={doodleDraft} onChange={handleDoodleChange} />
          ) : null}

          {mode === "text" ? <NoteEditor value={noteDraft} onChange={setNoteDraft} /> : null}

          <Text style={[typography.caption, { color: palette.inkMuted }]}>
            Entries stay on-device in this branch so mobile can evolve without backend coupling.
          </Text>
        </ScrollView>
      </View>
    </View>
  )
}
