-- 현행범 (the-court) — 대화 엔티티 + 메시지 seq/멱등/BIGINT
-- 손으로 authoring (live DB 없이). `prisma migrate deploy` 로 적용한다. `migrate dev` 금지.
-- 빈 DB(0행)·데모 DB(데이터 있음) 양쪽에서 옳게 동작하도록 expand→backfill→contract 순서.
-- 끝의 partial unique index 3개는 Prisma DSL 로 표현 불가 — 수동 삽입(prisma/README.md).
-- init 의 partial unique 2개(case_one_active_per_defendant·trial_one_active_per_case)는
-- 이미 존재하므로 여기서 다시 만들지 않는다(additive).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) 신규 enum
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE "ConversationKind" AS ENUM ('ROOM', 'TRIAL');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Conversation — 방 본문 1개(ROOM) + 사건 스레드 N개(TRIAL). seq 카운터·영수증 앵커.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "Conversation" (
    "id"            SERIAL NOT NULL,
    "roomId"        INTEGER NOT NULL,
    "caseId"        INTEGER,
    "kind"          "ConversationKind" NOT NULL,
    "lastSeq"       BIGINT NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMPTZ(3),
    "createdAt"     TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Conversation_roomId_idx" ON "Conversation"("roomId");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_caseId_fkey"
    FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) ConversationRead — 대화·유저당 읽음 워터마크(lastReadSeq)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "ConversationRead" (
    "conversationId" INTEGER NOT NULL,
    "userUuid"       TEXT NOT NULL,
    "lastReadSeq"    BIGINT NOT NULL DEFAULT 0,
    "updatedAt"      TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversationRead_pkey" PRIMARY KEY ("conversationId", "userUuid")
);

CREATE INDEX "ConversationRead_userUuid_idx" ON "ConversationRead"("userUuid");

ALTER TABLE "ConversationRead" ADD CONSTRAINT "ConversationRead_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationRead" ADD CONSTRAINT "ConversationRead_userUuid_fkey"
    FOREIGN KEY ("userUuid") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) Message 확장 — 컬럼은 우선 nullable 로 추가(backfill 후 NOT NULL 승격)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Message" ADD COLUMN "conversationId" INTEGER; -- backfill 후 SET NOT NULL
ALTER TABLE "Message" ADD COLUMN "seq"            BIGINT;   -- backfill 후 SET NOT NULL
ALTER TABLE "Message" ADD COLUMN "clientMsgId"    TEXT;
ALTER TABLE "Message" ADD COLUMN "editedAt"       TIMESTAMPTZ(3);
ALTER TABLE "Message" ADD COLUMN "deletedAt"      TIMESTAMPTZ(3);

-- createdAt 타입 정정: naive timestamp → timestamptz. 기존 값은 UTC 로 저장돼 있어 무손실.
ALTER TABLE "Message" ALTER COLUMN "createdAt"
    TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5) Backfill (빈 DB 면 전부 0행; 데모 DB 면 아래 순서로 정합)
-- ─────────────────────────────────────────────────────────────────────────────

-- 5a) 방 본문 대화: 본문 메시지(caseId IS NULL)가 있는 방마다 ROOM 대화 1개
INSERT INTO "Conversation" ("roomId", "caseId", "kind")
SELECT DISTINCT m."roomId", NULL::integer, 'ROOM'::"ConversationKind"
FROM "Message" m
WHERE m."caseId" IS NULL
ON CONFLICT DO NOTHING;

-- 5b) 스레드 대화: caseId 별 TRIAL 대화 1개
INSERT INTO "Conversation" ("roomId", "caseId", "kind")
SELECT DISTINCT m."roomId", m."caseId", 'TRIAL'::"ConversationKind"
FROM "Message" m
WHERE m."caseId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5c) Message.conversationId 채우기 (본문/스레드 매칭)
UPDATE "Message" m
SET "conversationId" = c."id"
FROM "Conversation" c
WHERE c."roomId" = m."roomId"
  AND (
       (m."caseId" IS NULL AND c."caseId" IS NULL)
    OR (m."caseId" = c."caseId")
  );

