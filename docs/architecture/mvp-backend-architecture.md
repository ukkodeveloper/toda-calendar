# Toda Calendar MVP Backend Architecture

## 1. 문서 목적

이 문서는 [phase-strategy.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/product/phase-strategy.md)와 [mvp-discovery.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/product/mvp-discovery.md)를 바탕으로, Toda Calendar의 `MVP 백엔드 아키텍처`를 설계한 문서다.

이번 설계는 아래 두 스킬의 원칙을 직접 반영한다.

- `api-and-interface-design`
  - contract first
  - 일관된 에러 포맷
  - boundary validation
  - additive API evolution
- `nodejs-backend`
  - core / infra 분리
  - composition root
  - repository pattern
  - config validation

## 2. 설계 목표

### MVP에서 꼭 만족해야 하는 것

- 로그인 가능한 사용자 기반
- 월 뷰에 필요한 month summary 조회
- 하루 기록 조회/수정
- 사진 / 문장 / 낙서 3개 포맷 저장
- 하루당 포맷별 최대 1개 슬롯 유지
- 프론트엔드와 분리된 백엔드 앱 구조
- 이후 phase 확장을 막지 않는 데이터 모델

### 이번에 하지 않을 것

- push 서버 구현
- weekly rewind 생성 파이프라인
- companion/펫
- 멀티 캘린더 UI
- social graph
- 실시간 기능

## 3. 핵심 결정

### 결정 1. Next.js Route Handler를 코어 API로 쓰지 않는다

`apps/web`의 Next.js는 프론트엔드 전용으로 두고, 백엔드는 별도 앱으로 분리한다.

이유:

- 사용자가 원한 `프론트 패키지와의 분리`를 가장 명확하게 만족한다
- RN 셸, 웹뷰, 추후 네이티브 클라이언트가 같은 API를 재사용할 수 있다
- phase 1의 push, phase 2의 weekly rewind, phase 6의 social 확장 시 서버 책임이 자연스럽다
- Next.js 배포 수명주기와 API 서버 수명주기를 분리할 수 있다

### 결정 2. API는 REST + contract-first로 간다

이유:

- MVP 리소스가 명확하다: `me`, `calendars`, `day-records`, `uploads`
- 웹과 모바일 클라이언트 모두에 단순하다
- phase 확장 시 additive evolution이 쉽다
- contract-first 설계와 OpenAPI 생성에 유리하다

### 결정 3. MVP부터 `calendar`와 `day record slot` 개념을 데이터 모델에 넣는다

이유:

- MVP UI는 단일 캘린더이지만, phase 5의 멀티 캘린더를 나중에 억지로 덧붙이지 않기 위함이다
- 포맷별 최대 1개라는 제약은 `day_record_slots` 모델로 가장 자연스럽게 표현된다
- phase 4의 위치/추가 포맷도 slot type 확장으로 대응 가능하다

### 결정 4. 인증/스토리지는 commodity는 managed service를 쓴다

권장:

- `Supabase Auth`
- `Supabase Postgres`
- `Supabase Storage`

이유:

- 1인 개발 MVP에서 로그인, 세션, 미디어 저장 인프라를 직접 만드는 비용이 너무 크다
- 추후 RN/webview 환경에서도 토큰 기반 인증 확장이 쉽다
- domain logic은 여전히 TypeScript API 서버 안에 둔다

즉, `백엔드를 안 만드는 것`이 아니라 `commodity infra는 빌리지 않고, 제품 로직은 우리가 가진다`가 원칙이다.

## 4. 권장 기술 스택

| 영역 | 권장 선택 | 이유 |
|---|---|---|
| Frontend app | `apps/web` Next.js | 현재 제품 표면 유지 |
| Backend app | `apps/api` Fastify + TypeScript | 프론트와 분리, Node backend 패턴에 적합 |
| API contract | `packages/contracts` + Zod | contract-first, shared schema |
| Database | Supabase Postgres | auth/storage와 함께 MVP 속도 확보 |
| Query layer | Drizzle ORM | solo-friendly, 타입 안정성, Postgres에 적합 |
| Validation | Zod | API boundary validation |
| Auth | Supabase Auth | 웹 + RN/webview 확장성 |
| File storage | Supabase Storage | photo asset 관리 단순화 |
| Logging | Pino | Node API 운영 기본 |
| Tests | Vitest + Fastify inject | unit/integration 단순화 |
| Background jobs later | Inngest | phase 1~2 이후 알림/rewind에 적합 |

## 5. 모노레포 구조 제안

