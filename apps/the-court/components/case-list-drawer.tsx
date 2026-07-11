"use client"

import { useEffect, useState } from "react"

import {
  ArrowRight01Icon,
  Cancel01Icon,
  JusticeScale01Icon,
  LegalHammerIcon,
  Megaphone01Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

import { ActionCard } from "@workspace/ui/components/action-card"
import { Badge, type BadgeTone } from "@workspace/ui/components/badge"
import { DetentSheet } from "@workspace/ui/components/detent-sheet"
import { Icon } from "@workspace/ui/components/icon"
import { IconButton } from "@workspace/ui/components/icon-button"
import { Text } from "@workspace/ui/components/text"

import { caseApi } from "@/lib/api"
import type { CaseStatus, CaseSummary } from "@/lib/api/types"

// 사건 목록 아이템 = 계약 CaseSummary(4단 UI 파생 필드 포함).
export type CaseItem = CaseSummary

const STATUS_META: Record<
  CaseStatus,
  {
    icon: IconSvgElement
    tone: "brand" | "danger" | "neutral"
    badgeTone: BadgeTone
    badge: string
    description: string
  }
> = {
  DECLARED: {
    icon: Megaphone01Icon,
    tone: "brand",
    badgeTone: "brand",
    badge: "공표됨",
    description: "공표됨 · 고발 대기 중",
  },
  ON_TRIAL: {
    icon: JusticeScale01Icon,
    tone: "danger",
    badgeTone: "danger",
    badge: "재판중",
    description: "재판 진행 중",
  },
  CLOSED: {
    icon: LegalHammerIcon,
    tone: "neutral",
    badgeTone: "neutral",
    badge: "종결",
    description: "선고 완료",
  },
}

export function CaseListDrawer({
  isOpen,
  onClose,
  roomId,
  onSelect,
  highlightCaseId,
}: {
  isOpen: boolean
  onClose: () => void
  roomId: number
  onSelect?: (c: CaseSummary) => void
  highlightCaseId?: number
}) {
  const [cases, setCases] = useState<CaseSummary[]>([])
  const [loading, setLoading] = useState(false)

  // 열릴 때마다 최신 사건 목록(종료 포함)을 실 백엔드에서 로드.
  useEffect(() => {
    if (!isOpen || !roomId) return
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await caseApi.listAll(roomId)
        if (active) setCases(data)
      } catch {
        if (active) setCases([])
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [isOpen, roomId])

  return (
    <DetentSheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      fill
      title="사건 목록"
      description="공표된 사건과 진행 중인 재판을 한눈에 봐요"
      trailingAccessory={
        <IconButton variant="ghost" aria-label="닫기" onClick={onClose}>
          <Icon icon={Cancel01Icon} />
        </IconButton>
      }
    >
      {loading ? (
        <div className="flex justify-center py-14">
          <div
            role="status"
            aria-label="불러오는 중"
            className="size-6 animate-spin rounded-pill border-2 border-border-subtle border-t-text-tertiary motion-reduce:[animation-duration:1.4s]"
          />
        </div>
      ) : cases.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <Text tone="secondary">아직 등록된 사건이 없어요</Text>
          <Text variant="caption" tone="tertiary">
            채팅에서 공표하면 여기에 쌓여요
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 py-2">
          {cases.map((c) => {
            const meta = STATUS_META[c.caseStatus]
            const isHighlighted = c.caseId === highlightCaseId
            return (
              <ActionCard
                key={c.caseId}
                leading={<Icon icon={meta.icon} />}
                leadingTone={meta.tone}
                title={c.title}
                subtitle={meta.description}
                trailing={
                  <div className="flex items-center gap-2">
                    <Badge tone={meta.badgeTone} size="sm">
                      {meta.badge}
                    </Badge>
                    <Icon icon={ArrowRight01Icon} size="sm" />
                  </div>
                }
                onClick={() => onSelect?.(c)}
                className={
                  isHighlighted
                    ? "border-border-brand ring-2 ring-ring-focus"
                    : undefined
                }
              />
            )
          })}
        </div>
      )}
    </DetentSheet>
  )
}
