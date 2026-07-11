"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { LegalHammerIcon } from "@hugeicons/core-free-icons"
import { motion, useReducedMotion } from "framer-motion"

import { Badge } from "@workspace/ui/components/badge"
import { BottomSheet } from "@workspace/ui/components/bottom-sheet"
import { Button } from "@workspace/ui/components/button"
import { ChatComposer } from "@workspace/ui/components/chat-composer"
import { ChatMessage } from "@workspace/ui/components/chat-message"
import { ChatSystemMessage } from "@workspace/ui/components/chat-system-message"
import { ColorAvatar } from "@workspace/ui/components/color-avatar"
import { Icon } from "@workspace/ui/components/icon"
import { NoticeBanner } from "@workspace/ui/components/notice-banner"
import { Text } from "@workspace/ui/components/text"
import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

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
    <div className="flex min-w-14 flex-col items-center gap-1.5">
      <div className="relative inline-flex">
        <ColorAvatar
          seed={participant.nickname}
          color={participant.color}
          size={48}
          animated={false}
          className={isGray ? "opacity-40 grayscale" : undefined}
        />

        {participant.isDefendant ? (
          <span className="absolute -top-1.5 -right-1 text-caption">⚖️</span>
        ) : null}

        {vote ? (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-pill text-body font-strong text-text-on-fill",
              vote === "GUILTY" ? "bg-fill-success/90" : "bg-fill-danger/90"
            )}
          >
            {vote === "GUILTY" ? "✓" : "✗"}
          </div>
        ) : null}
      </div>

      <Text variant="label" tone="secondary" align="center">
        {participant.nickname.slice(0, 4)}
      </Text>
    </div>
  )
}

// ─────────────────────────── 상태 메타 ───────────────────────────

const STATUS_META: Record<
  TrialStatus,
  { label: string; tone: "brand" | "danger" | "neutral" }
