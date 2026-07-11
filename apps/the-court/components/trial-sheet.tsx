"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { Badge } from "@astryxdesign/core/Badge"
import { Banner } from "@astryxdesign/core/Banner"
import { Button } from "@astryxdesign/core/Button"
import {
  ChatComposer,
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
  ChatMessageMetadata,
  ChatSystemMessage,
} from "@astryxdesign/core/Chat"
import { Divider } from "@astryxdesign/core/Divider"
import { Icon } from "@astryxdesign/core/Icon"
import { IconButton } from "@astryxdesign/core/IconButton"
import { HStack, VStack } from "@astryxdesign/core/Layout"
import { Text } from "@astryxdesign/core/Text"

import { ColorAvatar } from "@workspace/ui/components/color-avatar"

import { chatApi, trialApi } from "@/lib/api"
import { sendChatMessage, useTrialStream } from "@/lib/api/socket"
import type { MessageResponse, TrialEndResponse } from "@/lib/api/types"

// ─────────────────────────── 타입 ───────────────────────────

export type TrialStatus = "STATEMENT" | "VOTING" | "ENDED"
type VoteChoice = "GUILTY" | "NOT_GUILTY"

type Participant = {
  uuid: string
  nickname: string
  color?: string
  isDefendant: boolean
}

type TrialMessage = {
  id: string
  senderUuid: string
  nickname: string
  color?: string
  text: string
  time: string
  isSystem?: boolean
}

export interface TrialSheetProps {
  isOpen: boolean
  onClose: () => void
  trialId: number
  caseId: number
  roomId: number
  caseTitle: string
  initialStatus: TrialStatus
  currentUserUuid: string
  defendantUuid: string
}

// ─────────────────────────── 시간 포매터 ───────────────────────────

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

// 실 메시지 → 재판 스레드 메시지.
function toTrialMessage(m: MessageResponse): TrialMessage {
  return {
    id: `m-${m.messageId}`,
    senderUuid: m.user?.uuid ?? "system",
    nickname: m.user?.nickname ?? "",
    color: m.user?.color,
    text: m.content,
    time: formatTime(m.createdAt),
    isSystem: m.type === "SYSTEM",
  }
}

// ─────────────────────────── 참여자 원 ───────────────────────────

function ParticipantCircle({
  participant,
  vote,
}: {
  participant: Participant
  vote: VoteChoice | undefined
}) {
  const isGray = !participant.isDefendant && vote === undefined

  return (
    <VStack align="center" gap={1} style={{ minWidth: 56 }}>
      <div style={{ position: "relative", display: "inline-flex" }}>
        <ColorAvatar
          seed={participant.nickname}
          color={participant.color}
          size={48}
          animated={false}
          style={isGray ? { filter: "grayscale(1)", opacity: 0.4 } : undefined}
        />

        {participant.isDefendant && (
          <span
            style={{ position: "absolute", top: -6, right: -4, fontSize: 13 }}
          >
            ⚖️
          </span>
        )}

        {vote && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              background:
                vote === "GUILTY"
                  ? "rgba(34, 197, 94, 0.88)"
                  : "rgba(239, 68, 68, 0.88)",
            }}
          >
            {vote === "GUILTY" ? "✓" : "✗"}
          </div>
        )}
      </div>

      <Text size="sm" color="secondary" style={{ textAlign: "center" }}>
        {participant.nickname.slice(0, 4)}
      </Text>
    </VStack>
  )
}

// ─────────────────────────── 상태 메타 ───────────────────────────

const STATUS_META: Record<
  TrialStatus,
  { label: string; badgeVariant: "warning" | "error" | "neutral" }
> = {
  STATEMENT: { label: "최후진술", badgeVariant: "warning" },
  VOTING: { label: "평결중", badgeVariant: "error" },
  ENDED: { label: "선고", badgeVariant: "neutral" },
}

// ─────────────────────────── 메인 컴포넌트 ───────────────────────────

