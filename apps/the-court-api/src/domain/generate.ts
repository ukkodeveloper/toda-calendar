import { randomInt } from "node:crypto"

// 닉네임(형용사+명사)·색·참여코드 생성. 순수하진 않으나(랜덤) 부수효과 없는 값 생성기.

const ADJECTIVES = [
  "배고픈",
  "성난",
  "졸린",
  "느긋한",
  "억울한",
  "당당한",
  "수줍은",
  "엉뚱한",
  "용감한",
  "게으른",
  "예민한",
  "쾌활한",
  "심술난",
  "우아한",
  "엉큼한",
  "진지한",
]

const NOUNS = [
  "판다",
  "다람쥐",
  "여우",
  "호랑이",
  "펭귄",
  "고양이",
  "너구리",
  "수달",
  "올빼미",
  "두더지",
  "햄스터",
  "미어캣",
  "고슴도치",
  "카피바라",
  "라쿤",
  "알파카",
]

// 뱃지·아바타용 팔레트(the_court 골드 계열과 충돌 없는 대비색).
const COLORS = [
  "#FF5733",
  "#33A1FF",
  "#2ECC71",
  "#9B59B6",
  "#E84393",
  "#F1C40F",
  "#1ABC9C",
  "#E67E22",
  "#3498DB",
  "#E74C3C",
  "#00B894",
  "#6C5CE7",
]

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // 혼동문자(I,O,0,1) 제외

function pick<T>(arr: readonly T[]): T {
  return arr[randomInt(arr.length)]!
}

export function generateNickname(): string {
  return `${pick(ADJECTIVES)} ${pick(NOUNS)}`
}

export function randomColor(): string {
  return pick(COLORS)
}

// 참여코드 — 대문자/숫자 6자(혼동문자 제외). 유니크 충돌은 호출부에서 재시도.
export function generateRoomCode(length = 6): string {
  let code = ""
  for (let i = 0; i < length; i++)
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  return code
}
