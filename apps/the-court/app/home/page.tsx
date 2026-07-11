"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  Add01Icon,
  Login03Icon,
  PlusSignCircleIcon,
  Share08Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

// 다이얼로그(생성·참여)는 아직 Astryx — 이번 범위(헤더·드롭다운·방 목록)만 DS 로 교체.
import { Button } from "@astryxdesign/core/Button"
import { Dialog } from "@astryxdesign/core/Dialog"
import { Heading } from "@astryxdesign/core/Heading"
import { HStack, VStack } from "@astryxdesign/core/Layout"
import { TextInput } from "@astryxdesign/core/TextInput"
import { useToast } from "@astryxdesign/core/Toast"

import { Badge } from "@workspace/ui/components/badge"
import { Icon } from "@workspace/ui/components/icon"
import { IconButton } from "@workspace/ui/components/icon-button"
import { ListItem } from "@workspace/ui/components/list-item"
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@workspace/ui/components/menu"
import { PageHeader } from "@workspace/ui/components/page-header"
import { Text } from "@workspace/ui/components/text"

import { loadAuth, type AuthUser } from "@/lib/auth"
import { roomApi } from "@/lib/api"
import { ApiError } from "@/lib/api/client"
import type { RoomListItem, RoomResponse } from "@/lib/api/types"

// 온보딩 이후 도착지. 왼쪽 로고 · 오른쪽 + (생성/참여) · 아래 참여중 채팅방 리스트.
export default function HomePage() {
  const router = useRouter()
  const toast = useToast()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [rooms, setRooms] = useState<RoomListItem[] | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  // 참여코드는 백엔드가 방 목록에 내려주지 않고 방 생성 응답에만 담긴다.
  // 그래서 목록의 공유 버튼은 코드가 없으면(=대부분) 안내만 한다.
  async function copyCode(code: string | undefined, roomTitle: string) {
    if (!code) {
      toast({
        body: "초대코드는 방을 만든 사람이 생성 직후 공유해요",
        autoHideDuration: 3000,
      })
      return
    }
    await navigator.clipboard.writeText(code)
    toast({
      body: `"${roomTitle}" 초대코드 ${code} 복사됨`,
      autoHideDuration: 3000,
    })
  }

  function reloadRooms() {
    roomApi
      .list()
      .then(setRooms)
      .catch(() => setRooms([]))
  }

  useEffect(() => {
    const auth = loadAuth()
    if (!auth) {
      router.replace("/onboarding")
      return
    }
    setUser(auth)
    reloadRooms()
  }, [router])

  if (!user) return null

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      {/* 헤더 — 왼쪽 로고(→ 홈) · 오른쪽 + 프로스티드 드롭다운 */}
      <PageHeader
        align="center"
        className="sticky top-0 z-10 bg-surface-canvas/80 backdrop-blur-xl"
        title={
          <Link href="/home" aria-label="현행범 홈" className="inline-flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hyeonhaengbeom_logo.png"
              alt="현행범"
              className="block h-6 w-auto"
            />
          </Link>
        }
        trailing={
          <Menu>
            <MenuTrigger
              render={
                <IconButton variant="surface" aria-label="채팅방 추가">
                  <Icon icon={Add01Icon} />
                </IconButton>
              }
            />
            <MenuContent align="end" sideOffset={10}>
              <MenuItem
                icon={<Icon icon={PlusSignCircleIcon} />}
                description="새 방을 만들고 초대코드를 공유해요"
                onClick={() => setCreateOpen(true)}
              >
                채팅방 생성하기
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                icon={<Icon icon={Login03Icon} />}
                description="초대코드로 기존 방에 들어가요"
                onClick={() => setJoinOpen(true)}
              >
                채팅방 참여하기
              </MenuItem>
            </MenuContent>
          </Menu>
        }
      />

      {/* 참여중인 채팅방 리스트 */}
      <div className="flex flex-1 flex-col gap-3 px-5 pt-2 pb-10">
        <Text
          as="h2"
          variant="caption"
          tone="tertiary"
          className="px-1 font-strong"
        >
          참여중인 채팅방
        </Text>

        {rooms === null ? (
          <div className="flex justify-center py-14">
            <div
              role="status"
              aria-label="불러오는 중"
              className="size-6 animate-spin rounded-pill border-2 border-border-subtle border-t-text-tertiary motion-reduce:[animation-duration:1.4s]"
            />
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-pill bg-fill-neutral text-text-tertiary">
              <Icon icon={UserGroupIcon} size="lg" />
            </div>
            <div className="flex flex-col gap-1">
              <Text tone="secondary">아직 참여중인 채팅방이 없어요</Text>
              <Text variant="caption" tone="tertiary">
                오른쪽 위 + 로 방을 만들거나 참여해 보세요
              </Text>
            </div>
          </div>
        ) : (
          rooms.map((room) => (
            <Link
              key={room.roomId}
              href={`/chat?roomId=${room.roomId}`}
              className="block rounded-hero border border-border-subtle bg-surface-raised px-4 shadow-elevation-1 transition-[background-color,box-shadow] hover:bg-surface-hover hover:shadow-elevation-2"
            >
              <ListItem
                density="regular"
                divider={false}
                title={room.title}
                meta={
                  <Badge tone="neutral" size="sm">
                    {room.participantCount}명
                  </Badge>
                }
                subtitle="참여 중"
                trailing={
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="초대코드 공유"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      copyCode(undefined, room.title)
                    }}
                  >
                    <Icon icon={Share08Icon} size="sm" />
                  </IconButton>
                }
              />
            </Link>
          ))
        )}
      </div>

      <CreateRoomDialog
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(room) => {
          copyCode(room.participationCode, room.title)
          reloadRooms()
        }}
      />
      <JoinRoomDialog
        isOpen={joinOpen}
        onOpenChange={setJoinOpen}
        onJoined={reloadRooms}
      />
    </div>
  )
}

