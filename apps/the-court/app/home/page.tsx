"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@astryxdesign/core/Badge"
import { Button } from "@astryxdesign/core/Button"
import { ClickableCard } from "@astryxdesign/core/ClickableCard"
import { Dialog } from "@astryxdesign/core/Dialog"
import { DropdownMenu, DropdownMenuItem } from "@astryxdesign/core/DropdownMenu"
import { Heading } from "@astryxdesign/core/Heading"
import { HStack, VStack } from "@astryxdesign/core/Layout"
import { Spinner } from "@astryxdesign/core/Spinner"
import { Text } from "@astryxdesign/core/Text"
import { TextInput } from "@astryxdesign/core/TextInput"

import { AppHeader } from "@/components/app-header"
import { loadAuth, type AuthUser } from "@/lib/auth"
import { createRoom, getRooms, joinRoom, type Room } from "@/lib/rooms"

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 2v12M2 8h12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// 온보딩 이후 도착지. 왼쪽 로고 · 오른쪽 + (생성/참여) · 아래 참여중 채팅방 리스트.
export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  useEffect(() => {
    const auth = loadAuth()
    if (!auth) {
      router.replace("/onboarding")
      return
    }
    setUser(auth)
    getRooms().then(setRooms)
  }, [router])

  if (!user) return null

  return (
    <VStack style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh" }}>
      {/* 헤더 — 왼쪽 로고(공통) · 오른쪽 + 드롭다운 */}
      <AppHeader
        endContent={
          <DropdownMenu
            hasChevron={false}
            placement="below"
            menuWidth={256}
            button={{
              label: "채팅방 추가",
              isIconOnly: true,
              variant: "primary",
              size: "lg",
              icon: <PlusIcon />,
            }}
          >
            <DropdownMenuItem
              label="채팅방 생성하기"
              description="새 방을 만들고 초대코드를 공유해요"
              onClick={() => setCreateOpen(true)}
            />
            <DropdownMenuItem
              label="채팅방 참여하기"
              description="초대코드로 기존 방에 들어가요"
              onClick={() => setJoinOpen(true)}
            />
          </DropdownMenu>
        }
      />

      {/* 참여중인 채팅방 리스트 */}
      <VStack style={{ gap: 12, padding: "20px 20px 40px", flex: 1 }}>
        <Heading level={6} style={{ paddingInline: 4 }}>
          참여중인 채팅방
        </Heading>

        {rooms === null ? (
          <HStack justify="center" style={{ padding: 40 }}>
            <Spinner />
          </HStack>
        ) : rooms.length === 0 ? (
          <VStack
            align="center"
            justify="center"
            style={{ gap: 6, padding: "56px 24px", textAlign: "center" }}
          >
            <Text color="secondary">아직 참여중인 채팅방이 없어요</Text>
            <Text color="disabled" type="supporting">
              오른쪽 위 + 로 방을 만들거나 참여해 보세요
            </Text>
          </VStack>
        ) : (
          rooms.map((room) => (
            <ClickableCard
              key={room.roomId}
              label={room.title}
              href={`/chat?roomId=${room.roomId}`}
            >
              <HStack
                align="center"
                justify="between"
                style={{ gap: 12, padding: "6px 0" }}
              >
                <VStack style={{ gap: 4, minWidth: 0 }}>
                  <Heading level={5}>{room.title}</Heading>
                  <Text color="secondary" type="supporting">
                    {room.participantCount}명 참여 중
                  </Text>
                </VStack>
                <Badge variant="info" label={`${room.participantCount}명`} />
              </HStack>
            </ClickableCard>
          ))
        )}
      </VStack>

      <CreateRoomDialog
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(room) => setRooms((prev) => [room, ...(prev ?? [])])}
      />
      <JoinRoomDialog
        isOpen={joinOpen}
        onOpenChange={setJoinOpen}
        onJoined={(room) => setRooms((prev) => [room, ...(prev ?? [])])}
      />
    </VStack>
  )
}

function CreateRoomDialog({
  isOpen,
  onOpenChange,
  onCreated,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (room: Room) => void
}) {
  const [title, setTitle] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!title.trim() || busy) return
    setBusy(true)
    const { room } = await createRoom(title)
    onCreated(room)
    setBusy(false)
    setTitle("")
    onOpenChange(false)
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
  onJoined: (room: Room) => void
}) {
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!code.trim() || busy) return
    setBusy(true)
    const room = await joinRoom(code)
    onJoined(room)
    setBusy(false)
    setCode("")
    onOpenChange(false)
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
