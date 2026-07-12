"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import {
  Megaphone01Icon,
  Menu01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"

import { CaseCard } from "@workspace/ui/components/case-card"
import { ChatComposer } from "@workspace/ui/components/chat-composer"
import { ChatMessage } from "@workspace/ui/components/chat-message"
import { ChatSystemMessage } from "@workspace/ui/components/chat-system-message"
import { ColorAvatar } from "@workspace/ui/components/color-avatar"
import { Icon } from "@workspace/ui/components/icon"
import { IconButton } from "@workspace/ui/components/icon-button"

import { AppHeader } from "@/components/app-header"
import { type CaseItem, CaseListDrawer } from "@/components/case-list-drawer"
import { DeclareCaseDialog } from "@/components/declare-case-dialog"
import { TrialSheet } from "@/components/trial-sheet"
import { WitnessDialog } from "@/components/witness-dialog"
import { caseApi, chatApi, roomApi } from "@/lib/api"
import { useRoomStream } from "@/lib/api/socket"
import {
  CASE_STATUS_META,
  CaseSubtitle,
  type CaseVisualStatus,
} from "@/lib/case-status"
import { loadAuth } from "@/lib/auth"
import { useStickToBottom } from "@/lib/use-stick-to-bottom"
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
  // 파생 시각 상태 — 카드 색·아이콘·라벨의 단일 근거(case-status).
  status: CaseVisualStatus
  caseTitle: string
  // 피고 = "누구"의 사건인지. 공표 카드는 공표자 본인(자기를 피고로 건다).
  defendantName: string
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

function ChatEventCard({
  card,
  onClickDeclared,
  onClickTrial,
}: {
  card: EventCard
  onClickDeclared: (caseId: number) => void
  onClickTrial: (caseId: number) => void
}) {
  const meta = CASE_STATUS_META[card.status]

  return (
    <CaseCard
      tone={meta.tone}
      statusIcon={meta.icon}
      statusLabel={meta.label}
      avatarSeed={card.defendantName}
      title={card.caseTitle}
      subtitle={
        <CaseSubtitle
          name={card.defendantName}
          description={meta.description}
        />
      }
      onClick={() =>
        card.eventType === "DECLARED"
          ? onClickDeclared(card.caseId)
          : onClickTrial(card.caseId)
      }
    />
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

  // 메시지 리스트 하단 고정(새 메시지·키보드 열림 시 최하단, 위로 보는 중이면 억제).
  const { ref: streamRef, onScroll: onStreamScroll } =
    useStickToBottom<HTMLDivElement>(items)

  // 채팅은 h-viewport 셸(키보드만큼 줄어듦)이라 문서 스크롤이 필요 없다.
  // 이 라우트 동안만 document 스크롤을 잠가, 키보드가 열렸을 때 body(min-h-dvh)의
  // 키보드 뒤 여백으로 러버밴드 스크롤되며 UI 가 가려지는 걸 막는다. iOS26 fixed 버그를
  // 피하려 position:fixed 대신 overflow 잠금만 쓴다. home·onboarding 은 스크롤이 필요해
  // 전역이 아닌 라우트 스코프로 둔다(언마운트 시 원복).
  useEffect(() => {
    const { documentElement: html, body } = document
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
    }
    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    body.style.overscrollBehavior = "none"
    return () => {
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      body.style.overscrollBehavior = prev.bodyOverscroll
    }
  }, [])

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

    let active = true
    // 리셋 setState 를 마이크로태스크로 미뤄 effect 동기 setState(cascading render)를 피한다.
    void Promise.resolve().then(() => {
      if (active) setItems([])
    })
    chatApi
      .messages(roomId)
      .then(appendMessages)
      .catch(() => {})
    // 방 진입 = 읽음. fire-and-forget(실패해도 UX 무영향) — 다음 홈 조회에서 hasUnread 해제.
    roomApi.read(roomId).catch(() => {})
    return () => {
      active = false
    }
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
                status: "on-trial",
                caseTitle: d.title,
                defendantName: d.defendant.nickname,
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
            status: e.verdict === "GUILTY" ? "guilty" : "not-guilty",
            caseTitle: e.defendant.nickname + " 사건",
            defendantName: e.defendant.nickname,
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
  // 공표 = 자기 결심을 거는 것 → 공표자 본인이 곧 피고다.
  const handleDeclared = (caseId: number, title: string) => {
    setItems((prev) => [
      ...prev,
      {
        id: "declared-" + caseId,
        kind: "event",
        eventType: "DECLARED",
        status: "registered",
        caseTitle: title,
        defendantName: loadAuth()?.nickname ?? "나",
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
    <div className="mx-auto flex h-viewport w-full max-w-[480px] flex-col overflow-hidden bg-surface-canvas">
      <AppHeader
        endContent={
          <IconButton
            variant="surface"
            aria-label="사건 목록 열기"
            onClick={() => setIsCaseListOpen(true)}
          >
            <Icon icon={Menu01Icon} />
          </IconButton>
        }
      />

      {/* 메시지 스트림 */}
      <div
        ref={streamRef}
        onScroll={onStreamScroll}
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-4 py-3"
      >
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
              <div key={item.id} className="py-1">
                <ChatEventCard
                  card={item}
                  onClickDeclared={handleEventDeclared}
                  onClickTrial={openTrialByCase}
                />
              </div>
            )
          }

          // ── 일반 채팅 버블 (그룹핑: 첫 발화 이름·마지막 발화 아바타/시간)
          const isOutgoing = item.sender === "user"
          const prev = items[i - 1]
          const next = items[i + 1]
          const prevChat = prev?.kind === "chat" ? prev : null
          const nextChat = next?.kind === "chat" ? next : null

          const isFirstInGroup =
            !prevChat ||
            prevChat.sender !== item.sender ||
            prevChat.name !== item.name
          const isLastInGroup =
            !nextChat ||
            nextChat.sender !== item.sender ||
            nextChat.name !== item.name ||
            nextChat.time !== item.time

          return (
            <ChatMessage
              key={item.id}
              side={isOutgoing ? "outgoing" : "incoming"}
              name={!isOutgoing && isFirstInGroup ? item.name : undefined}
              avatar={
                !isOutgoing && isLastInGroup ? (
                  <ColorAvatar
                    seed={item.name ?? ""}
                    color={item.color}
                    size="xs"
                    animated={false}
                  />
                ) : undefined
              }
              time={isLastInGroup ? item.time : undefined}
            >
              {item.text}
            </ChatMessage>
          )
        })}
      </div>

      {/* 컴포저 */}
      <ChatComposer
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder="메시지를 입력하세요"
        actions={
          <>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="공표하기 (사건 등록)"
              className="text-text-primary"
              onClick={() => setIsDeclareOpen(true)}
            >
              <Icon icon={Megaphone01Icon} />
            </IconButton>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="고발하기 (목격 등록)"
              className="text-text-primary"
              onClick={() => setIsWitnessOpen(true)}
            >
              <Icon icon={ViewIcon} />
            </IconButton>
          </>
        }
      />

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
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  )
}
