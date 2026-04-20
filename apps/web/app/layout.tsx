import { Geist_Mono, Figtree } from "next/font/google"

import "@workspace/ui/globals.css"
import { MotionProvider } from "@workspace/ui/components/motion-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

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
        fontMono.variable,
        "font-sans",
        figtree.variable
      )}
    >
      <body>
        <ThemeProvider>
          <MotionProvider>{children}</MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
