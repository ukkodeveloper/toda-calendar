// 상대시간 포맷터 — 방 목록 카드의 "마지막 활동" 표기용.
// 절대시각 포맷(formatTime)은 chat/trial-sheet 에 별도로 있고, 여기선 상대 표기만 담당한다.
// 순수 함수(Date 기반) — now 를 주입 가능하게 두어 테스트 가능.

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// 로컬 자정 기준 epoch(ms) — 달력일(24h 버킷 아님) 경계 계산용.
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/**
 * ISO 시각을 한국어 상대시간으로.
 * - null → "아직 대화 없음"
 * - < 1분 → "방금"
 * - < 60분 → "N분 전"
 * - < 24시간 → "N시간 전"
 * - 달력상 하루 전 → "어제"
 * - < 7일(달력) → "N일 전"
 * - 그 외 → 같은 해 "M월 D일" / 다른 해 "YYYY.M.D"
 */
export function formatRelativeTime(
  iso: string | null,
  now = new Date()
): string {
  if (iso === null) return "아직 대화 없음"

  const then = new Date(iso)
  const diff = now.getTime() - then.getTime()

  // 시각 단위(경과시간 버킷)
  if (diff < MINUTE) return "방금"
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}분 전`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`

  // 일 단위 — 달력일 경계(자정 기준). 24h 초과면 항상 최소 하루 차이.
  const dayDiff = Math.round((startOfDay(now) - startOfDay(then)) / DAY)
  if (dayDiff === 1) return "어제"
  if (dayDiff < 7) return `${dayDiff}일 전`

  const sameYear = then.getFullYear() === now.getFullYear()
  return sameYear
    ? `${then.getMonth() + 1}월 ${then.getDate()}일`
    : `${then.getFullYear()}.${then.getMonth() + 1}.${then.getDate()}`
}
