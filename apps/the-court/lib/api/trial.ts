// 인메모리 목 — 백엔드 없이 고발(report)·투표·평결이 돌게. shape 은 domain/api.md 유지.
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

const delay = (ms = 220) => new Promise<void>((r) => setTimeout(r, ms))

let nextTrialId = 100
let nextReportId = 100

export const trialApi = {
  report: async (body: ReportRequest): Promise<ReportResponse> => {
    await delay()
    return {
      reportId: nextReportId++,
      caseId: body.caseId,
      trialId: nextTrialId++,
      caseStatus: "ON_TRIAL",
      trialStatus: "STATEMENT",
    }
  },

  vote: async (trialId: number, body: VoteRequest): Promise<VoteResponse> => {
    await delay()
    return { trialId, guilty: body.guilty, votedCount: 1, totalVoters: 3 }
  },

  voteResult: async (trialId: number): Promise<VoteResultResponse> => {
    await delay()
    return {
      trialId,
      status: "VOTING",
      guiltyCount: 2,
      notGuiltyCount: 1,
      votedCount: 3,
      totalVoters: 3,
      verdict: "GUILTY",
      hasVoted: false,
      myVote: false,
      remainingSeconds: 0,
    }
  },

  participants: async (trialId: number): Promise<TrialParticipantsResponse> => {
    await delay()
    return {
      trialId,
      caseId: 0,
      status: "STATEMENT",
      defendant: {
        uuid: "u-penguin",
        nickname: "성난 펭귄",
        isDefendant: true,
      },
      witnesses: [
        { uuid: "u-tiger", nickname: "억울한 호랑이", isDefendant: false },
        { uuid: "u-panda", nickname: "느긋한 판다", isDefendant: false },
      ],
      statementEndsAt: new Date().toISOString(),
    }
  },

  endStatement: async (trialId: number): Promise<TrialStatusResponse> => {
    await delay()
    return { trialId, status: "VOTING" }
  },

  endTrial: async (trialId: number): Promise<TrialEndResponse> => {
    await delay()
    return {
      trialId,
      status: "ENDED",
      verdict: "GUILTY",
      guiltyCount: 2,
      notGuiltyCount: 1,
      defendant: {
        uuid: "u-penguin",
        nickname: "성난 펭귄",
        newTitle: "EX_CONVICT",
        convictionCount: 1,
      },
      caseStatus: "CLOSED",
    }
  },
}