> = {
  STATEMENT: { label: "최후진술", tone: "brand" },
  VOTING: { label: "평결중", tone: "danger" },
  ENDED: { label: "선고", tone: "neutral" },
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
  const reducedMotion = useReducedMotion()

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

  const threadRef = useRef<HTMLDivElement>(null)
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

  // 초기 데이터 로드 — 참여자·스레드 이력·투표 상태.
  useEffect(() => {
    if (!isOpen) return
    seenIds.current = new Set()
    lastMessageId.current = 0

    let active = true
    // 리셋 setState 를 마이크로태스크로 미뤄 effect 동기 setState(cascading render)를 피한다.
    // 네트워크 .then 보다 먼저 실행되므로 reset→load 순서는 그대로다.
    void Promise.resolve().then(() => {
      if (!active) return
      setMessages([])
      setVerdictResult(null)
    })

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

    return () => {
      active = false
    }
  }, [isOpen, trialId, roomId, caseId, currentUserUuid, appendThread])

  // 새 발언이 오면 스레드 하단으로.
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

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

  const { label: statusLabel, tone: statusTone } = STATUS_META[trialStatus]

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
        variant="danger"
        size="lg"
        className="w-full"
        onClick={handleEndStatement}
      >
        최후진술 종료
      </Button>
    ) : trialStatus === "VOTING" ? (
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleEndTrial}
      >
        평결 마감
      </Button>
    ) : null

  const isGuilty = verdictResult?.verdict === "GUILTY"

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      draggable={false}
      title={caseTitle}
      trailingAccessory={<Badge tone={statusTone}>{statusLabel}</Badge>}
      className="h-[85dvh]"
      scrollable={false}
      contentClassName="relative flex flex-col p-0"
    >
      {/* ── 선고 배너 */}
      {trialStatus === "ENDED" && verdictResult ? (
        <div className="shrink-0 px-4 pt-3">
          <NoticeBanner
            tone={isGuilty ? "warning" : "success"}
            title={
              isGuilty
                ? "유죄 확정 · 현행범에게 전과가 +1 추가돼요"
                : "무죄 선고 · 이행 기간까지 사건이 존속돼요"
            }
          />
        </div>
      ) : null}

      {/* ── 평결중: 참여자 + 투표 UI */}
      {trialStatus === "VOTING" ? (
        <div className="flex shrink-0 flex-col gap-4 border-b border-border-subtle px-4 pt-4 pb-4">
          <div className="flex flex-wrap justify-center gap-4">
            {participants.map((p) => (
              <ParticipantCircle
                key={p.uuid}
                participant={p}
                vote={votes[p.uuid]}
              />
            ))}
          </div>

          {!isDefendant && !myVote ? (
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => handleVote(true)}
              >
                유죄로 투표
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => handleVote(false)}
              >
                무죄로 투표
              </Button>
            </div>
          ) : null}

          {!isDefendant && myVote ? (
            <div className="flex items-center justify-center rounded-panel bg-fill-neutral px-4 py-2.5">
              <Text variant="caption" tone="secondary">
                {myVote === "GUILTY"
                  ? "유죄로 투표했어요"
                  : "무죄로 투표했어요"}
              </Text>
            </div>
          ) : null}

          {isDefendant ? (
            <Text variant="caption" tone="tertiary" align="center">
              현행범은 투표에 참여할 수 없어요
            </Text>
          ) : null}
        </div>
      ) : null}

      {/* ── 재판 채팅 스레드 (나머지 공간 전부) */}
      <div
        ref={threadRef}
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3"
      >
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
          const prev = messages[i - 1]
          const next = messages[i + 1]
          const isFirstInGroup = !prev || prev.senderUuid !== m.senderUuid
          const isLastInGroup =
            !next || next.senderUuid !== m.senderUuid || next.time !== m.time
          return (
            <ChatMessage
              key={m.id}
              side={isMine ? "outgoing" : "incoming"}
              name={!isMine && isFirstInGroup ? m.nickname : undefined}
              avatar={
                !isMine && isLastInGroup ? (
                  <ColorAvatar
                    seed={m.nickname}
                    color={m.color}
                    size="xs"
                    animated={false}
                  />
                ) : undefined
              }
              time={isLastInGroup ? m.time : undefined}
            >
              {m.text}
            </ChatMessage>
          )
        })}
      </div>

      {/* ── 액션 버튼(최후진술 종료 / 평결 마감) */}
      {composerAction ? (
        <div className="shrink-0 border-t border-border-subtle px-4 pt-3">
          {composerAction}
        </div>
      ) : null}

      {/* ── 컴포저 */}
      <ChatComposer
        value={value}
        onChange={setValue}
        onSubmit={handleSend}
        disabled={!canChat}
        placeholder={
          !canChat
            ? "최후진술 중에는 현행범만 발언할 수 있어요"
            : "재판 발언을 입력하세요"
        }
        className={composerAction ? "border-t-0" : undefined}
      />

      {/* ── 선고 결과 오버레이 (히어로 리빌) */}
      {trialStatus === "ENDED" && verdictResult ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: reducedMotion
              ? motionTokens.duration.instant
              : motionTokens.duration.base,
            ease: motionTokens.ease.enter,
          }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-surface-canvas px-6 text-center"
        >
          <motion.div
            initial={
              reducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }
            }
            animate={{ scale: 1, opacity: 1 }}
            transition={
              reducedMotion
                ? { duration: motionTokens.duration.instant }
                : motionTokens.spring.preview
            }
            className={isGuilty ? "text-fill-danger" : "text-fill-success"}
          >
            <Icon icon={LegalHammerIcon} className="size-16" />
          </motion.div>

          <div className="flex flex-col items-center gap-3">
            <Text
              as="p"
              variant="display"
              tone={isGuilty ? "danger" : "success"}
              className="font-strong tracking-[0.2em]"
            >
              {isGuilty ? "유 죄" : "무 죄"}
            </Text>
            <Badge tone={isGuilty ? "danger" : "success"} size="lg">
              {isGuilty ? "전과자" : "모범시민"}
            </Badge>
            <Text variant="caption" tone="secondary">
              {"유죄 " +
                verdictResult.guiltyCount +
                " : 무죄 " +
                verdictResult.notGuiltyCount}
            </Text>
            {isGuilty ? (
              <Text variant="caption" tone="tertiary">
                {"전과 " + verdictResult.defendant.convictionCount + "회"}
              </Text>
            ) : null}
          </div>

          <Button variant="neutral" size="lg" onClick={onClose}>
            닫기
          </Button>
        </motion.div>
      ) : null}
    </BottomSheet>
  )
}
