import type { TextStyle } from "react-native"

export const palette = {
  background: "#f4efe6",
  surface: "#fffaf4",
  surfaceStrong: "#efe5d7",
  border: "#e5d8c8",
  ink: "#181411",
  inkMuted: "#70665c",
  accent: "#1f786b",
  accentSoft: "#def1ec",
  photo: "#c18a3a",
  doodle: "#2f6f93",
  text: "#b5644d",
  success: "#2f7c4a",
  danger: "#a55450",
  white: "#ffffff",
} as const

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 44,
} as const

export const radius = {
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const

export const shadows = {
  card: "0 18px 38px rgba(24, 20, 17, 0.08)",
} as const

export const typography: Record<string, TextStyle> = {
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },
  bodyStrong: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  number: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
}
