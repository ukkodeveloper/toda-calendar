import type { Verdict } from "@workspace/contracts"

// 평결 계산 — 순수 함수. 안정성 박는 곳(슬라이스 02 유닛테스트 필수).
// 규칙(PRD 결정 #2): 참여자 과반 초과 = 유죄. 동점·0표·과반 미달 = 무죄(기본).
//   본인은 투표 못 함(집계 대상에서 제외 — 호출부 책임).
//   과반 초과 = guiltyCount > notGuiltyCount (동수는 무죄).
export function computeVerdict(input: {
  guiltyCount: number
  notGuiltyCount: number
}): Verdict {
  // TODO(슬라이스 02): 구현 + 경계 테스트(0표, 동점, guilty=notGuilty+1 경계).
  void input
  throw new Error("computeVerdict: TODO 슬라이스 02")
}
