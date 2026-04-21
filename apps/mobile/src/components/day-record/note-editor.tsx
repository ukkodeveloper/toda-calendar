import { Text, TextInput } from "react-native"

import { SectionCard } from "@/components/ui/section-card"
import { palette, radius, spacing, typography } from "@/theme/tokens"

type NoteEditorProps = {
  value: string
  onChange: (next: string) => void
}

export function NoteEditor({ value, onChange }: NoteEditorProps) {
  return (
    <SectionCard>
      <Text style={[typography.sectionTitle, { color: palette.ink }]}>Words</Text>
      <Text style={[typography.body, { color: palette.inkMuted }]}>
        A short sentence is enough. This editor autosaves after a brief pause.
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline
        autoCapitalize="sentences"
        placeholder="What felt quietly important today?"
        placeholderTextColor="#9d9285"
        style={{
          minHeight: 180,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.surfaceStrong,
          color: palette.ink,
          padding: spacing.lg,
          fontSize: 16,
          lineHeight: 24,
          textAlignVertical: "top",
        }}
      />
    </SectionCard>
  )
}
