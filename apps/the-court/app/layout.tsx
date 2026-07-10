import type { Metadata, Viewport } from "next"

// Astryx design system — reset → compiled component styles.
// Theme tokens (the_court_theme) are injected at runtime by <Providers>/<Theme>.
import "@astryxdesign/core/reset.css"
import "@astryxdesign/core/astryx.css"
import "./globals.css"

import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "현행범 (現行犯)",
  description:
    "친구들의 고발과 재판으로, 내 결심을 진짜 지키게 만드는 소셜 커밋먼트 앱",
  // favicon.ico is picked up from app/favicon.ico automatically; the rest live in public/.
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: {
      url: "/apple-touch-icon-180.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
  appleWebApp: {
    capable: true,
    title: "현행범",
    statusBarStyle: "black-translucent",
  },
}

export const viewport: Viewport = {
  themeColor: "#14213D",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // data-theme on <html> avoids a flash of the wrong color-scheme before hydration.
  return (
    <html lang="ko" data-theme="dark">
      <body>
        <Providers>
          <div className="app-shell">{children}</div>
        </Providers>
      </body>
    </html>
  )
}
