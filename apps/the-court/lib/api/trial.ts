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
  report: (body: ReportRequest) =>
    http.post<ReportResponse>("/api/reports", { body }),

  vote: (trialId: number, body: VoteRequest) =>
    http.post<VoteResponse>(`/api/trials/${trialId}/votes`, { body }),

  voteResult: (trialId: number) =>
    http.get<VoteResultResponse>(`/api/trials/${trialId}/votes/result`),

  participants: (trialId: number) =>
    http.get<TrialParticipantsResponse>(`/api/trials/${trialId}/participants`),

  endStatement: (trialId: number) =>
    http.post<TrialStatusResponse>(`/api/trials/${trialId}/statement/end`),

  endTrial: (trialId: number) =>
    http.post<TrialEndResponse>(`/api/trials/${trialId}/end`),
}
