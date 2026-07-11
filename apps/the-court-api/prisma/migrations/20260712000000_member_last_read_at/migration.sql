-- 현행범 (the-court) — Member.lastReadAt 추가 (안 읽은 메시지 기능)
-- 손으로 authoring (live DB 없이). `prisma migrate deploy` 로 적용한다.
-- 순수 추가(additive) 마이그레이션 — nullable 컬럼 1개. 백필 불필요(null = 미열람).
-- init 의 partial unique index 2개는 이미 존재하므로 여기서 다시 만들지 않는다.

-- AlterTable
ALTER TABLE "Member" ADD COLUMN "lastReadAt" TIMESTAMP(3);
