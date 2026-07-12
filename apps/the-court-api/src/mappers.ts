import type {
  CaseDetailResponse,
  CaseSummary,
  MessageResponse,
  UserTitle,
} from "@workspace/contracts"
import type { Case, Message, Photo, Trial, User } from "@prisma/client"

// prisma row → 계약 DTO 순수 변환. repository 아님(레이어 셋 유지).

// 최후진술 표시용 창(비권위 — 스케줄러 없음, 프론트가 실제 카운트다운). plan 결정#1.
export const STATEMENT_WINDOW_MS = 2 * 60 * 60 * 1000 // 2h

export function remainingSecondsFrom(statementEndsAt: Date | null): number {
  if (!statementEndsAt) return 0
  const ms = statementEndsAt.getTime() - Date.now()
  return ms > 0 ? Math.floor(ms / 1000) : 0
}

type CaseWithTrials = Case & { trials: Trial[] }

// trials 는 orderBy id desc take 1 로 최신 1건만 담아 넘긴다.
export function toCaseSummary(
  c: CaseWithTrials,
  defendantNickname: string
): CaseSummary {
  const latest = c.trials[0] ?? null
  return {
    caseId: c.id,
    title: c.title,
    caseStatus: c.status,
    trialStatus: latest?.status ?? null,
    verdict: latest?.verdict ?? null,
    defendant: { uuid: c.defendantUuid, nickname: defendantNickname },
    startDate: c.startDate.toISOString(),
    deadline: c.deadline.toISOString(),
    trialId: latest?.id ?? null,
  }
}

export function toCaseDetail(
  c: CaseWithTrials,
  defendantNickname: string
): CaseDetailResponse {
  const latest = c.trials[0] ?? null
  return {
    caseId: c.id,
    title: c.title,
    content: c.content,
    caseStatus: c.status,
    defendant: { uuid: c.defendantUuid, nickname: defendantNickname },
    startDate: c.startDate.toISOString(),
    deadline: c.deadline.toISOString(),
    trialStatus: latest?.status ?? null,
    trialId: latest?.id ?? null,
    verdict: latest?.verdict ?? null,
  }
}

type MessageWithRefs = Message & { user: User | null; photo: Photo | null }

// title 은 방별(Member) 칭호 — 호출부에서 (roomId,userUuid) 로 조회해 넘긴다.
export function toMessageResponse(
  m: MessageWithRefs,
  memberTitle: UserTitle | null
): MessageResponse {
  return {
    // BIGINT → number: JSON.stringify 는 bigint 에서 예외. 2^53 전까지 안전(단일 메시지 테이블).
    messageId: Number(m.id),
    seq: Number(m.seq),
    type: m.type,
    caseId: m.caseId,
    content: m.content,
    photoId: m.photoId,
    photo: m.photo ? { photoId: m.photo.id, url: m.photo.url } : null,
    user:
      m.user && m.userUuid
        ? {
            uuid: m.userUuid,
            nickname: m.user.nickname,
            title: memberTitle ?? "CITIZEN",
            color: m.user.color,
          }
        : null,
    clientMsgId: m.clientMsgId,
    createdAt: m.createdAt.toISOString(),
  }
}
