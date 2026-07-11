// 사건 — 실 REST. 공표/목록/상세/최신재판. 4단 UI status 는 CaseSummary 필드에서 파생.
import { http } from "./client"
import type {
  CaseCreateResponse,
  CaseDetailResponse,
  CaseStatus,
  CaseSummaryList,
  CaseTrialResponse,
  CreateCaseRequest,
} from "./types"

export const caseApi = {
  // GET /api/rooms/:id/cases[?status] — status 미지정 시 진행중(CLOSED 제외).
  list: (roomId: number, status?: CaseStatus): Promise<CaseSummaryList> =>
    http.get<CaseSummaryList>(
      `/api/rooms/${roomId}/cases${status ? `?status=${status}` : ""}`
    ),

  // GET /api/rooms/:id/cases/all — 종료 포함 전체.
  listAll: (roomId: number): Promise<CaseSummaryList> =>
    http.get<CaseSummaryList>(`/api/rooms/${roomId}/cases/all`),

  declare: (
    roomId: number,
    body: CreateCaseRequest
  ): Promise<CaseCreateResponse> =>
    http.post<CaseCreateResponse>(`/api/rooms/${roomId}/cases`, { body }),

  detail: (caseId: number): Promise<CaseDetailResponse> =>
    http.get<CaseDetailResponse>(`/api/cases/${caseId}`),

  latestTrial: (caseId: number): Promise<CaseTrialResponse> =>
    http.get<CaseTrialResponse>(`/api/cases/${caseId}/trial`),
}
