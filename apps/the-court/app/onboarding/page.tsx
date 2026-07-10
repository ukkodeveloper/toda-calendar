"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@astryxdesign/core/Button"
import { Text } from "@astryxdesign/core/Text"
import { VStack } from "@astryxdesign/core/Layout"

import { isLoggedIn, login } from "@/lib/auth"
import { generateIdentity, type Identity } from "@/lib/identity"

// 색 원 지름(px). 스펙은 40 이지만 32px 닉네임 옆에서 너무 작아 160 으로 키움.
// 40 으로 되돌리려면 이 값만 바꾸면 된다.
const AVATAR_SIZE = 160

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

  const reroll = () => setIdentity(generateIdentity())

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
        <button
          type="button"
          onClick={reroll}
          aria-label="닉네임 다시 뽑기"
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: "50%",
            background: identity.color,
            border: "none",
            padding: 0,
            cursor: "pointer",
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

        <Button
          variant="ghost"
          size="sm"
          label="🎲 다시 뽑기"
          onClick={reroll}
        />
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
