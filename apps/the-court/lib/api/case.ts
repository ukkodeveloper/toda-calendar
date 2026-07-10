import { http } from "./client"
import type {
  CaseCreateResponse,
  CaseDetailResponse,
  CaseResponse,
  CaseStatus,
  CaseTrialResponse,
  CreateCaseRequest,
} from "./types"

export const caseApi = {
  list: (roomId: number, status?: CaseStatus) => {
    const query = status ? `?status=${status}` : ""
    return http.get<CaseResponse[]>(`/api/rooms/${roomId}/cases${query}`)
  },

  listAll: (roomId: number) =>
    http.get<CaseResponse[]>(`/api/rooms/${roomId}/cases/all`),

  declare: (roomId: number, body: CreateCaseRequest) =>
    http.post<CaseCreateResponse>(`/api/rooms/${roomId}/cases`, { body }),

  detail: (caseId: number) =>
    http.get<CaseDetailResponse>(`/api/cases/${caseId}`),

  latestTrial: (caseId: number) =>
    http.get<CaseTrialResponse>(`/api/cases/${caseId}/trial`),
}