```text
apps/
  web/                      # Next.js frontend only
  api/                      # Fastify backend service
    src/
      core/
        day-records/
        calendars/
        users/
        errors.ts
        types.ts
      infra/
        http/
          routes/
          middleware/
          server.ts
        db/
          schema/
          repositories/
          migrations/
          client.ts
        auth/
          supabase-auth.ts
        storage/
          storage-service.ts
      config/
        index.ts
      index.ts
packages/
  contracts/                # shared request/response schemas and types
  ui/
  eslint-config/
  typescript-config/
```

### 경계 규칙

- `apps/web`는 `apps/api` 내부 코드를 import하지 않는다
- `apps/web`는 오직 `packages/contracts`의 타입/스키마만 공유한다
- `apps/api`는 `packages/contracts`를 import해 동일한 입력/출력 계약을 사용한다
- DB schema와 repository는 `apps/api` 안에 둔다

이 구조는 frontend package와 backend package를 명확히 분리하면서도, 계약만 공유하게 만든다.

## 6. API 설계 원칙

### 6.1 URL 규칙

- prefix: `/v1`
- plural noun 사용
- verb를 URL에 넣지 않는다

예시:

- `GET /v1/me`
- `GET /v1/calendars`
- `GET /v1/calendars/:calendarId/month-view`
- `GET /v1/calendars/:calendarId/day-records/:localDate`
- `PATCH /v1/calendars/:calendarId/day-records/:localDate`
- `POST /v1/uploads/photos/presign`

### 6.2 에러 포맷

모든 에러는 아래 한 가지 포맷만 쓴다.

```ts
interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
  }
}
```

상태 코드:

- `401` 인증 안 됨
- `403` 권한 없음
- `404` 리소스 없음
- `409` 중복/충돌
- `422` validation 실패
- `500` 내부 오류

### 6.3 Validation 규칙

- request body, params, query는 route boundary에서만 Zod로 검증
- 내부 service와 repository는 검증 완료된 타입만 받는다
- third-party 응답도 boundary에서 검증한다

## 7. MVP 도메인 모델

### 7.1 주요 개념

- `User`
  - 인증 주체
- `Calendar`
  - 현재는 기본 1개만 노출
  - 이후 phase 5에서 여러 개로 확장
- `DayRecord`
  - 사용자와 특정 날짜에 귀속된 하루 기록
- `DayRecordSlot`
  - 하루 기록 안의 포맷 슬롯
  - `PHOTO`, `PHRASE`, `DOODLE`
- `Asset`
  - 사진 파일 메타데이터

### 7.2 중요한 모델링 결정

`day record`의 identity는 `timestamp`가 아니라 `local date`다.

즉, Toda는 일정 앱이 아니라 기억 앱이기 때문에:

- `2026-04-22`라는 사용자 로컬 날짜가 핵심 키다
- UTC timestamp는 보조 메타데이터일 뿐이다

이건 MVP부터 반드시 고정해야 한다.

## 8. 데이터베이스 설계

### 8.1 profiles

```text
profiles
- user_id uuid pk                # supabase auth user id
- display_name text null
- timezone text not null
- locale text not null default 'en'
- created_at timestamptz not null
- updated_at timestamptz not null
```

### 8.2 calendars

```text
calendars
- id uuid pk
- owner_user_id uuid not null references profiles.user_id
- name text not null
- slug text null
- is_default boolean not null default false
- created_at timestamptz not null
- updated_at timestamptz not null

unique(owner_user_id, is_default) where is_default = true
```

MVP에서는 가입 시 기본 캘린더 1개를 자동 생성한다.

### 8.3 day_records

```text
day_records
- id uuid pk
- calendar_id uuid not null references calendars.id
- owner_user_id uuid not null references profiles.user_id
- local_date date not null
- timezone text not null
- created_at timestamptz not null
- updated_at timestamptz not null

unique(calendar_id, local_date)
index(owner_user_id, local_date)
```

### 8.4 day_record_slots

```text
day_record_slots
- id uuid pk
- day_record_id uuid not null references day_records.id
- slot_type text not null         # PHOTO | PHRASE | DOODLE
- phrase_text text null
- json_payload jsonb null         # doodle strokes for MVP, extensible later
- asset_id uuid null references assets.id
- created_at timestamptz not null
- updated_at timestamptz not null

unique(day_record_id, slot_type)
```

설계 원칙:

- 한 포맷당 최대 1개 슬롯
- phrase는 `phrase_text`
- doodle은 `json_payload`
- photo는 `asset_id`

이 구조면 이후 phase에서 `LOCATION`, `AUDIO`, `MOOD` 같은 slot type을 추가하기 쉽다.

### 8.5 assets

