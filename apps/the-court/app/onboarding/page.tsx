"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/button"
import { ColorAvatar } from "@workspace/ui/components/color-avatar"
import { Text } from "@workspace/ui/components/text"

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
    <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col items-center justify-between px-6 pt-7 pb-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hyeonhaengbeom_logo.png"
        alt="현행범"
        height={32}
        className="block h-8 w-auto"
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <button
          type="button"
          onClick={reroll}
          aria-label="닉네임 다시 뽑기"
          className="cursor-pointer border-0 bg-none p-0 leading-none"
        >
          <ColorAvatar
            seed={identity.nickname}
            color={identity.color}
            size={AVATAR_SIZE}
            label={identity.nickname}
          />
        </button>

        <Text as="h1" variant="title" align="center">
          {identity.nickname}
        </Text>
      </div>

      <Button variant="primary" size="xl" onClick={start} className="w-full">
        현행범 시작하기
      </Button>
    </div>
  )
}
