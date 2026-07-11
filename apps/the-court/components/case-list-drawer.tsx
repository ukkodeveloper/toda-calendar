"use client"

import { useEffect, useState } from "react"

import { Cancel01Icon } from "@hugeicons/core-free-icons"

import { CaseCard } from "@workspace/ui/components/case-card"
import { DetentSheet } from "@workspace/ui/components/detent-sheet"
import { Icon } from "@workspace/ui/components/icon"
import { IconButton } from "@workspace/ui/components/icon-button"
import { Text } from "@workspace/ui/components/text"

import { caseApi } from "@/lib/api"
import type { CaseSummary } from "@/lib/api/types"
import {
  CASE_STATUS_META,
  CaseSubtitle,
  deriveCaseStatus,
} from "@/lib/case-status"

// 사건 목록 아이템 = 계약 CaseSummary(4단 UI 파생 필드 포함).
export type CaseItem = CaseSummary

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
            const meta = CASE_STATUS_META[deriveCaseStatus(c)]
            return (
              <CaseCard
                key={c.caseId}
                tone={meta.tone}
                statusIcon={meta.icon}
                statusLabel={meta.label}
                avatarSeed={c.defendant.nickname}
                title={c.title}
                subtitle={
                  <CaseSubtitle
                    name={c.defendant.nickname}
                    description={meta.description}
                  />
                }
                selected={c.caseId === highlightCaseId}
                onClick={() => onSelect?.(c)}
              />
            )
          })}
        </div>
      )}
    </DetentSheet>
  )
}
