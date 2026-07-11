// 인메모리 목 — 백엔드 없이 사건 공표/조회가 돌게. shape 은 domain/api.md 유지.
// 시드는 mock-chat 의 MOCK_CASES 와 맞춰 목격(고발) 시트의 선택지와 어긋나지 않게 한다.
import { MOCK_CASES } from "@/lib/mock-chat"
import type {
  CaseCreateResponse,
  CaseDetailResponse,
  CaseResponse,
  CaseStatus,
  CaseTrialResponse,
  CreateCaseRequest,
} from "./types"

const delay = (ms = 200) => new Promise<void>((r) => setTimeout(r, ms))

// MOCK_CASES(CaseDetailResponse[]) 를 시드로 복사해 인메모리 스토어를 만든다.
const cases: CaseDetailResponse[] = MOCK_CASES.map((c) => ({ ...c }))

let nextCaseId = Math.max(0, ...cases.map((c) => c.caseId)) + 1

function toSummary(c: CaseDetailResponse): CaseResponse {
  return {
    caseId: c.caseId,
    title: c.title,
    status: c.status,
    nickname: c.nickname,
  }
}

export const caseApi = {
  list: async (
    roomId: number,
    status?: CaseStatus
  ): Promise<CaseResponse[]> => {
    await delay()
    return cases
      .filter((c) => (status ? c.status === status : true))
      .map(toSummary)
  },

  listAll: async (): Promise<CaseResponse[]> => {
    await delay()
    return cases.map(toSummary)
  },

  declare: async (
    roomId: number,
    body: CreateCaseRequest
  ): Promise<CaseCreateResponse> => {
    await delay()
    const caseId = nextCaseId++
    const createdAt = new Date().toISOString()
    cases.unshift({
      caseId,
      title: body.title,
      content: body.content,
      status: "DECLARED",
      nickname: "나",
      defendantUuid: "u-me",
      period: body.deadline,
      trialStatus: "STATEMENT",
      trialId: 0,
    })
    return { caseId, status: "DECLARED", createdAt }
  },

  detail: async (caseId: number): Promise<CaseDetailResponse> => {
    await delay()
    const found = cases.find((c) => c.caseId === caseId)
    if (found) return { ...found }
    return {
      caseId,
      title: "사건",
      content: "",
      status: "DECLARED",
      nickname: "나",
      defendantUuid: "u-me",
      period: new Date().toISOString(),
      trialStatus: "STATEMENT",
      trialId: 0,
    }
  },

  latestTrial: async (caseId: number): Promise<CaseTrialResponse> => {
    await delay()
    const found = cases.find((c) => c.caseId === caseId)
    return {
      trialId: found?.trialId ?? 0,
      caseId,
      status: found?.trialStatus ?? "STATEMENT",
    }
  },
}
