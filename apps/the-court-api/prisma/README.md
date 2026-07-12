# prisma/ — 데이터 계층 (worker-db 소관)

SoT: `vault/projects/the-court/sprints/01-rearrange/plan.md` → "데이터모델 (Prisma / Postgres — ERD)".

## partial unique index 는 마이그레이션 SQL 로 수동 관리한다

조건부/멱등 유니크는 `schema.prisma` 의 `@@unique` 로 표현할 수 없다(WHERE 절 = partial index, DSL 미지원).
Prisma `partialIndexes` preview 는 무한-마이그레이션 버그가 있어 **쓰지 않는다.**
대신 마이그레이션 SQL 끝에 손으로 삽입한다.

init(`20260711120000_init`):

- `case_one_active_per_defendant` — `(roomId, defendantUuid) WHERE status IN ('DECLARED','ON_TRIAL')` → 1방·1인·1활성사건
- `trial_one_active_per_case` — `Trial(caseId) WHERE status <> 'ENDED'` → 사건당 활성재판 1개

conversation_seq(`20260713000000_conversation_seq`):

- `conversation_one_room_body` — `Conversation(roomId) WHERE caseId IS NULL` → 방당 ROOM(본문) 대화 1개
- `conversation_one_per_case` — `Conversation(caseId) WHERE caseId IS NOT NULL` → 사건당 TRIAL(스레드) 대화 1개 (schema 의 `@unique(caseId)` 대응 물리 인덱스)
- `message_idempotency` — `Message(conversationId, userUuid, clientMsgId) WHERE clientMsgId IS NOT NULL` → 발신자 스코프 멱등(중복 제거)

Prisma 는 이 인덱스들을 모른다. 이 프로젝트는 **`prisma migrate deploy` 만** 사용하므로(드리프트 검사 없음) 문제없다.
**`prisma migrate dev` 를 쓰면 이 인덱스를 드리프트로 지우려 하니 쓰지 말 것.**
스키마 변경 시 새 마이그레이션 SQL 에 관련 인덱스를 다시 손으로 넣는다.

## 적용 (DB 연결은 슬라이스 02/05, infra 가 Railway Postgres 붙일 때)

```
DATABASE_URL=... prisma migrate deploy   # migrations/ 를 순서대로 적용
DATABASE_URL=... prisma db seed          # seed.ts (스텁 — 나중에 실데이터)
```

지금은 **live 연결 없이 파일만 authoring** 한 상태다.
