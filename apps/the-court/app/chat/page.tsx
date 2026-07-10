"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import { Icon } from "@astryxdesign/core/Icon"
import { IconButton } from "@astryxdesign/core/IconButton"
import { HStack, VStack } from "@astryxdesign/core/Layout"
import { Avatar } from "@astryxdesign/core/Avatar"
import { Text } from "@astryxdesign/core/Text"
import {
  ChatComposer,
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
  ChatMessageMetadata,
  ChatSystemMessage,
} from "@astryxdesign/core/Chat"

import { AppHeader } from "@/components/app-header"
import { type CaseItem, CaseListDrawer } from "@/components/case-list-drawer"
import { DeclareIcon, WitnessIcon } from "@/components/chat-action-icons"
import { DeclareCaseDialog } from "@/components/declare-case-dialog"
import { TrialSheet } from "@/components/trial-sheet"
import { WitnessDialog } from "@/components/witness-dialog"
import { colorAvatarSrc } from "@/lib/avatar"
import { caseApi, chatApi } from "@/lib/api"
import { useRoomSocket } from "@/lib/api/socket"
import { loadAuth } from "@/lib/auth"
import type { TrialStatus } from "@/lib/api/types"

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type Sender = "user" | "assistant"

type ChatItem = {
  id: string
  kind: "chat"
  sender: Sender
  name?: string
  color?: string
  text: string
  time: string
}

type EventCard = {
  id: string
  kind: "event"
  eventType: "DECLARED" | "TRIAL_STARTED" | "TRIAL_ENDED"
  caseTitle: string
  caseId: number
  trialId?: number
  eventTrialStatus?: TrialStatus
  time: string
}

type ListItem = ChatItem | EventCard

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes()
  return (
    (h < 12 ? "오전" : "오후") +
    " " +
    (h % 12 || 12) +
    ":" +
    String(m).padStart(2, "0")
  )
}

// ─── 이벤트 카드 ─────────────────────────────────────────────────────────────

const EVENT_META: Record<
  EventCard["eventType"],
  { icon: string; subtitle: string }
> = {
  DECLARED: { icon: "📋", subtitle: "사건 공표됨 · 클릭해서 확인" },
  TRIAL_STARTED: {
    icon: "⚖️",
    subtitle: "재판이 시작되었습니다 · 클릭해서 입장",
  },
  TRIAL_ENDED: {
    icon: "🔨",
    subtitle: "재판이 종료되었습니다 · 클릭해서 결과 보기",
  },
}

function ChatEventCard({
  card,
  onClickDeclared,
  onClickTrial,
}: {
  card: EventCard
  onClickDeclared: (caseId: number) => void
  onClickTrial: (caseId: number) => void
}) {
  const { icon, subtitle } = EVENT_META[card.eventType]

  const handleClick = () => {
    if (card.eventType === "DECLARED") {
      onClickDeclared(card.caseId)
    } else {
      onClickTrial(card.caseId)
    }
  }

  return (
    <button
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "12px 14px",
        borderRadius: "var(--radius-container, 12px)",
        background: "var(--color-background-surface, rgba(0,0,0,0.04))",
        border: "1px solid var(--color-border, rgba(0,0,0,0.08))",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--radius-element, 8px)",
          background: "var(--color-background-body, #fff)",
          border: "1px solid var(--color-border, rgba(0,0,0,0.08))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 20,
        }}
      >
        {icon}
      </div>
      <VStack style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Text
          weight="semibold"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {card.caseTitle}
        </Text>
        <Text color="secondary" size="sm">
          {subtitle}
        </Text>
      </VStack>
      <Icon icon="chevronRight" size="sm" />
    </button>
  )
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

