// 재판 — 실 REST. 고발(report)·투표·집계·최후진술 종료·선고.
// write=REST → 서버가 결과를 WS broadcast. 여기선 REST 만 호출.
import { http } from "./client"
import type {
  ReportRequest,
  ReportResponse,
  TrialEndResponse,
  TrialParticipantsResponse,
  TrialStatusResponse,
  VoteRequest,
  VoteResponse,
  VoteResultResponse,
} from "./types"

export const trialApi = {
  // POST /api/reports — 고발 → 재판 개시(증거사진 photoId 필수).
  report: (body: ReportRequest): Promise<ReportResponse> =>
    http.post<ReportResponse>("/api/reports", { body }),

  vote: (trialId: number, body: VoteRequest): Promise<VoteResponse> =>
    http.post<VoteResponse>(`/api/trials/${trialId}/votes`, { body }),

  voteResult: (trialId: number): Promise<VoteResultResponse> =>
    http.get<VoteResultResponse>(`/api/trials/${trialId}/votes/result`),

  participants: (trialId: number): Promise<TrialParticipantsResponse> =>
    http.get<TrialParticipantsResponse>(`/api/trials/${trialId}/participants`),

  endStatement: (trialId: number): Promise<TrialStatusResponse> =>
    http.post<TrialStatusResponse>(`/api/trials/${trialId}/statement/end`),

  endTrial: (trialId: number): Promise<TrialEndResponse> =>
    http.post<TrialEndResponse>(`/api/trials/${trialId}/end`),
}
