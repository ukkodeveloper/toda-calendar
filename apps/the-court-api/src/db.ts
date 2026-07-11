// Prisma client — 영속 경계. 유스케이스는 이 client 를 통해서만 DB 에 닿는다.
// 단일 DB·1인 프로젝트라 repository 추상화를 두지 않는다(YAGNI, plan.md 레이어 셋 규칙).
// 핸들러 → 순수 도메인 함수 → prisma. 그 이상 계층 없음.
//
// 주의(슬라이스 01): schema/마이그레이션은 worker-db 소관(prisma/). 실연결은 슬라이스 02/05.
// 타입은 `prisma generate`(스키마 기반, DB 연결 불필요) 후 채워진다.
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export type Db = typeof prisma
