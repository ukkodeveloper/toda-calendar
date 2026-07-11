# prisma/ — 데이터 계층 (worker-db 소관)

SoT: `vault/projects/the-court/sprints/01-rearrange/plan.md` → "데이터모델 (Prisma / Postgres — ERD)".

## partial unique index 는 마이그레이션 SQL 로 수동 관리한다

불변식 2개는 `schema.prisma` 의 `@@unique` 로 표현할 수 없다(조건부 유니크 = partial index, DSL 미지원).
Prisma `partialIndexes` preview 는 무한-마이그레이션 버그가 있어 **쓰지 않는다.**
대신 마이그레이션 SQL 끝에 손으로 삽입한다:

- `case_one_active_per_defendant` — `(roomId, defendantUuid) WHERE status IN ('DECLARED','ON_TRIAL')` → 1방·1인·1활성사건
- `trial_one_active_per_case` — `Trial(caseId) WHERE status <> 'ENDED'` → 사건당 활성재판 1개

Prisma 는 이 두 인덱스를 모른다. 이 프로젝트는 **`prisma migrate deploy` 만** 사용하므로(드리프트 검사 없음) 문제없다.
**`prisma migrate dev` 를 쓰면 이 인덱스를 드리프트로 지우려 하니 쓰지 말 것.**
스키마 변경 시 새 마이그레이션 SQL 에 이 두 인덱스를 다시 손으로 넣는다.

## 적용 (DB 연결은 슬라이스 02/05, infra 가 Railway Postgres 붙일 때)

```
DATABASE_URL=... prisma migrate deploy   # migrations/ 를 순서대로 적용
DATABASE_URL=... prisma db seed          # seed.ts (스텁 — 나중에 실데이터)
```

지금은 **live 연결 없이 파일만 authoring** 한 상태다.
