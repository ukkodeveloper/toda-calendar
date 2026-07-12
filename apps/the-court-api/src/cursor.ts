import { z } from "zod"

// GET /rooms/:id/messages 쿼리 파싱 — 순수(테스트 가능).
//   afterSeq → 신규 커서(대화별 seq). 있으면 seq > afterSeq.
//   after    → 레거시 커서(message id). afterSeq 없을 때만 해석 → id > afterId.
//   caseId   → 스레드 스코프(값=재판 스레드, 미지정=방 본문).
//   limit    → 페이지 상한(기본·최대 200). NaN·음수·0 은 검증 에러(→422).
const positiveInt = z.coerce.number().int().positive()

export interface MessagesQuery {
  afterSeq?: number
  afterId?: number
  caseId?: number
  limit: number
}

export function parseMessagesQuery(
  raw: {
    afterSeq?: string
    after?: string
    caseId?: string
    limit?: string
  },
  opts: { defaultLimit: number; maxLimit: number } = {
    defaultLimit: 200,
    maxLimit: 200,
  }
): MessagesQuery {
  const afterSeq =
    raw.afterSeq !== undefined ? positiveInt.parse(raw.afterSeq) : undefined
  // afterSeq 가 있으면 레거시 after 는 무시(신규 커서 우선).
  const afterId =
    afterSeq === undefined && raw.after !== undefined
      ? positiveInt.parse(raw.after)
      : undefined
  const caseId =
    raw.caseId !== undefined ? positiveInt.parse(raw.caseId) : undefined
  const limit =
    raw.limit !== undefined
      ? Math.min(opts.maxLimit, positiveInt.parse(raw.limit))
      : opts.defaultLimit
  return { afterSeq, afterId, caseId, limit }
}
