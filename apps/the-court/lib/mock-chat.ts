// 임시 mock 데이터 — 실 API/WebSocket 연동 전 데모용

import type { CaseDetailResponse } from "@/lib/api/types"

export const MOCK_ME_UUID = "u-cat"

// ─── 사건 목록 ─────────────────────────────────────────────────────────────────

export const MOCK_CASES: CaseDetailResponse[] = [
  {
    caseId: 1,
    title: "금주 챌린지 60일",
    content:
      "두 달 동안 술을 한 모금도 마시지 않겠습니다. 어기면 전원 치킨 사기.",
    status: "DECLARED",
    nickname: "억울한 호랑이",
    defendantUuid: "u-tiger",
    period: "2026-09-10T00:00:00",
    trialStatus: "STATEMENT",
    trialId: 0,
  },
  {
    caseId: 2,
    title: "금연 30일",
    content:
      "30일 동안 담배를 끊겠습니다. 실패 시 헬스장 한 달 등록비 본인 부담.",
    status: "ON_TRIAL",
    nickname: "성난 펭귄",
    defendantUuid: "u-penguin",
    period: "2026-08-10T00:00:00",
    trialStatus: "VOTING",
    trialId: 1,
  },
  {
    caseId: 3,
    title: "아침 6시 기상 한 달",
    content: "한 달 동안 매일 아침 6시에 기상 인증 사진을 올립니다.",
    status: "CLOSED",
    nickname: "느긋한 판다",
    defendantUuid: "u-panda",
    period: "2026-07-01T00:00:00",
    trialStatus: "ENDED",
    trialId: 2,
  },
]

// ─── 재판 참여자 (trialId: 1 — 금연 30일) ─────────────────────────────────────

export const MOCK_TRIAL_PARTICIPANTS = [
  {
    uuid: "u-penguin",
    nickname: "성난 펭귄",
    color: "blue",
    isDefendant: true,
  },
  {
    uuid: "u-tiger",
    nickname: "억울한 호랑이",
    color: "orange",
    isDefendant: false,
  },
  {
    uuid: "u-panda",
    nickname: "느긋한 판다",
    color: "green",
    isDefendant: false,
  },
  {
    uuid: "u-rabbit",
    nickname: "부지런한 토끼",
    color: "yellow",
    isDefendant: false,
  },
]

// ─── 재판 채팅 (trialId: 1 — 금연 30일) ──────────────────────────────────────

export const MOCK_TRIAL_MESSAGES = [
  {
    id: "t1",
    senderUuid: "system",
    nickname: "",
    text: "⚖️ 재판이 시작됩니다. 피고인은 최후진술을 해주세요.",
    time: "오후 2:00",
    isSystem: true,
  },
  {
    id: "t2",
    senderUuid: "u-penguin",
    nickname: "성난 펭귄",
    color: "blue",
    text: "저 정말 열심히 했는데요... 딱 하루 실수한 거예요. 그 날 진짜 너무 힘들었어요 ㅠ",
    time: "오후 2:01",
  },
  {
    id: "t3",
    senderUuid: "u-tiger",
    nickname: "억울한 호랑이",
    color: "orange",
    text: "목격자로서 말씀드리면, 지난주 화요일 저녁에 편의점 앞에서 담배 피우는 것을 봤습니다.",
    time: "오후 2:02",
  },
  {
    id: "t4",
    senderUuid: "u-panda",
    nickname: "느긋한 판다",
    color: "green",
    text: "저도 봤어요. 같이 있었거든요.",
    time: "오후 2:02",
  },
  {
    id: "t5",
    senderUuid: "u-penguin",
    nickname: "성난 펭귄",
    color: "blue",
    text: "그건... 사실이에요. 그 날 진짜 최악의 하루였어요. 스트레스가 너무 심해서",
    time: "오후 2:03",
  },
  {
    id: "t6",
    senderUuid: "u-rabbit",
    nickname: "부지런한 토끼",
    color: "yellow",
    text: "이유가 어찌 됐든 규칙을 어긴 건 맞잖아요. 평결로 넘어가야 할 것 같아요.",
    time: "오후 2:04",
  },
  {
    id: "t7",
    senderUuid: "u-penguin",
    nickname: "성난 펭귄",
    color: "blue",
    text: "반성하고 있어요 ㅠ 한 번만 봐주세요...",
    time: "오후 2:04",
  },
  {
    id: "t8",
    senderUuid: "system",
    nickname: "",
    text: "⚖️ 최후진술이 종료되었습니다. 평결을 진행합니다.",
    time: "오후 2:05",
    isSystem: true,
  },
]

// ─── 채팅 스트림 타입 ──────────────────────────────────────────────────────────

type ChatBubble = {
  id: string
  kind: "chat"
  sender: "user" | "assistant"
  name: string
  color: string
  text: string
  time: string
}

type EventCard = {
  id: string
  kind: "event"
  eventType: "DECLARED" | "TRIAL_STARTED" | "TRIAL_ENDED"
  caseTitle: string
  caseId: number
  trialId?: number
  time: string
}

export type MockListItem = ChatBubble | EventCard

function chat(
  id: string,
  name: string,
  color: string,
  text: string,
  time: string,
  uuid: string
): ChatBubble {
  return {
    id,
    kind: "chat",
    sender: uuid === MOCK_ME_UUID ? "user" : "assistant",
    name,
    color,
    text,
    time,
  }
}

function event(
  id: string,
  eventType: EventCard["eventType"],
  caseTitle: string,
  caseId: number,
  time: string
): EventCard {
  return { id, kind: "event", eventType, caseTitle, caseId, time }
}

// ─── 방 채팅 스트림 ────────────────────────────────────────────────────────────