export function TrialSheet({
  isOpen,
  onClose,
  trialId,
  caseId,
  roomId,
  caseTitle,
  initialStatus,
  currentUserUuid,
  defendantUuid,
}: TrialSheetProps) {
  // SSR 방지 — portal은 document.body 필요
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [trialStatus, setTrialStatus] = useState<TrialStatus>(initialStatus)
  const [messages, setMessages] = useState<TrialMessage[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [verdictResult, setVerdictResult] = useState<TrialEndResponse | null>(
    null
  )
  const [value, setValue] = useState("")
  // 내 표만 알 수 있다(백엔드는 개인 투표를 노출하지 않음).
  // 최종 집계 수치는 선고 응답/verdict:revealed 의 verdictResult 에 담겨 온다.
  const [votes, setVotes] = useState<Record<string, VoteChoice>>({})

  const seenIds = useRef<Set<string>>(new Set())
  const lastMessageId = useRef<number>(0)

  const appendThread = useCallback(
    (msgs: MessageResponse[]) => {
      const next: TrialMessage[] = []
      for (const m of msgs) {
        if (m.caseId !== caseId) continue
        if (m.messageId > lastMessageId.current)
          lastMessageId.current = m.messageId
        const id = `m-${m.messageId}`
        if (seenIds.current.has(id)) continue
        seenIds.current.add(id)
        next.push(toTrialMessage(m))
      }
      if (next.length) setMessages((prev) => [...prev, ...next])
    },
    [caseId]
  )

  // 시트가 열리는 동안 body 스크롤 잠금
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // 초기 데이터 로드 — 참여자·스레드 이력·투표 상태.
  useEffect(() => {
    if (!isOpen) return
    seenIds.current = new Set()
    lastMessageId.current = 0
    setMessages([])
    setVerdictResult(null)

    trialApi
      .participants(trialId)
      .then((p) => {
        setParticipants([
          { ...p.defendant },
          ...p.witnesses.map((w) => ({ ...w })),
        ])
      })
      .catch(() => {})

    chatApi
      .messages(roomId, { caseId })
      .then(appendThread)
      .catch(() => {})

    trialApi
      .voteResult(trialId)
      .then((r) => {
        setTrialStatus(r.status)
        if (r.myVote !== null) {
          setVotes({ [currentUserUuid]: r.myVote ? "GUILTY" : "NOT_GUILTY" })
        }
      })
      .catch(() => {})
  }, [isOpen, trialId, roomId, caseId, currentUserUuid, appendThread])

  // 실시간 재판 스트림.
  useTrialStream(isOpen ? trialId : null, {
    onChatMessage: (m) => appendThread([m]),
    onTrialStatus: (e) => setTrialStatus(e.status),
    onVerdictRevealed: (e) => {
      setTrialStatus("ENDED")
      setVerdictResult({
        trialId: e.trialId,
        status: "ENDED",
        verdict: e.verdict,
        guiltyCount: e.guiltyCount,
        notGuiltyCount: e.notGuiltyCount,
        defendant: e.defendant,
        caseStatus: e.caseStatus,
      })
    },
    onReconnect: () => {
      chatApi
        .messages(roomId, { caseId })
        .then(appendThread)
        .catch(() => {})
      trialApi
        .voteResult(trialId)
        .then((r) => setTrialStatus(r.status))
        .catch(() => {})
    },
  })

  const isDefendant = currentUserUuid === defendantUuid
  const myVote = votes[currentUserUuid]
  const canChat =
    trialStatus === "VOTING" ||
    trialStatus === "ENDED" ||
    (trialStatus === "STATEMENT" && isDefendant)

  const { label: statusLabel, badgeVariant } = STATUS_META[trialStatus]

  const handleSend = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    // 서버로만 발신 — 저장 후 chat:message echo 로 렌더(스레드는 caseId 로 라우팅).
    sendChatMessage({ roomId, caseId, content: trimmed })
    setValue("")
  }

  const handleEndStatement = () => {
    trialApi
      .endStatement(trialId)
      .then((r) => setTrialStatus(r.status))
      .catch(() => {})
  }

  const handleVote = (guilty: boolean) => {
    // 낙관적 표시 — 서버 확정/집계는 vote:updated 로 반영.
    setVotes((prev) => ({
      ...prev,
      [currentUserUuid]: guilty ? "GUILTY" : "NOT_GUILTY",
    }))
    trialApi.vote(trialId, { guilty }).catch(() => {})
  }

  const handleEndTrial = () => {
    trialApi
      .endTrial(trialId)
      .then((r) => {
        setTrialStatus("ENDED")
        setVerdictResult(r)
      })
      .catch(() => {})
  }

  const composerAction =
    trialStatus === "STATEMENT" && isDefendant ? (
      <Button
        label="최후진술 종료"
        variant="destructive"
        size="sm"
        onClick={handleEndStatement}
      />
    ) : trialStatus === "VOTING" ? (
      <Button
        label="평결 마감"
        variant="primary"
        size="sm"
        onClick={handleEndTrial}
      />
    ) : undefined

  if (!mounted || !isOpen) return null

  return createPortal(
    <>
      {/* ── 딤 배경 */}
      <div
        aria-hidden
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "rgba(0, 0, 0, 0.5)",
        }}
      />

      {/* ── 바텀시트 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`재판: ${caseTitle}`}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 201,
          height: "80dvh",
          display: "flex",
          flexDirection: "column",
          background: "var(--color-background-body, #fff)",
          borderRadius: "var(--radius-page, 28px) var(--radius-page, 28px) 0 0",
          overflow: "hidden",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* 핸들 */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0 6px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 99,
              background: "var(--color-border, rgba(128,128,128,0.3))",
            }}
          />
        </div>

        {/* 헤더 */}
        <HStack
          align="center"
          gap={2}
          style={{ padding: "0 12px 10px", flexShrink: 0 }}
        >
          <IconButton
            label="닫기"
            variant="ghost"
            size="sm"
            icon={<Icon icon="chevronLeft" size="md" />}
            onClick={onClose}
          />
          <Text
            weight="semibold"
            style={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {caseTitle}
          </Text>
          <Badge variant={badgeVariant} label={statusLabel} />
        </HStack>

        <Divider />

        {/* ── 선고 배너 */}
        {trialStatus === "ENDED" && verdictResult && (
          <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
            <Banner
              status={verdictResult.verdict === "GUILTY" ? "error" : "success"}
              title={
                verdictResult.verdict === "GUILTY"
                  ? "유죄 확정 🔨"
                  : "무죄 선고 ⚖️"
              }
              description={
                verdictResult.verdict === "GUILTY"
                  ? "현행범에게 전과가 +1 추가됩니다."
                  : "사건은 이행 기간까지 존속되며 재고발이 가능합니다."
              }
            />
          </div>
        )}

        {/* ── 평결중: 참여자 + 투표 UI */}
        {trialStatus === "VOTING" && (
          <>
            <VStack
              style={{ padding: "16px 16px 12px", flexShrink: 0 }}
              gap={4}
            >
              <HStack gap={4} justify="center" style={{ flexWrap: "wrap" }}>
                {participants.map((p) => (
                  <ParticipantCircle
                    key={p.uuid}
                    participant={p}
                    vote={votes[p.uuid]}
                  />
                ))}
              </HStack>

              {!isDefendant && !myVote && (
                <HStack gap={2}>
                  <Button
                    label="✓ 유죄"
                    variant="primary"
                    size="lg"
                    style={{ flex: 1 }}
                    onClick={() => handleVote(true)}
                  />
                  <Button
                    label="✗ 무죄"
                    variant="ghost"
                    size="lg"
                    style={{ flex: 1 }}
                    onClick={() => handleVote(false)}
                  />
                </HStack>
              )}

              {!isDefendant && myVote && (
                <HStack
                  align="center"
                  justify="center"
                  style={{
                    padding: "10px",
                    borderRadius: "var(--radius-element, 8px)",
                    background:
                      "var(--color-background-surface, rgba(0,0,0,0.04))",
                  }}
                >
                  <Text color="secondary" size="sm">
                    {myVote === "GUILTY"
                      ? "✓ 유죄로 투표했습니다"
                      : "✗ 무죄로 투표했습니다"}
                  </Text>
                </HStack>
              )}

              {isDefendant && (
                <Text
                  color="secondary"
                  size="sm"
                  style={{ textAlign: "center" }}
                >
                  현행범은 투표에 참여할 수 없습니다
                </Text>
              )}
            </VStack>
            <Divider />
          </>
        )}

        {/* ── 재판 채팅 (나머지 공간 전부) */}
        <VStack style={{ flex: 1, minHeight: 0, position: "relative" }}>
          <ChatLayout
            style={{ flex: 1, minHeight: 0 } as React.CSSProperties}
            composer={
              <ChatComposer
                value={value}
                onChange={setValue}
                onSubmit={handleSend}
                isDisabled={!canChat}
                placeholder={
                  !canChat
                    ? "최후진술 중에는 현행범만 발언할 수 있습니다"
                    : "재판 발언을 입력하세요"
                }
                headerActions={composerAction}
              />
            }
          >
            <ChatMessageList>
              <ChatSystemMessage variant="divider">재판 시작</ChatSystemMessage>
              {messages.map((m, i) => {
                if (m.isSystem) {
                  return (
                    <ChatSystemMessage key={m.id} variant="default">
                      {m.text}
                    </ChatSystemMessage>
                  )
                }
                const isMine = m.senderUuid === currentUserUuid
                const next = messages[i + 1]
                const isLastInGroup =
                  !next ||
                  next.senderUuid !== m.senderUuid ||
                  next.time !== m.time
                return (
                  <ChatMessage
                    key={m.id}
                    sender={isMine ? "user" : "assistant"}
                    name={isMine ? undefined : m.nickname}
                    avatar={
                      !isMine ? (
                        <ColorAvatar
                          seed={m.nickname}
                          color={m.color}
                          size="sm"
                          animated={false}
                        />
                      ) : undefined
                    }
                  >
                    <ChatMessageBubble>{m.text}</ChatMessageBubble>
                    {isLastInGroup && (
                      <ChatMessageMetadata timestamp={m.time} />
                    )}
                  </ChatMessage>
                )
              })}
            </ChatMessageList>
          </ChatLayout>

          {/* ── 선고 결과 오버레이 */}
          {trialStatus === "ENDED" && verdictResult && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.92)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                zIndex: 50,
              }}
            >
              <Text style={{ fontSize: 72, lineHeight: 1 }}>🔨</Text>
              <VStack align="center" gap={3}>
                <Text
                  weight="bold"
                  style={{
                    fontSize: "2rem",
                    color:
                      verdictResult.verdict === "GUILTY"
                        ? "var(--color-text-red, #ef4444)"
                        : "var(--color-text-green, #22c55e)",
                  }}
                >
                  {verdictResult.verdict === "GUILTY" ? "유 죄" : "무 죄"}
                </Text>
                <Badge
                  variant={
                    verdictResult.verdict === "GUILTY" ? "error" : "success"
                  }
                  label={
                    verdictResult.verdict === "GUILTY" ? "전과자" : "모범시민"
                  }
                />
                <Text color="secondary" size="sm">
                  {"유죄 " +
                    verdictResult.guiltyCount +
                    " : 무죄 " +
                    verdictResult.notGuiltyCount}
                </Text>
                {verdictResult.verdict === "GUILTY" && (
                  <Text color="secondary" size="sm">
                    {"전과 " + verdictResult.defendant.convictionCount + "회"}
                  </Text>
                )}
              </VStack>
              <Button
                label="닫기"
                variant="ghost"
                size="lg"
                onClick={onClose}
              />
            </div>
          )}
        </VStack>
      </div>
    </>,
    document.body
  )
}
