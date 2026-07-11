"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import { Icon } from "@astryxdesign/core/Icon"
import { IconButton } from "@astryxdesign/core/IconButton"
import { HStack, VStack } from "@astryxdesign/core/Layout"
import { Text } from "@astryxdesign/core/Text"

import { ColorAvatar } from "@workspace/ui/components/color-avatar"
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
import { caseApi, chatApi } from "@/lib/api"
import { useRoomStream } from "@/lib/api/socket"
import { loadAuth } from "@/lib/auth"
import type { MessageResponse, TrialStatus } from "@/lib/api/types"

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

type SystemItem = {
  id: string
  kind: "system"
  text: string
}

type EventCard = {
  id: string
  kind: "event"
  eventType: "DECLARED" | "TRIAL_STARTED" | "TRIAL_ENDED"
  caseTitle: string
  caseId: number
  trialId?: number
  time: string
}

type ListItem = ChatItem | SystemItem | EventCard

// 재판 시트에 넘길 최소 정보.
type OpenTrial = {
  trialId: number
  caseId: number
  title: string
  status: TrialStatus
  defendantUuid: string
}

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

// 실 메시지(MessageResponse) → 방 스트림 아이템.
//   SYSTEM  → 시스템 메시지(공표·고발·선고 알림).
//   USER + caseId null → 방 채팅 버블.
//   USER + caseId 값 → 재판 스레드 발언(방 뷰에선 숨김).
function messageToItem(
  m: MessageResponse,
  myUuid: string | null
): ListItem | null {
  if (m.type === "SYSTEM") {
    return { id: `m-${m.messageId}`, kind: "system", text: m.content }
  }
  if (m.caseId !== null) return null
  return {
    id: `m-${m.messageId}`,
    kind: "chat",
    sender: m.user && m.user.uuid === myUuid ? "user" : "assistant",
    name: m.user?.nickname,
    color: m.user?.color,
    text: m.content,
    time: formatTime(m.createdAt),
  }
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
  const myUuid = loadAuth()?.uuid ?? null

  const [items, setItems] = useState<ListItem[]>([])
  const [value, setValue] = useState("")
  const [isDeclareOpen, setIsDeclareOpen] = useState(false)
  const [isWitnessOpen, setIsWitnessOpen] = useState(false)
  const [isCaseListOpen, setIsCaseListOpen] = useState(false)
  const [trialCase, setTrialCase] = useState<OpenTrial | null>(null)
  const [highlightCaseId, setHighlightCaseId] = useState<number | undefined>()

  // 중복 방지(WS echo·재연결 백필) + 백필 커서(마지막 messageId).
  const seenIds = useRef<Set<string>>(new Set())
  const lastMessageId = useRef<number>(0)

  const appendMessages = useCallback(
    (msgs: MessageResponse[]) => {
      const next: ListItem[] = []
      for (const m of msgs) {
        if (m.messageId > lastMessageId.current)
          lastMessageId.current = m.messageId
        const item = messageToItem(m, myUuid)
        if (!item) continue
        if (seenIds.current.has(item.id)) continue
        seenIds.current.add(item.id)
        next.push(item)
      }
      if (next.length) setItems((prev) => [...prev, ...next])
    },
    [myUuid]
  )

  // 초기 이력 로드.
  useEffect(() => {
    if (!roomId || Number.isNaN(roomId)) return
    seenIds.current = new Set()
    lastMessageId.current = 0
    setItems([])
    chatApi
      .messages(roomId)
      .then(appendMessages)
      .catch(() => {})
  }, [roomId, appendMessages])

  // 실시간 스트림.
  const { sendChat } = useRoomStream(
    roomId && !Number.isNaN(roomId) ? roomId : null,
    {
      onChatMessage: (m) => appendMessages([m]),
      onTrialStarted: (e) => {
        // 재판 시작 카드 — 클릭 시 caseId 로 상세를 받아 시트를 연다.
        const id = `trial-started-${e.trialId}`
        if (seenIds.current.has(id)) return
        seenIds.current.add(id)
        caseApi
          .detail(e.caseId)
          .then((d) =>
            setItems((prev) => [
              ...prev,
              {
                id,
                kind: "event",
                eventType: "TRIAL_STARTED",
                caseTitle: d.title,
                caseId: e.caseId,
                trialId: e.trialId,
                time: formatTime(new Date().toISOString()),
              },
            ])
          )
          .catch(() => {})
      },
      onVerdictRevealed: (e) => {
        const id = `verdict-${e.trialId}`
        if (seenIds.current.has(id)) return
        seenIds.current.add(id)
        setItems((prev) => [
          ...prev,
          {
            id,
            kind: "event",
            eventType: "TRIAL_ENDED",
            caseTitle: e.defendant.nickname + " 사건",
            caseId: 0,
            trialId: e.trialId,
            time: formatTime(new Date().toISOString()),
          },
        ])
      },
      // 재연결 시 놓친 메시지를 REST 로 백필.
      onReconnect: () => {
        chatApi
          .messages(roomId, { after: lastMessageId.current })
          .then(appendMessages)
          .catch(() => {})
      },
    }
  )

  // 이벤트 카드 클릭 핸들러
  const handleEventDeclared = (caseId: number) => {
    setHighlightCaseId(caseId)
    setIsCaseListOpen(true)
  }

  // caseId 로 상세를 받아 재판 시트를 연다.
  const openTrialByCase = (caseId: number) => {
    caseApi
      .detail(caseId)
      .then((d) => {
        if (d.trialId == null) return
        setTrialCase({
          trialId: d.trialId,
          caseId: d.caseId,
          title: d.title,
          status: d.trialStatus ?? "STATEMENT",
          defendantUuid: d.defendant.uuid,
        })
      })
      .catch(() => {})
  }

  // 사건 공표 완료 콜백 — 로컬 DECLARED 카드(공표자 즉시 피드백).
  const handleDeclared = (caseId: number, title: string) => {
    setItems((prev) => [
      ...prev,
      {
        id: "declared-" + caseId,
        kind: "event",
        eventType: "DECLARED",
        caseTitle: title,
        caseId,
        time: "방금",
      },
    ])
  }

  const handleCaseSelect = (c: CaseItem) => {
    setIsCaseListOpen(false)
    setHighlightCaseId(undefined)
    if (c.trialId != null && c.caseStatus !== "DECLARED") {
      setTrialCase({
        trialId: c.trialId,
        caseId: c.caseId,
        title: c.title,
        status: c.trialStatus ?? "STATEMENT",
        defendantUuid: c.defendant.uuid,
      })
    }
  }

  const handleSubmit = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    // 발신은 서버로만 — 서버가 저장 후 chat:message 로 echo 하면 그때 렌더(유령 메시지 방지).
    sendChat({ content: trimmed })
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
            // ── 시스템 알림
            if (item.kind === "system") {
              return (
                <ChatSystemMessage key={item.id} variant="default">
                  {item.text}
                </ChatSystemMessage>
              )
            }

            // ── 이벤트 카드
            if (item.kind === "event") {
              return (
                <div key={item.id} style={{ padding: "4px 16px" }}>
                  <ChatEventCard
                    card={item}
                    onClickDeclared={handleEventDeclared}
                    onClickTrial={openTrialByCase}
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
                    <ColorAvatar
                      seed={item.name ?? ""}
                      color={item.color}
                      size="sm"
                      animated={false}
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

      {trialCase ? (
        <TrialSheet
          isOpen={!!trialCase}
          onClose={() => setTrialCase(null)}
          trialId={trialCase.trialId}
          caseId={trialCase.caseId}
          roomId={roomId}
          caseTitle={trialCase.title}
          initialStatus={trialCase.status}
          currentUserUuid={myUuid ?? ""}
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
