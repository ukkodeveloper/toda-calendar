import { Prisma } from "@prisma/client"

// unique 위반 판정 — 동시 고발/공표 race 를 409 로 매핑하기 위한 감지.
//   - @@unique 도, 수동 partial unique(case_one_active_per_defendant · trial_one_active_per_case)도
//     모두 Prisma 가 P2002 로 정규화한다. (실 DB end-to-end 로 검증 완료 — 2026-07-11)
//     이때 meta.target 은 인덱스명이 아니라 **컬럼명 배열**이다(예: ["roomId","defendantUuid"]).
//   - constraint 인자는 target 이 문자열일 때만 매칭에 쓰이고, 배열(partial index)이면 true 폴백.
//     한 create 가 유니크 제약을 여럿 가지면 meta.target 컬럼셋 비교로 좁혀야 함(현재는 후보 1개라 안전).
//   - 아래 raw 23505 브랜치는 Prisma 경유 시 실측상 도달하지 않으나, 방어적 폴백으로 남긴다.
export function isUniqueViolation(err: unknown, constraint?: string): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code !== "P2002") return false
    if (!constraint) return true
    const target = err.meta?.["target"]
    return typeof target === "string" ? target.includes(constraint) : true
  }
  // raw 23505 (partial index) — 메시지/코드에 표식이 있으면 unique 위반으로 간주.
  const msg = err instanceof Error ? err.message : String(err)
  if (!msg.includes("23505")) return false
  return constraint ? msg.includes(constraint) : true
}
