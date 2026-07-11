import type { Verdict } from "@workspace/contracts"

// 평결 계산 — 순수 함수. 안정성 박는 곳.
// 규칙(PRD 결정 #2 · plan.md): 투표 참여자 중 과반 초과 = 유죄.
//   동점·0표·과반 미달 = 무죄(기본). 본인표는 집계에서 제외(호출부 책임 — 여기 안 들어옴).
//   과반 초과 ⟺ guiltyCount > notGuiltyCount (denominator = 실제 던진 표 수).
//   동점(guilty == notGuilty)·0표(둘 다 0)는 이 부등식으로 자연히 무죄가 된다.
export function computeVerdict(input: {
  guiltyCount: number
  notGuiltyCount: number
}): Verdict {
  return input.guiltyCount > input.notGuiltyCount ? "GUILTY" : "NOT_GUILTY"
}
