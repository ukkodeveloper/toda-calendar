"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@astryxdesign/core/Button"
import { Text } from "@astryxdesign/core/Text"
import { VStack } from "@astryxdesign/core/Layout"

import { isLoggedIn, login } from "@/lib/auth"
import { generateIdentity, type Identity } from "@/lib/identity"

// 색 원 지름(px). 이 값만 바꾸면 크기 조정.
const AVATAR_SIZE = 200

export default function OnboardingPage() {
  const router = useRouter()
  const [identity, setIdentity] = useState<Identity | null>(null)

  // 이미 로그인돼 있으면 온보딩을 건너뛰고 홈으로.
  useEffect(() => {
    if (isLoggedIn()) {
      router.replace("/home")
      return
    }
    setIdentity(generateIdentity())
  }, [router])

  const start = async () => {
    if (!identity) return
    await login(identity)
    router.push("/home")
  }

  // 리다이렉트 판단 전 / 이미 로그인된 경우엔 아무것도 그리지 않는다.
  if (!identity) return null

  return (
    <VStack
      align="center"
      justify="between"
      minHeight="100dvh"
      style={{ maxWidth: 420, margin: "0 auto", padding: "56px 24px 40px" }}
    >
      <VStack align="center" justify="center" style={{ gap: 24, flex: 1 }}>
        <div
          aria-hidden
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: "50%",
            background: identity.color,
          }}
        />

        <Text
          style={{
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          {identity.nickname}
        </Text>
      </VStack>

      <Button
        variant="primary"
        size="lg"
        label="현행범 시작하기"
        clickAction={start}
        style={{ width: "100%" }}
      />
    </VStack>
  )
}