function CreateRoomDialog({
  isOpen,
  onOpenChange,
  onCreated,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (room: RoomResponse) => void
}) {
  const toast = useToast()
  const [title, setTitle] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!title.trim() || busy) return
    setBusy(true)
    try {
      const room = await roomApi.create({ title })
      onCreated(room)
      setTitle("")
      onOpenChange(false)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "방 생성에 실패했어요"
      toast({ body: msg, autoHideDuration: 3000 })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} width={380}>
      <VStack style={{ gap: 16, padding: 20 }}>
        <Heading level={4}>채팅방 생성하기</Heading>
        <TextInput
          label="방 제목"
          value={title}
          onChange={setTitle}
          placeholder="예: 우리 다이어트 모임"
        />
        <HStack justify="end" style={{ gap: 8 }}>
          <Button
            variant="ghost"
            size="lg"
            label="취소"
            onClick={() => onOpenChange(false)}
          />
          <Button
            variant="primary"
            size="lg"
            label="생성"
            isLoading={busy}
            isDisabled={!title.trim()}
            onClick={submit}
          />
        </HStack>
      </VStack>
    </Dialog>
  )
}

function JoinRoomDialog({
  isOpen,
  onOpenChange,
  onJoined,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onJoined: () => void
}) {
  const toast = useToast()
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!code.trim() || busy) return
    setBusy(true)
    try {
      await roomApi.join({ participationCode: code })
      onJoined()
      setCode("")
      onOpenChange(false)
    } catch (e) {
      const msg =
        e instanceof ApiError && e.isNotFound
          ? "참여코드에 해당하는 방이 없어요"
          : e instanceof ApiError
            ? e.message
            : "참여에 실패했어요"
      toast({ body: msg, autoHideDuration: 3000 })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} width={380}>
      <VStack style={{ gap: 16, padding: 20 }}>
        <Heading level={4}>채팅방 참여하기</Heading>
        <TextInput
          label="참여코드"
          value={code}
          onChange={(v) => setCode(v.toUpperCase())}
          placeholder="예: QWERTZ"
        />
        <HStack justify="end" style={{ gap: 8 }}>
          <Button
            variant="ghost"
            size="lg"
            label="취소"
            onClick={() => onOpenChange(false)}
          />
          <Button
            variant="primary"
            size="lg"
            label="참여"
            isLoading={busy}
            isDisabled={!code.trim()}
            onClick={submit}
          />
        </HStack>
      </VStack>
    </Dialog>
  )
}