function ChatPageInner() {
  const searchParams = useSearchParams()
  const roomId = Number(searchParams.get("roomId") ?? 0)

  const [currentUserUuid, setCurrentUserUuid] = useState("")
  const [items, setItems] = useState<ListItem[]>([])
  const [value, setValue] = useState("")
  const [isDeclareOpen, setIsDeclareOpen] = useState(false)
  const [isWitnessOpen, setIsWitnessOpen] = useState(false)
  const [isCaseListOpen, setIsCaseListOpen] = useState(false)
  const [trialCase, setTrialCase] = useState<CaseItem | null>(null)
  const [highlightCaseId, setHighlightCaseId] = useState<number | undefined>()
  const [canDeclare, setCanDeclare] = useState(true)

  // trialId → caseId 맵 (TRIAL_ENDED 페이로드에 caseId가 없어 역추적용)
  const trialCaseMap = useRef<Map<number, number>>(new Map())

  // 초기 로드
  useEffect(() => {
    const auth = loadAuth()
    if (auth) setCurrentUserUuid(auth.uuid)
    if (!roomId) return

    // 공표 가능 여부: 본인 사건이 DECLARED/ON_TRIAL 이면 비활성화
    caseApi
      .listAll(roomId)
      .then((cases) => {
        const a = loadAuth()
        if (!a) return
        const hasActive = cases.some(
          (c) =>
            c.nickname === a.nickname &&
            (c.status === "DECLARED" || c.status === "ON_TRIAL")
        )
        setCanDeclare(!hasActive)
      })
      .catch(() => {})

    chatApi
      .messages(roomId)
      .then((msgs) => {
        const auth2 = loadAuth()
        const chatItems: ChatItem[] = msgs
          .filter((m) => m.caseId === null)
          .map((m) => ({
            id: String(m.messageId),
            kind: "chat" as const,
            sender: (auth2 && m.user.uuid === auth2.uuid
              ? "user"
              : "assistant") as Sender,
            name: m.user.nickname,
            color: m.user.color,
            text: m.content,
            time: formatTime(m.createdAt),
          }))
        setItems(chatItems)
      })
      .catch(() => {})
  }, [roomId])

  // 소켓 — 방 채팅 + 이벤트 카드
  const socketRef = useRoomSocket(roomId || null, {
    CHAT: (payload) => {
      if (payload.caseId !== null) return
      const auth = loadAuth()
      setItems((prev) => [
        ...prev,
        {
          id: String(payload.messageId),
          kind: "chat" as const,
          sender: (auth && payload.user.uuid === auth.uuid
            ? "user"
            : "assistant") as Sender,
          name: payload.user.nickname,
          color: payload.user.color,
          text: payload.content,
          time: formatTime(payload.createdAt),
        },
      ])
    },
    TRIAL_STARTED: (payload) => {
      const cardId = "trial-started-" + payload.trialId
      trialCaseMap.current.set(payload.trialId, payload.caseId)
      // 카드 즉시 추가 (제목은 비동기 패치 후 업데이트)
      setItems((prev) => [
        ...prev,
        {
          id: cardId,
          kind: "event" as const,
          eventType: "TRIAL_STARTED" as const,
          caseTitle: "사건 #" + payload.caseId,
          caseId: payload.caseId,
          trialId: payload.trialId,
          eventTrialStatus: payload.status,
          time: "방금",
        },
      ])
      caseApi
        .detail(payload.caseId)
        .then((detail) => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === cardId ? { ...item, caseTitle: detail.title } : item
            )
          )
        })
        .catch(() => {})
    },
    TRIAL_ENDED: (payload) => {
      const caseId = trialCaseMap.current.get(payload.trialId)
      if (!caseId) return
      const cardId = "trial-ended-" + payload.trialId
      setItems((prev) => [
        ...prev,
        {
          id: cardId,
          kind: "event" as const,
          eventType: "TRIAL_ENDED" as const,
          caseTitle: "사건 #" + caseId,
          caseId,
          trialId: payload.trialId,
          time: "방금",
        },
      ])
      caseApi
        .detail(caseId)
        .then((detail) => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === cardId ? { ...item, caseTitle: detail.title } : item
            )
          )
        })
        .catch(() => {})
      // 내 사건이 종료됐을 수 있으므로 공표 가능 여부 재확인
      const auth = loadAuth()
      if (auth) {
        caseApi
          .listAll(roomId)
          .then((cases) => {
            const hasActive = cases.some(
              (c) =>
                c.nickname === auth.nickname &&
                (c.status === "DECLARED" || c.status === "ON_TRIAL")
            )
            setCanDeclare(!hasActive)
          })
          .catch(() => {})
      }
    },
  })

  // 이벤트 카드 클릭 핸들러
  const handleEventDeclared = (caseId: number) => {
    setHighlightCaseId(caseId)
    setIsCaseListOpen(true)
  }

  const handleEventTrial = (caseId: number) => {
    caseApi
      .detail(caseId)
      .then((detail) => {
        if (detail.trialId) setTrialCase(detail)
      })
      .catch(() => {})
  }

  // 사건 공표 완료 콜백
  const handleDeclared = (caseId: number, title: string) => {
    setCanDeclare(false) // 공표 직후 즉시 비활성화
    const cardId = "declared-" + caseId
    setItems((prev) => [
      ...prev,
      {
        id: cardId,
        kind: "event" as const,
        eventType: "DECLARED" as const,
        caseTitle: title,
        caseId,
        time: "방금",
      },
    ])
  }

  const handleCaseSelect = (c: CaseItem) => {
    setIsCaseListOpen(false)
    setHighlightCaseId(undefined)
    if (c.trialId && c.status !== "DECLARED") {
      setTrialCase(c)
    }
  }

  const handleSubmit = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    socketRef.current?.sendChat(trimmed)
    setValue("")
  }

  return (
    <VStack
      height="100dvh"
      style={{
        maxWidth: 480,
        margin: "0 auto",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <AppHeader
        endContent={
          <IconButton
            label="메뉴 열기"
            variant="ghost"
            icon={<Icon icon="menu" size="lg" />}
            onClick={() => setIsCaseListOpen(true)}
          />
        }
      />

      <ChatLayout
        composer={
          <ChatComposer
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
            placeholder="메시지를 입력하세요"
            headerActions={
              <HStack align="center" gap={2}>
                <IconButton
                  label="공표하기 (사건 등록)"
                  variant="ghost"
                  size="sm"
                  icon={<Icon icon={DeclareIcon} size="md" />}
                  onClick={() => setIsDeclareOpen(true)}
                  isDisabled={!canDeclare}
                />
                <IconButton
                  label="고발하기 (목격 등록)"
                  variant="ghost"
                  size="sm"
                  icon={<Icon icon={WitnessIcon} size="md" />}
                  onClick={() => setIsWitnessOpen(true)}
                />
              </HStack>
            }
          />
        }
      >
        <ChatMessageList>
          <ChatSystemMessage variant="divider">오늘</ChatSystemMessage>
          {items.map((item, i) => {
            // ── 이벤트 카드
            if (item.kind === "event") {
              return (
                <div key={item.id} style={{ padding: "4px 16px" }}>
                  <ChatEventCard
                    card={item}
                    onClickDeclared={handleEventDeclared}
                    onClickTrial={handleEventTrial}
                  />
                </div>
              )
            }

            // ── 일반 채팅 버블
            const next = items[i + 1]
            const nextChat = next?.kind === "chat" ? next : null
            const isLastInGroup =
              !nextChat ||
              nextChat.sender !== item.sender ||
              nextChat.name !== item.name ||
              nextChat.time !== item.time

            return (
              <ChatMessage
                key={item.id}
                sender={item.sender}
                name={item.name}
                avatar={
                  item.sender === "assistant" ? (
                    <Avatar
                      name={item.name ?? ""}
                      src={item.color ? colorAvatarSrc(item.color) : undefined}
                      size="small"
                    />
                  ) : undefined
                }
              >
                <ChatMessageBubble>{item.text}</ChatMessageBubble>
                {isLastInGroup && <ChatMessageMetadata timestamp={item.time} />}
              </ChatMessage>
            )
          })}
        </ChatMessageList>
      </ChatLayout>

      <WitnessDialog
        isOpen={isWitnessOpen}
        onClose={() => setIsWitnessOpen(false)}
        roomId={roomId}
      />

      <DeclareCaseDialog
        isOpen={isDeclareOpen}
        onOpenChange={setIsDeclareOpen}
        roomId={roomId}
        onDeclared={handleDeclared}
      />

      <CaseListDrawer
        isOpen={isCaseListOpen}
        onClose={() => {
          setIsCaseListOpen(false)
          setHighlightCaseId(undefined)
        }}
        roomId={roomId}
        onSelect={handleCaseSelect}
        highlightCaseId={highlightCaseId}
      />

      {trialCase && trialCase.trialId ? (
        <TrialSheet
          isOpen={!!trialCase}
          onClose={() => setTrialCase(null)}
          trialId={trialCase.trialId}
          caseId={trialCase.caseId}
          roomId={roomId}
          caseTitle={trialCase.title}
          initialStatus={trialCase.trialStatus}
          currentUserUuid={currentUserUuid}
          defendantUuid={trialCase.defendantUuid}
        />
      ) : null}
    </VStack>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  )
}