```text
assets
- id uuid pk
- owner_user_id uuid not null references profiles.user_id
- bucket text not null
- object_key text not null
- mime_type text not null
- size_bytes integer not null
- width integer null
- height integer null
- created_at timestamptz not null
```

MVP에서는 photo만 asset를 쓴다.

## 9. API 계약 제안

### 9.1 GET /v1/me

목적:

- 현재 로그인 사용자 정보와 기본 캘린더 정보 반환

응답:

```ts
type MeResponse = {
  user: {
    id: string
    displayName: string | null
    timezone: string
    locale: string
  }
  defaultCalendarId: string
}
```

### 9.2 GET /v1/calendars

MVP에서는 1개만 와도 되지만, 응답은 list로 둔다.

이유:

- phase 5 멀티 캘린더 확장 시 additive change만으로 유지 가능

### 9.3 GET /v1/calendars/:calendarId/month-view?month=2026-04&layer=PHOTO

목적:

- 월 뷰 렌더링용 summary 제공

응답:

```ts
type MonthLayer = 'PHOTO' | 'PHRASE' | 'DOODLE'

type MonthViewCell = {
  localDate: string
  hasContent: boolean
  preview: null | {
    type: MonthLayer
    text?: string
    assetUrl?: string
    doodlePreviewUrl?: string
  }
}

type GetMonthViewResponse = {
  month: string
  layer: MonthLayer
  cells: MonthViewCell[]
}
```

주의:

- 목록은 항상 같은 shape
- 비어 있는 날도 프론트가 채우므로, 서버는 `기록 있는 날짜만` 반환해도 되지만 shape는 고정한다
- preview는 layer에 필요한 최소 정보만 준다

### 9.4 GET /v1/calendars/:calendarId/day-records/:localDate

목적:

- bottom sheet 편집기용 day record 조회

응답:

```ts
type DayRecordSlot =
  | { type: 'PHOTO'; assetUrl: string | null }
  | { type: 'PHRASE'; text: string | null }
  | { type: 'DOODLE'; payload: Record<string, unknown> | null }

type GetDayRecordResponse = {
  dayRecord: {
    id: string
    calendarId: string
    localDate: string
    timezone: string
    slots: DayRecordSlot[]
  }
}
```

### 9.5 PATCH /v1/calendars/:calendarId/day-records/:localDate

목적:

- 하루 기록 부분 업데이트
- autosave와 segmented control 흐름에 적합

입력:

```ts
type PatchDayRecordInput = {
  phrase?: { text: string | null }
  doodle?: { payload: Record<string, unknown> | null }
  photo?: { assetId: string | null }
}
```

원칙:

- 제공된 필드만 바꾼다
- null은 slot 삭제 의미로 사용 가능
- 성공 시 항상 full `DayRecord`를 반환한다

### 9.6 POST /v1/uploads/photos/presign

목적:

- photo 업로드용 presigned upload 발급

흐름:

1. 클라이언트가 presign 요청
2. storage에 직접 업로드
3. 업로드 완료 후 `assetId`를 day record patch에 넣음

이 방식을 쓰면 API 서버가 이미지 파일을 직접 중계하지 않아도 된다.

## 10. 인증 설계

### 권장 선택

- 인증은 `Supabase Auth`
- API는 `Bearer token` 또는 server-side session token을 검증

### 이유

- RN/webview와 future native client에 유리하다
- web-only cookie session에 묶이지 않는다
- phase 6 social에서도 클라이언트 종류가 늘어나도 auth boundary를 유지하기 쉽다

### MVP 인증 흐름

1. 사용자가 web app에서 로그인
2. 클라이언트가 Supabase 세션 획득
3. API 요청 시 access token 전달
4. API 서버가 토큰 검증 후 `user_id`를 context에 주입

## 11. 파일/미디어 설계

### Photo

- 원본은 object storage에 저장
- DB에는 asset metadata만 저장
- month view에는 resize된 public/signed URL 사용

### Doodle

MVP 권장:

- doodle stroke data는 JSONB로 저장
- 렌더링은 클라이언트에서 수행
- 필요해질 때 preview snapshot 생성 추가

이 방식이 좋은 이유:

- autosave에 유리하다
- 나중에 editability를 유지할 수 있다
- MVP에서 asset pipeline을 하나 더 만들지 않아도 된다

## 12. 백엔드 내부 구조 제안

`nodejs-backend` 스킬 원칙을 그대로 적용하면 다음 구조가 적합하다.

### core

- 순수 도메인 로직
- day record 생성/수정 규칙
- slot upsert 규칙
- month summary 조립
- domain error 정의

### infra

- Fastify route
- DB client / repository
- auth verifier
- storage integration
- logger

