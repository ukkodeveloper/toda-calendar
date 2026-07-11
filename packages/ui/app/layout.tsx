import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "@workspace/ui/globals.css"
import "./design-system/calendar-demo-tokens.css"
import { cn } from "@workspace/ui/lib/utils"
import { AppProviders } from "./providers"

// weight 미지정 = 가변 축(100–900) 로드 → Linear 시그니처 웨이트 510 사용 가능
const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "UI · Design System",
  description: "Toda 디자인 시스템 쇼케이스",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        fontMono.variable,
        "font-sans"
      )}
    >
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