export const MOCK_CHAT_ITEMS: MockListItem[] = [
  chat(
    "1",
    "느긋한 판다",
    "green",
    "다들 오늘 어때요? 요즘 뭔가 의욕이 없어서…",
    "오전 10:02",
    "u-panda"
  ),
  chat(
    "2",
    "부지런한 토끼",
    "yellow",
    "저는 운동 시작했어요! 3일째 가고 있어요 ㅎㅎ",
    "오전 10:03",
    "u-rabbit"
  ),
  chat(
    "3",
    "억울한 호랑이",
    "orange",
    "저도 뭔가 해야 하는데… 요즘 술을 너무 많이 마신 것 같아서요",
    "오전 10:04",
    "u-tiger"
  ),
  chat(
    "4",
    "성난 펭귄",
    "blue",
    "맞아요 저도 담배 줄여야 하는데 쉽지 않네요",
    "오전 10:05",
    "u-penguin"
  ),
  chat(
    "5",
    "깜찍한 강아지",
    "pink",
    "같이 하면 어때요? 여기서 공표하면 지킬 것 같은데 ㅋㅋ",
    "오전 10:06",
    "u-dog"
  ),
  chat(
    "6",
    "귀여운 고양이",
    "teal",
    "맞아요 다들 선언해요! 어기면 진짜 민망하잖아요",
    "오전 10:06",
    "u-cat"
  ),
  chat(
    "7",
    "억울한 호랑이",
    "orange",
    "그러면… 저 먼저 해볼게요 ㅋㅋ 두 달 금주",
    "오전 10:07",
    "u-tiger"
  ),
  event("ev-1", "DECLARED", "금주 챌린지 60일", 1, "오전 10:08"),
  chat(
    "8",
    "똑똑한 여우",
    "purple",
    "오 호랑이님 진짜요?? 존경합니다",
    "오전 10:09",
    "u-fox"
  ),
  chat(
    "9",
    "용감한 사자",
    "red",
    "한 달로는 부족하고 두 달이면 진짜 각오가 남다른데요",
    "오전 10:10",
    "u-lion"
  ),
  chat(
    "10",
    "억울한 호랑이",
    "orange",
    "두 달 할게요… 근데 주변에서 못 마시게 하는 게 더 힘들 것 같음 ㅋㅋ",
    "오전 10:10",
    "u-tiger"
  ),
  chat(
    "11",
    "귀여운 고양이",
    "teal",
    "호랑이님 대단하다! 저도 선언하고 싶어지는데요",
    "오전 10:11",
    "u-cat"
  ),
  chat(
    "12",
    "성난 펭귄",
    "blue",
    "저도요… 담배 30일 끊어볼게요",
    "오전 10:12",
    "u-penguin"
  ),
  event("ev-2", "DECLARED", "금연 30일", 2, "오전 10:13"),
  chat(
    "13",
    "느긋한 판다",
    "green",
    "ㅋㅋ 이거 연쇄 작용이다",
    "오전 10:14",
    "u-panda"
  ),
  chat(
    "14",
    "부지런한 토끼",
    "yellow",
    "두 분 다 화이팅!! 저도 진짜 뭔가 해야겠다",
    "오전 10:14",
    "u-rabbit"
  ),
  chat(
    "15",
    "똑똑한 여우",
    "purple",
    "페널티 어떻게 할 건지도 정해야죠 ㅎㅎ",
    "오전 10:15",
    "u-fox"
  ),
  chat(
    "16",
    "억울한 호랑이",
    "orange",
    "어기면 치킨 사기 ㅋ",
    "오전 10:15",
    "u-tiger"
  ),
  chat(
    "17",
    "성난 펭귄",
    "blue",
    "저는 헬스장 한 달 등록비 내기로…",
    "오전 10:16",
    "u-penguin"
  ),
  chat(
    "18",
    "깜찍한 강아지",
    "pink",
    "그거 페널티가 아니라 선물 아닌가요 ㅋㅋㅋ",
    "오전 10:16",
    "u-dog"
  ),
  chat(
    "19",
    "용감한 사자",
    "red",
    "ㅋㅋㅋ 맞아 헬스장이 왜 페널티야",
    "오전 10:17",
    "u-lion"
  ),
  chat(
    "20",
    "귀여운 고양이",
    "teal",
    "ㅋㅋㅋ 펭귄님 그게 오히려 보상 아닌가요?",
    "오전 10:17",
    "u-cat"
  ),
  chat(
    "21",
    "성난 펭귄",
    "blue",
    "아 운동 싫어하는데 억지로 가야 하니까 페널티예요 ㅠ",
    "오전 10:18",
    "u-penguin"
  ),
  chat(
    "22",
    "느긋한 판다",
    "green",
    "이 방 진짜 재밌다 ㅋㅋ 저도 뭔가 해야겠어요",
    "오전 10:19",
    "u-panda"
  ),
  chat(
    "23",
    "부지런한 토끼",
    "yellow",
    "판다님도 선언해요!! 우리 다 같이 하자",
    "오전 10:19",
    "u-rabbit"
  ),
  chat(
    "24",
    "억울한 호랑이",
    "orange",
    "근데 진짜 누군가 지켜봐주니까 더 할 수 있을 것 같음",
    "오전 10:20",
    "u-tiger"
  ),
  chat(
    "25",
    "귀여운 고양이",
    "teal",
    "맞아요! 그래서 이 앱 만든 거잖아요 ㅎㅎ 다들 화이팅!!",
    "오전 10:21",
    "u-cat"
  ),
  event("ev-3", "TRIAL_STARTED", "금연 30일", 2, "오후 2:00"),
]
