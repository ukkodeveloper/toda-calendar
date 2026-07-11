import type { Metadata, Viewport } from "next"
import { Figtree, Montserrat } from "next/font/google"
import localFont from "next/font/local"

// 자체 DS(@workspace/ui) Tailwind 진입. Astryx 는 완전히 제거됨.
import "@workspace/ui/globals.css"
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
  // 입력 필드(14px)가 16px 미만이어도 iOS Safari 가 포커스 시 화면을 자동 줌인하지 않도록
  // 확대 상한을 1로 고정. (iOS 는 접근성 핀치줌은 대체로 계속 허용.)
  maximumScale: 1,
  // 흰 앱 프레임 상단과 맞춘 상태바 크롬. <meta name="theme-color"> 는 리터럴 색만 허용(토큰 불가).
  // eslint-disable-next-line no-restricted-syntax -- meta theme-color 는 CSS 토큰을 쓸 수 없다
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      // `light` 클래스로 @workspace/ui 토큰을 라이트에 고정(DS 기본 :root=다크). 하이드레이션 전 flash 방지.
      className={`light ${pretendard.variable} ${figtree.variable} ${montserrat.variable}`}
    >
      <body>
        <Providers>
          <div className="app-shell">{children}</div>
        </Providers>
      </body>
    </html>
  )
}
