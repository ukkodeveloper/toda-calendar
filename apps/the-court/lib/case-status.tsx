import {
  CheckmarkBadge01Icon,
  JusticeScale01Icon,
  LegalHammerIcon,
  Megaphone01Icon,
} from "@hugeicons/core-free-icons"

import type { CaseCardTone } from "@workspace/ui/components/case-card"
import type { IconSvgElement } from "@workspace/ui/components/icon"

import type { TrialStatus, Verdict } from "@/lib/api/types"

/**
 * 사건의 시각 상태 — 저장 enum(caseStatus/trialStatus/verdict)에서 파생(저장 X).
 * DS CaseCard 는 도메인을 모른다(UI 속성만). 도메인→tone/icon/label 매핑은 여기가 소유한다.
 *
 * 계약(case.ts:25-41) 기준:
 *   registered  = trialStatus null            (DECLARED, 재판 전)
 *   on-trial    = trialStatus STATEMENT|VOTING
 *   guilty      = trialStatus ENDED & GUILTY
 *   not-guilty  = trialStatus ENDED & NOT_GUILTY
 */
export type CaseVisualStatus =
  | "registered"
  | "on-trial"
  | "guilty"
  | "not-guilty"

export function deriveCaseStatus(input: {
  trialStatus: TrialStatus | null
  verdict: Verdict | null
}): CaseVisualStatus {
  if (input.trialStatus === "ENDED") {
    return input.verdict === "GUILTY" ? "guilty" : "not-guilty"
  }
  if (input.trialStatus === "STATEMENT" || input.trialStatus === "VOTING") {
    return "on-trial"
  }
  return "registered"
}

export const CASE_STATUS_META: Record<
  CaseVisualStatus,
  {
    tone: CaseCardTone
    icon: IconSvgElement
    /** 우측 pill 라벨(짧게). */
    label: string
    /** 부제 상태 문구. */
    description: string
  }
> = {
  registered: {
    tone: "neutral",
    icon: Megaphone01Icon,
    label: "접수",
    description: "접수됨",
  },
  "on-trial": {
    tone: "brand",
    icon: JusticeScale01Icon,
    label: "재판 중",
    description: "재판 진행 중",
  },
  guilty: {
    tone: "danger",
    icon: LegalHammerIcon,
    label: "유죄",
    description: "선고 완료",
  },
  "not-guilty": {
    tone: "success",
    icon: CheckmarkBadge01Icon,
    label: "무죄",
    description: "선고 완료",
  },
}

/** "피고 {이름} · {상태}" 부제 — 피고 이름을 강조해 "누구"를 또렷하게. */
export function CaseSubtitle({
  name,
  description,
}: {
  name: string
  description: string
}) {
  return (
    <>
      피고 <span className="font-strong text-text-secondary">{name}</span> ·{" "}
      {description}
    </>
  )
}
