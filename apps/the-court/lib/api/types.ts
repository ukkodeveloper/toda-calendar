// 타입 SoT = 공유 계약(zod). 로컬 정의 대신 계약을 재export 해 drift 를 막는다.
// 런타임 값(WS_EVENTS 등)은 각 모듈에서 "@workspace/contracts" 를 직접 import.
export type {
  // enums
  CaseStatus,
  TrialStatus,
  Verdict,
  UserTitle,
  // user
  CreateUserRequest,
  UserResponse,
  NicknameResponse,
  UserSummary,
  // room
  CreateRoomRequest,
  RoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  RoomListItem,
  RoomListResponse,
  RoomDetailResponse,
  RoomMember,
  RoomMembersResponse,
  // case
  DefendantRef,
  CreateCaseRequest,
  CaseCreateResponse,
  CaseSummary,
  CaseSummaryList,
  CaseDetailResponse,
  CaseTrialResponse,
  WitnessTargetCase,
  WitnessTargetList,
  // report / trial
  ReportRequest,
  ReportResponse,
  VoteRequest,
  VoteResponse,
  VoteResultResponse,
  TrialStatusResponse,
  Participant,
  TrialParticipantsResponse,
  DefendantSummary,
  TrialEndResponse,
  // photo
  PhotoResponse,
  PhotoRef,
  // message
  MessageType,
  MessageResponse,
  MessageListResponse,
  // ws
  SocketAuth,
  RoomJoinPayload,
  RoomLeavePayload,
  TrialJoinPayload,
  TrialLeavePayload,
  ChatSendPayload,
  ChatMessageEvent,
  TrialStartedEvent,
  TrialStatusEvent,
  VoteUpdatedEvent,
  VerdictRevealedEvent,
} from "@workspace/contracts"
