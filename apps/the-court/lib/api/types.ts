// ─── Enums ───────────────────────────────────────────────────────────────────

export type CaseStatus = "DECLARED" | "ON_TRIAL" | "CLOSED"
export type TrialStatus = "STATEMENT" | "VOTING" | "ENDED"
export type Verdict = "GUILTY" | "NOT_GUILTY"
export type UserTitle = "CITIZEN" | "MODEL_CITIZEN" | "EX_CONVICT"

// ─── User ────────────────────────────────────────────────────────────────────

export interface CreateUserRequest {
  nickname: string
  color: string
}

export interface UserResponse {
  uuid: string
  nickname: string
  color: string
}

export interface NicknameResponse {
  nickname: string
  color: string
}

export interface UserSummary {
  uuid: string
  nickname: string
  title: UserTitle
  color: string
}

// ─── Room ────────────────────────────────────────────────────────────────────

export interface CreateRoomRequest {
  title: string
}

export interface RoomResponse {
  roomId: number
  title: string
  participationCode: string
  createdAt: string
}

export interface RoomListResponse {
  roomId: number
  title: string
  participationCode: string
  participantCount: number
}

export interface RoomDetailResponse {
  roomId: number
  title: string
  participantCount: number
  myTitle: UserTitle
}

export interface JoinRoomRequest {
  participationCode: string
}

export interface JoinRoomResponse {
  roomId: number
  title: string
  myTitle: UserTitle
}

export interface RoomMemberResponse {
  uuid: string
  nickname: string
  title: UserTitle
  color: string
  convictionCount: number
}

// ─── Case ────────────────────────────────────────────────────────────────────

export interface CreateCaseRequest {
  title: string
  content: string
  deadline: string // ISO 8601
}

export interface CaseCreateResponse {
  caseId: number
  status: CaseStatus
  createdAt: string
}

export interface CaseResponse {
  caseId: number
  title: string
  status: CaseStatus
  nickname: string
}

export interface CaseDetailResponse {
  caseId: number
  title: string
  content: string
  status: CaseStatus
  nickname: string
  defendantUuid: string
  period: string
  trialStatus: TrialStatus
  trialId: number
}

export interface CaseTrialResponse {
  trialId: number
  caseId: number
  status: TrialStatus
}

// ─── Trial ───────────────────────────────────────────────────────────────────

export interface ReportRequest {
  caseId: number
  photoId: number
  content?: string
}

export interface ReportResponse {
  reportId: number
  caseId: number
  trialId: number
  caseStatus: CaseStatus
  trialStatus: TrialStatus
}

export interface VoteRequest {
  guilty: boolean
}

export interface VoteResponse {
  trialId: number
  guilty: boolean
  votedCount: number
  totalVoters: number
}

export interface VoteResultResponse {
  trialId: number
  status: TrialStatus
  guiltyCount: number
  notGuiltyCount: number
  votedCount: number
  totalVoters: number
  verdict: Verdict
  hasVoted: boolean
  myVote: boolean
  remainingSeconds: number
}

export interface TrialStatusResponse {
  trialId: number
  status: TrialStatus
}

export interface Participant {
  uuid: string
  nickname: string
  isDefendant: boolean
}

export interface TrialParticipantsResponse {
  trialId: number
  caseId: number
  status: TrialStatus
  defendant: Participant
  witnesses: Participant[]
  statementEndsAt: string
}

export interface DefendantSummary {
  uuid: string
  nickname: string
  newTitle: UserTitle
  convictionCount: number
}

export interface TrialEndResponse {
  trialId: number
  status: TrialStatus
  verdict: Verdict
  guiltyCount: number
  notGuiltyCount: number
  defendant: DefendantSummary
  caseStatus: CaseStatus
}

// ─── Photo ───────────────────────────────────────────────────────────────────

export interface PhotoResponse {
  photoId: number
  s3Url: string
}

export interface PresignedUrlRequest {
  filename: string
}

export interface PresignedUrlResponse {
  photoId: number
  uploadUrl: string
  s3Url: string
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface MessageResponse {
  messageId: number
  type: string
  caseId: number | null
  content: string
  user: UserSummary
  createdAt: string
}

// ─── WebSocket ───────────────────────────────────────────────────────────────

export type SocketMessageType =
  | "CHAT"
  | "TRIAL_STARTED"
  | "TRIAL_STATUS"
  | "VOTE_UPDATED"
  | "TRIAL_ENDED"

export interface SocketMessage<T = unknown> {
  type: SocketMessageType
  payload: T
}

export interface SocketChatPayload {
  messageId: number
  content: string
  caseId: number | null
  user: UserSummary
  createdAt: string
}

export interface SocketTrialStatusPayload {
  trialId: number
  caseId: number
  status: TrialStatus
}

export interface SocketVotePayload {
  trialId: number
  guiltyCount: number
  notGuiltyCount: number
  totalVoters: number
}

export interface SocketTrialEndPayload extends TrialEndResponse {}
