import { Prisma } from "@prisma/client"

// unique 위반 판정 — 동시 고발/공표 race 를 409 로 매핑하기 위한 감지.
//   - Prisma 가 아는 @@unique 위반 → P2002
//   - 수동 partial unique(case_one_active_per_defendant · trial_one_active_per_case)는
//     Prisma 가 모르므로 Postgres 코드 23505 를 raw 로 확인한다.
//   ⚠️ worker-db 확인 요청: 수동 partial index 위반이 P2002 로 오는지 23505(raw)로 오는지
//     실제 DB 붙을 때 한 번 검증 필요(둘 다 커버해 두었음).
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
