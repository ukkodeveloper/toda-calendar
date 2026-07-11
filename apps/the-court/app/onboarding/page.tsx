"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Text } from "@astryxdesign/core/Text"
import { VStack } from "@astryxdesign/core/Layout"

import { Button } from "@workspace/ui/components/button"
import { ColorAvatar } from "@workspace/ui/components/color-avatar"

import { isLoggedIn, login } from "@/lib/auth"
import { userApi } from "@/lib/api/user"
import type { Identity } from "@/lib/identity"

// 아바타 지름(px). 이 값만 바꾸면 크기 조정.
const AVATAR_SIZE = 160

export default function OnboardingPage() {
  const router = useRouter()
  const [identity, setIdentity] = useState<Identity | null>(null)

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace("/home")
      return
    }
    userApi.randomNickname().then(setIdentity)
  }, [router])

  const reroll = () => {
    userApi.randomNickname().then(setIdentity)
  }

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
      style={{ maxWidth: 420, margin: "0 auto", padding: "28px 24px 40px" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hyeonhaengbeom_logo.png"
        alt="현행범"
        height={32}
        style={{ height: 32, width: "auto", display: "block" }}
      />

      <VStack align="center" justify="center" style={{ gap: 24, flex: 1 }}>
        <button
          type="button"
          onClick={reroll}
          aria-label="닉네임 다시 뽑기"
          style={{
            border: "none",
            padding: 0,
            background: "none",
            lineHeight: 0,
            cursor: "pointer",
          }}
        >
          <ColorAvatar
            seed={identity.nickname}
            color={identity.color}
            size={AVATAR_SIZE}
            label={identity.nickname}
          />
        </button>

        <Text
          style={{
            fontSize: 20,
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
        onClick={start}
        className="h-16 w-full text-lg"
      >
        현행범 시작하기
      </Button>
    </VStack>
  )
}
