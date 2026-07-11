-- 현행범 (the-court) 초기 마이그레이션
-- 손으로 authoring (live DB 없이). `prisma migrate deploy` 로 적용한다.
-- 끝의 partial unique index 2개는 Prisma partialIndexes preview(무한-마이그레이션 버그) 회피용 수동 삽입.

-- CreateEnum
CREATE TYPE "Title" AS ENUM ('CITIZEN', 'MODEL_CITIZEN', 'EX_CONVICT');
CREATE TYPE "CaseStatus" AS ENUM ('DECLARED', 'ON_TRIAL', 'CLOSED');
CREATE TYPE "TrialStatus" AS ENUM ('STATEMENT', 'VOTING', 'ENDED');
CREATE TYPE "Verdict" AS ENUM ('GUILTY', 'NOT_GUILTY');
CREATE TYPE "MessageType" AS ENUM ('USER', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "uuid" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userUuid" TEXT NOT NULL,
    "title" "Title" NOT NULL DEFAULT 'CITIZEN',
    "convictionCount" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "defendantUuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'DECLARED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trial" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "status" "TrialStatus" NOT NULL DEFAULT 'STATEMENT',
    "verdict" "Verdict",
    "statementEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "reporterUuid" TEXT NOT NULL,
    "photoId" INTEGER NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "uploaderUuid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" SERIAL NOT NULL,
    "trialId" INTEGER NOT NULL,
    "voterUuid" TEXT NOT NULL,
    "guilty" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "caseId" INTEGER,
    "userUuid" TEXT,
    "photoId" INTEGER,
    "type" "MessageType" NOT NULL DEFAULT 'USER',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");
CREATE INDEX "Member_roomId_idx" ON "Member"("roomId");
CREATE INDEX "Member_userUuid_idx" ON "Member"("userUuid");
CREATE UNIQUE INDEX "Member_roomId_userUuid_key" ON "Member"("roomId", "userUuid");
CREATE INDEX "Case_roomId_status_idx" ON "Case"("roomId", "status");
CREATE INDEX "Trial_caseId_idx" ON "Trial"("caseId");
CREATE INDEX "Report_caseId_idx" ON "Report"("caseId");
CREATE INDEX "Vote_trialId_idx" ON "Vote"("trialId");
CREATE UNIQUE INDEX "Vote_trialId_voterUuid_key" ON "Vote"("trialId", "voterUuid");
CREATE INDEX "Message_roomId_caseId_createdAt_idx" ON "Message"("roomId", "caseId", "createdAt");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Member" ADD CONSTRAINT "Member_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Case" ADD CONSTRAINT "Case_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Case" ADD CONSTRAINT "Case_defendantUuid_fkey" FOREIGN KEY ("defendantUuid") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterUuid_fkey" FOREIGN KEY ("reporterUuid") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_uploaderUuid_fkey" FOREIGN KEY ("uploaderUuid") REFERENCES "User"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_trialId_fkey" FOREIGN KEY ("trialId") REFERENCES "Trial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voterUuid_fkey" FOREIGN KEY ("voterUuid") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "User"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 수동 삽입: partial unique index 2개 (schema.prisma 로 표현 불가 — DSL 미지원)
-- Prisma 는 이 인덱스를 모른다. 이 프로젝트는 `migrate deploy` 만 쓰므로 드리프트 검사 없음.
-- 변경 시 새 마이그레이션 SQL 에 손으로 관리한다. (prisma/README.md 참고)
-- ─────────────────────────────────────────────────────────────────────────────

-- 불변식: 1방·1인·1활성사건 (활성 = DECLARED | ON_TRIAL)
CREATE UNIQUE INDEX "case_one_active_per_defendant"
  ON "Case" ("roomId", "defendantUuid")
  WHERE "status" IN ('DECLARED', 'ON_TRIAL');

-- 불변식: 사건당 활성재판 1개 (동시 1개 — 시간축 재고발은 새 Trial 허용)
CREATE UNIQUE INDEX "trial_one_active_per_case"
  ON "Trial" ("caseId")
  WHERE "status" <> 'ENDED';
