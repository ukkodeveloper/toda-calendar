import { Image } from "expo-image"
import { Text, View } from "react-native"

import { PrimaryButton } from "@/components/ui/primary-button"
import { SectionCard } from "@/components/ui/section-card"
import { palette, radius, spacing, typography } from "@/theme/tokens"

type PhotoCardProps = {
  photoUri: string | null
  onPickPhoto: () => void
  onClearPhoto: () => void
  busy?: boolean
}

export function PhotoCard({
  photoUri,
  onPickPhoto,
  onClearPhoto,
  busy = false,
}: PhotoCardProps) {
  return (
    <SectionCard>
      <Text style={[typography.sectionTitle, { color: palette.ink }]}>Photo</Text>
      <Text style={[typography.body, { color: palette.inkMuted }]}>
        Keep one frame that will make the day easier to remember later.
      </Text>

      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={{
            width: "100%",
            height: 220,
            borderRadius: radius.md,
            backgroundColor: palette.surfaceStrong,
          }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.surfaceStrong,
            padding: spacing.xl,
            minHeight: 180,
            justifyContent: "center",
            gap: spacing.sm,
          }}
        >
          <Text style={[typography.bodyStrong, { color: palette.ink }]}>Nothing chosen yet</Text>
          <Text style={[typography.body, { color: palette.inkMuted }]}>
            Choose one photo from the library and keep the rest out of the way.
          </Text>
        </View>
      )}

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label={busy ? "Working..." : photoUri ? "Replace photo" : "Choose photo"}
            onPress={onPickPhoto}
            disabled={busy}
          />
        </View>
        {photoUri ? (
          <View style={{ flex: 1 }}>
            <PrimaryButton label="Remove" onPress={onClearPhoto} tone="secondary" />
          </View>
        ) : null}
      </View>
    </SectionCard>
  )
}
