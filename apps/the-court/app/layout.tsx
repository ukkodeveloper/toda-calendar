import type { Metadata } from "next"

// Astryx design system — reset → compiled component styles → neutral theme tokens
import "@astryxdesign/core/reset.css"
import "@astryxdesign/core/astryx.css"
import "@astryxdesign/theme-neutral/theme.css"

export const metadata: Metadata = {
  title: "현행범 (現行犯)",
  description:
    "친구들의 고발과 재판으로, 내 결심을 진짜 지키게 만드는 소셜 커밋먼트 앱",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" data-astryx-theme="neutral">
      <body>{children}</body>
    </html>
  )
}
