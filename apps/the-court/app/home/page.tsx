"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Text } from "@astryxdesign/core/Text"
import { Heading } from "@astryxdesign/core/Heading"
import { VStack, HStack } from "@astryxdesign/core/Layout"

import { loadAuth, type AuthUser } from "@/lib/auth"

// 온보딩 이후 도착지. 지금은 로그인된 신원만 보여주는 최소 placeholder.
export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const auth = loadAuth()
    if (!auth) {
      router.replace("/onboarding")
      return
    }
    setUser(auth)
  }, [router])

  if (!user) return null

  return (
    <VStack
      align="center"
      justify="center"
      minHeight="100dvh"
      style={{ maxWidth: 420, margin: "0 auto", padding: "24px", gap: 16 }}
    >
      <HStack align="center" style={{ gap: 12 }}>
        <span
          aria-hidden
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: user.color,
            display: "inline-block",
          }}
        />
        <Heading level={1} type="display-3">
          {user.nickname}
        </Heading>
      </HStack>
      <Text color="secondary">로그인 완료 · 홈 화면은 준비 중이에요</Text>
    </VStack>
  )
}