### composition root

- config 읽기
- db client 생성
- repository 인스턴스화
- services 주입
- route 등록

즉, `HTTP가 곧 비즈니스 로직`이 되지 않도록 한다.

## 13. 구현 우선순위

### Step 1

- `apps/api` 생성
- config / server / health endpoint
- shared contracts package 생성

### Step 2

- auth middleware
- profiles / calendars / day_records / day_record_slots / assets schema
- migration 체계

### Step 3

- `GET /v1/me`
- `GET /v1/calendars`
- `GET /v1/calendars/:calendarId/month-view`
- `GET /v1/calendars/:calendarId/day-records/:localDate`
- `PATCH /v1/calendars/:calendarId/day-records/:localDate`

### Step 4

- photo presign/upload flow
- integration tests
- frontend API client 연결

## 14. Phase 확장 관점에서의 적합성

### Post-MVP 1: 푸시/재진입

추가:

- `device_installations`
- `notification_preferences`
- Inngest job handlers

왜 현재 구조와 맞는가:

- API 앱이 분리되어 있어 push와 deep link 책임을 자연스럽게 추가 가능

### Post-MVP 2: Weekly Rewind

추가:

- `weekly_rewinds` 캐시 테이블 또는 derived view
- rewind generation jobs
- rewind open events

왜 현재 구조와 맞는가:

- month/day record 모델이 이미 회상 집계를 만들기 좋은 형태다

### Post-MVP 3: Companion

추가:

- `companions`
- `companion_states`
- `ritual_signals`

왜 현재 구조와 맞는가:

- 기록 행동을 event-like signal로 읽어 companion state 계산 가능

### Post-MVP 4: 위치/주간 뷰/추가 포맷

추가:

- `day_record_slots.slot_type` 확장
- location payload schema 추가

왜 현재 구조와 맞는가:

- slot 모델이 additive extension에 적합하다

### Post-MVP 5: 멀티 캘린더

추가:

- UI만 열면 된다
- `calendars`는 이미 존재

왜 현재 구조와 맞는가:

- MVP부터 default calendar를 DB 모델로 넣었기 때문에 대수술이 줄어든다

### Post-MVP 6: Private Social

추가:

- `connections`
- `invite_codes`
- `visibility_rules`
- `shared_feed_items`

왜 현재 구조와 맞는가:

- user, calendar, day record, slot의 책임이 이미 분리되어 있어 visibility 레이어를 얹기 쉽다

## 15. 왜 이 설계가 MVP에 과하지 않은가

겉보기엔 future-proofing이 조금 들어가 있지만, 실제 MVP 구현 범위는 작다.

MVP에서 실제 구현하는 것은:

- auth 검증
- 기본 캘린더 1개
- day record CRUD
- month summary
- photo presign

즉, future phase를 위해 `앱 분리`, `calendar 모델`, `slot 모델`만 먼저 깔아두는 것이고,
push, rewind, social을 미리 구현하는 것은 아니다.

## 16. 권장하지 않는 대안

### 대안 1. Next.js Route Handler에 전부 구현

문제:

- frontend/backend 경계가 흐려진다
- RN/webview 확장 시 API가 web deployment에 종속된다
- 추후 jobs, push, social logic이 web app 안에 섞인다

### 대안 2. Supabase만 쓰고 자체 API를 만들지 않음

문제:

- business rule이 클라이언트로 새기 쉽다
- phase 확장 때 domain logic 위치가 애매해진다
- product-specific aggregation과 privacy 정책이 커질수록 통제력이 약해진다

### 대안 3. 멀티 캘린더, social을 MVP부터 반영

문제:

- 데이터 모델보다 제품 범위가 먼저 비대해진다
- 현재 핵심 검증 질문과 어긋난다

## 17. 최종 추천

MVP 기준 최종 추천은 아래와 같다.

- `apps/web`
  - Next.js frontend only
- `apps/api`
  - Fastify + TypeScript
  - core / infra 분리
- `packages/contracts`
  - Zod schema + DTO + shared types
- `Supabase`
  - Auth + Postgres + Storage
- `Drizzle`
  - schema / migration / query

이 조합은 다음 조건을 가장 잘 만족한다.

- 1인 개발자가 감당 가능한 구현 난이도
- 프론트와 백엔드의 분리
- MVP 개발 속도
- phase-strategy 기준의 확장 가능성

## 18. 다음 작업 추천

이 문서 다음으로 바로 이어지면 좋은 것은 3개다.

1. `apps/api`용 상세 PRD 또는 technical spec
2. `packages/contracts`의 API schema 초안 작성
3. MVP DB schema와 migration 초안 작성
