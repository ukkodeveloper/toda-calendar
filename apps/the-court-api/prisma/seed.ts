/**
 * 데모용 시드 스텁 (자리만).
 *
 * 실행: worker-backend 가 package.json 에 `prisma.seed` + 스크립트를 붙인 뒤,
 *       Railway Postgres 연결(슬라이스 02/05)에서 `prisma db seed`.
 *
 * 지금은 스키마·마이그레이션 authoring 단계라 실데이터를 넣지 않는다.
 * SoT: vault/projects/the-court/sprints/01-rearrange/plan.md
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // TODO(슬라이스 05, 데모 리허설): Hero 경로용 최소 시드.
  //  - User 3~4명 (닉네임 형용사+동물, color)
  //  - Room 1개 (code 고정, 데모 링크 공유용)
  //  - Member: 위 유저들 room 참여 (title=CITIZEN, convictionCount=0)
  //  - Case 1건 (defendant=한 명, DECLARED, startDate~deadline)
  //  선고 리빌까지의 전이(고발→재판→투표→선고)는 데모에서 라이브로 만든다.
  console.log("[seed] stub — no data seeded yet. See TODO.")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
