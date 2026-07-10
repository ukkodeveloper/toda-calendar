import type { Metadata, Viewport } from "next"
import { Figtree, Montserrat } from "next/font/google"
import localFont from "next/font/local"

// Astryx design system — reset → compiled component styles → Stone 테마 토큰.
// Stone 은 프리컴파일 CSS. <Providers>/<Theme> 가 data-astryx-theme="stone" 만 붙인다.
import "@astryxdesign/core/reset.css"
import "@astryxdesign/core/astryx.css"
import "@astryxdesign/theme-stone/theme.css"
import "./globals.css"

import { Providers } from "./providers"

// 라틴 = Figtree(본문)/Montserrat(제목), 한글 = Pretendard. 셋 다 next/font 로
// 셀프호스팅(런타임 CDN 없음). CSS 변수로 노출해 globals 의 폰트 토큰에 연결한다.
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
})
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})
// Pretendard — 한글 본문·제목. Variable woff2 를 로컬(app/fonts)에서 로드. wght 45–920.
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
})

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
  // 흰 앱 프레임 상단과 맞춘 상태바 크롬 (앱 프레임 배경 = #fff).
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // data-theme on <html> avoids a flash of the wrong color-scheme before hydration.
  return (
    <html
      lang="ko"
      data-theme="light"
      className={`${pretendard.variable} ${figtree.variable} ${montserrat.variable}`}
    >
      <body>
        <Providers>
          <div className="app-shell">{children}</div>
        </Providers>
      </body>
    </html>
  )
}
