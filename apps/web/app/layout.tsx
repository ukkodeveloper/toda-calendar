import type { Metadata } from "next"
import { Geist_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { AppProviders } from "@/providers/app-providers"
import { cn } from "@workspace/ui/lib/utils"

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Toda Calendar",
  description: "A calm, Apple-like month journaling calendar.",
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
      className={cn("antialiased", fontMono.variable, "font-sans")}
    >
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