-- 5d) seq 부여: 대화별 (createdAt, id) 순서로 1..N
WITH ordered AS (
    SELECT "id",
           ROW_NUMBER() OVER (PARTITION BY "conversationId" ORDER BY "createdAt", "id") AS rn
    FROM "Message"
)
UPDATE "Message" m
SET "seq" = o.rn
FROM ordered o
WHERE m."id" = o."id";

-- 5e) 카운터·정렬 비정규 초기화
UPDATE "Conversation" c
SET "lastSeq"       = COALESCE((SELECT MAX(m."seq")       FROM "Message" m WHERE m."conversationId" = c."id"), 0),
    "lastMessageAt" =          (SELECT MAX(m."createdAt")  FROM "Message" m WHERE m."conversationId" = c."id");

-- 5f) 영수증 backfill: 기존 Member.lastReadAt → 방 본문(ROOM) 대화의 lastReadSeq
INSERT INTO "ConversationRead" ("conversationId", "userUuid", "lastReadSeq")
SELECT c."id",
       mem."userUuid",
       COALESCE((SELECT MAX(m."seq") FROM "Message" m
                 WHERE m."conversationId" = c."id" AND m."createdAt" <= mem."lastReadAt"), 0)
FROM "Member" mem
JOIN "Conversation" c ON c."roomId" = mem."roomId" AND c."caseId" IS NULL
WHERE mem."lastReadAt" IS NOT NULL
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6) 제약 확정 (backfill 완료 후)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Message" ALTER COLUMN "conversationId" SET NOT NULL;
ALTER TABLE "Message" ALTER COLUMN "seq"            SET NOT NULL;

ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7) Message.id → BIGINT (Message 를 참조하는 FK 없음 → 즉시 안전)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Message" ALTER COLUMN "id" TYPE BIGINT;
ALTER SEQUENCE "Message_id_seq" AS BIGINT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8) 인덱스 재구성
-- ─────────────────────────────────────────────────────────────────────────────
-- 순서·커서·유니크 겸함: 대화 안 seq 는 유일 → keyset 인덱스이자 중복 seq 방지
CREATE UNIQUE INDEX "Message_conversationId_seq_key" ON "Message"("conversationId", "seq");

-- 옛 인덱스 제거: (roomId, caseId, createdAt) 는 새 keyset 이 대체
DROP INDEX IF EXISTS "Message_roomId_caseId_createdAt_idx";

-- roomId 단독 조회(방 broadcast·room 목록)용 보조 인덱스
CREATE INDEX "Message_roomId_idx" ON "Message"("roomId");

-- ─────────────────────────────────────────────────────────────────────────────
-- 수동 삽입: partial unique index 3개 (schema.prisma 로 표현 불가 — DSL 미지원)
-- Prisma 는 이 인덱스를 모른다. 이 프로젝트는 `migrate deploy` 만 쓰므로 드리프트 검사 없음.
-- 변경 시 새 마이그레이션 SQL 에 손으로 관리한다. (prisma/README.md 참고)
-- ─────────────────────────────────────────────────────────────────────────────

-- 불변식: 방당 ROOM(본문) 대화 1개
CREATE UNIQUE INDEX "conversation_one_room_body"
    ON "Conversation" ("roomId")
    WHERE "caseId" IS NULL;

-- 불변식: 사건당 TRIAL(스레드) 대화 1개
-- (schema.prisma 의 @unique(caseId) 대응 물리 인덱스 — nullable 컬럼이라 partial 로 명시)
CREATE UNIQUE INDEX "conversation_one_per_case"
    ON "Conversation" ("caseId")
    WHERE "caseId" IS NOT NULL;

-- 멱등: 발신자 스코프 clientMsgId 중복 제거(SYSTEM=null 은 제외)
CREATE UNIQUE INDEX "message_idempotency"
    ON "Message" ("conversationId", "userUuid", "clientMsgId")
    WHERE "clientMsgId" IS NOT NULL;
