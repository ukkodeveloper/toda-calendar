# Toda Calendar MVP Web Frontend Architecture

## 1. 문서 목적

이 문서는 [mvp-discovery.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/product/mvp-discovery.md), [phase-strategy.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/product/phase-strategy.md), [mvp-backend-architecture.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/architecture/mvp-backend-architecture.md)를 바탕으로, Toda Calendar의 `MVP 웹 프론트엔드 구조`를 설계한 문서다.

중요한 전제 변경:

- 실제 출시 표면은 `apps/mobile`의 React Native / Expo 앱을 기준으로 간다
- 이 문서는 그와 병행되는 `apps/web` 지원 표면을 정의한다
- 모바일 앱 구조는 [mvp-mobile-architecture.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/architecture/mvp-mobile-architecture.md)에서 별도로 다룬다

이번 설계는 아래 스킬 조합의 원칙을 반영한다.

- `nextjs-best-practices`
  - App Router
  - Server by default
  - client boundary 최소화
  - route / loading / error 구조화
- `ckm:design-system`
  - 컴포넌트 상태와 spec을 체계적으로 분리
  - UI token과 로직 레이어를 섞지 않음
- `nodejs-backend-patterns`
  - 계층 분리
  - boundary 명확화
  - 에러/입력 계약 일관성
- `vercel-react-native-skills`
  - monorepo에서 native dependency를 app에 유지
  - 웹과 모바일 사이에는 UI가 아니라 순수 로직만 공유
- `building-native-ui`
  - shipping surface는 Expo Router 기반 mobile route를 기준으로 잡고
  - web은 지원 표면으로 분리

중요:

- 이 문서는 `스타일링`, `애니메이션`, `토큰`, `시각 연출`이 아니라
  `프론트 로직`, `폴더 구조`, `상태 설계`, `API 연동`, `컴포넌트 경계`에 집중한다.
- 스타일과 모션은 다른 스레드에서 작업 중이라는 전제를 유지한다.

## 1.1 현재 프론트 표면 전략

Toda의 MVP 프론트 표면은 아래처럼 나눈다.

- `apps/mobile`
  - 실제 사용자 출시 앱
  - 월 뷰, day record sheet, 사진/문장/낙서 입력의 주 표면
- `apps/web`
  - 지원 표면
  - 랜딩, 대기자/소개, 내부 프리뷰, QA, 운영용 fallback에 우선 사용

즉, 이제 `apps/web`는 제품의 중심 shell이 아니라, 모바일 제품을 보조하는 표면으로 설계한다.

## 2. 프론트엔드 설계 목표

MVP 웹 프론트가 만족해야 할 핵심은 다음과 같다.

- 모바일 출시를 막지 않는 지원 표면을 제공한다
- API contracts와 순수 로직을 모바일과 공유할 수 있다
- 랜딩/소개/운영/프리뷰 표면을 자연스럽게 담을 수 있다
- 필요할 경우 웹용 month/day preview를 추가해도 구조가 깨지지 않는다
- 백엔드 API와 강하게 결합되지 않고 contracts 기반으로 통신한다
- phase 확장 시 구조를 깨지 않고 기능을 추가할 수 있다

## 3. 핵심 결정

### 결정 1. Next.js는 `지원 표면 오케스트레이션 레이어`로 사용한다

`apps/web`는 출시용 핵심 앱 shell이 아니라, 아래 역할을 담당하는 지원 표면이다.

- 마케팅/소개 페이지
- 로그인 보조 플로우
- 내부 QA/프리뷰 화면
- 필요 시 제한적인 웹 viewer

그래도 구조는 얇은 페이지 + feature orchestration 원칙을 유지한다.

하지만 product domain logic 자체는 여전히 프론트에 두지 않는다.

즉:

- 기록 생성 규칙
- slot upsert 규칙
- month summary 조립

이런 것은 백엔드에 둔다.

### 결정 2. Server Component 기본, Client Island 선택

`nextjs-best-practices` 기준으로:

- 서버에서 해도 되는 것은 서버에서 한다
- 진짜 인터랙션만 client component로 내린다

Toda MVP에서 client가 꼭 필요한 부분:

- month grid interaction
- bottom sheet open/close
- phrase input
- doodle canvas
- photo picking/upload progress
- autosave status

반대로 server component가 적합한 부분:

- auth gate
- route shell
- initial bootstrap fetch
- 정적/반정적 문서성 UI

### 결정 3. 스타일 계층과 로직 계층을 분리한다

다른 스레드에서 스타일/애니메이션을 작업 중이므로, 프론트 구조는 처음부터 아래처럼 나눈다.

- `components/`
  - 시각적 조합 컴포넌트
- `features/`
  - 화면 단위 로직
- `lib/`
  - API, env, dates, utilities
- `providers/`
  - app-wide provider

이렇게 해야 스타일 스레드와 로직 스레드가 서로 덜 충돌한다.

### 결정 4. 상태는 3종류로 나눈다

MVP에서 상태를 아래 세 가지로 명확히 분리한다.

1. `URL state`
   - 현재 캘린더
   - 현재 month
   - 현재 layer
   - 현재 선택된 date

2. `Server state`
   - me
   - calendars
   - month view data
   - day record data
   - upload/presign result

3. `UI state`
   - sheet opened 여부
   - 현재 편집 탭
   - 임시 autosave 상태
   - upload progress
   - error toast / inline error

이 분리를 지키면 global store를 과하게 도입하지 않아도 된다.

## 4. 권장 기술 스택

| 영역 | 권장 선택 | 이유 |
|---|---|---|
| Routing | Next.js App Router | 현재 구조와 일치 |
| Server/Client data bridge | RSC + client hydration | server default 원칙 유지 |
| API client | fetch wrapper + `packages/contracts` Zod types | backend contract와 일치 |
| Server state cache | TanStack Query | month/day record mutation과 cache invalidation에 적합 |
| Auth client | Supabase JS | backend auth 전략과 일치 |
| Form/input state | local state + feature hooks | MVP에서 과한 form library 불필요 |
| Doodle state | local reducer or feature hook | canvas 상태 국지화 |
| URL state | `searchParams` + router navigation | deep link와 back/forward에 유리 |
| Error handling | route-level error boundary + feature inline error | App Router 패턴에 적합 |

### 왜 TanStack Query를 권장하는가

MVP는 단순해 보여도 실제로는 아래 cache가 필요하다.

- 현재 month summary
- 현재 day record
- photo upload 후 month summary 동기화
- patch 성공 후 상세/월 뷰 양쪽 반영

이건 local state만으로 금방 복잡해진다.

## 4.1 UI 스레드와의 작업 경계

현재 스타일링/애니메이션은 다른 스레드에서 진행 중이므로, 이번 프론트 구조는 아래 경계를 기본 규칙으로 삼는다.

로직 스레드가 담당하는 것:

- route와 page entry
- feature hook
- query / mutation
- API client
- provider
- URL state
- adapter / mapper
- loading / error skeleton의 구조

UI 스레드가 담당하는 것:

- visual component styling
- motion / transition
- token / CSS 변수
- bottom sheet의 시각 완성도
- calendar cell의 미감과 interaction polish

충돌을 줄이는 규칙:

- `features/`는 로직 우선으로 작성하고, 스타일 클래스는 최소화한다
- `components/`는 프레젠테이션 contract만 먼저 잡고, 시각 완성은 나중에 입힌다
- `packages/ui` 수정은 시각 시스템 변경이 필요한 경우에만 한다
- MVP 로직 구현 동안 `apps/web/app`의 page는 얇게 유지한다

## 5. 모노레포 구조 제안

```text
apps/
  web/
    app/
      (public)/
        login/
          page.tsx
      (app)/
        layout.tsx
        page.tsx
        calendar/
          [calendarId]/
            page.tsx
            loading.tsx
            error.tsx
            day/
              [localDate]/
                page.tsx
    components/
      app-shell/
      calendar/
      day-record/
      common/
    features/
      auth/
      bootstrap/
      calendar-month/
      day-record/
      uploads/
    lib/
      api/
      auth/
      dates/
      env/
      errors/
      query/
    providers/
      app-providers.tsx
      query-provider.tsx
      supabase-provider.tsx
packages/
  app-core/
  contracts/
  ui/
```

여기서:

- `apps/mobile`가 실제 사용자 표면이다
- `apps/web`는 보조 표면이다
- `packages/app-core`는 웹/모바일이 공유할 수 있는 순수 TypeScript 로직만 담는다
- `packages/ui`는 현재 기준으로 web UI 패키지로 유지한다

### 현재 레포 기준 최소 추가 대상

지금 레포는 `apps/web`가 거의 스캐폴드 상태이므로, MVP 프론트 구조를 시작할 때 최소한 아래 파일/폴더부터 추가하면 된다.

```text
apps/web/
  app/
    (public)/
      login/
        page.tsx
    (app)/
      layout.tsx
      page.tsx                     # default calendar redirect
      calendar/
        [calendarId]/
          page.tsx
          loading.tsx
          error.tsx
          day/
            [localDate]/
              page.tsx
  components/
    calendar/
      month-grid.tsx
      calendar-cell.tsx
      layer-toggle.tsx
    day-record/
      day-record-sheet-frame.tsx
      slot-segment-control.tsx
      save-status-badge.tsx
  features/
    bootstrap/
      get-bootstrap-data.ts
    calendar-month/
      calendar-month-screen.tsx
      use-month-view-query.ts
      use-layer-state.ts
    day-record/
      day-record-sheet-controller.tsx
      use-day-record-query.ts
      use-day-record-autosave.ts
    uploads/
      use-photo-upload.ts
  lib/
    api/
      client.ts
      month-view.ts
      day-records.ts
      uploads.ts
    auth/
      session.ts
      require-session.ts
    dates/
      calendar.ts
      local-date.ts
    query/
      keys.ts
      query-client.ts
  providers/
    app-providers.tsx
    query-provider.tsx
packages/
  contracts/
```

## 6. 폴더별 책임

### 6.1 `app/`

책임:

- route entry
- server-side auth gate
- page composition
- loading / error / not-found

원칙:

- page는 가능한 한 얇게 유지
- product logic은 `features/`로 보낸다

### 6.2 `components/`

책임:

- 재사용 가능한 렌더링 단위
- feature 내부 logic을 소비하는 프레젠테이션 컴포넌트

예:

- `MonthGrid`
- `CalendarCell`
- `LayerSwitcher`
- `DayRecordSheetFrame`
- `PhraseEditor`
- `PhotoSlot`
- `SaveStatusBadge`

원칙:

- business fetch를 직접 하지 않는다
- API를 직접 모른다
- props contract만 안다

### 6.3 `features/`

책임:

- 화면/기능 단위 orchestration
- query, mutation, derived state
- URL state 해석
- optimistic update와 invalidation

예:

- `features/calendar-month`
  - 현재 month summary 조회
  - layer 전환
  - date selection
- `features/day-record`
  - day record fetch
  - patch mutation
  - autosave orchestration
- `features/uploads`
  - presign 요청
  - upload 수행
  - assetId patch 연결

### 6.4 `lib/`

책임:

- 순수 helper
- api client
- env/config
- auth client
- query key factory

예:

- `lib/api/client.ts`
- `lib/api/errors.ts`
- `lib/query/keys.ts`
- `lib/dates/month.ts`
- `lib/auth/session.ts`

### 6.5 `providers/`

책임:

- app-wide provider 조립

예:

- `QueryClientProvider`
- Supabase session provider
- Theme provider는 현재처럼 app-level 유지

## 7. 라우팅 설계

## 7.1 기본 경로

권장:

- `/login`
- `/calendar/[calendarId]`
- `/calendar/[calendarId]?month=2026-04&layer=PHOTO`
- `/calendar/[calendarId]/day/[localDate]`

### 왜 `day/[localDate]` route를 두는가

MVP UI는 bottom sheet 중심이어도, canonical route는 따로 두는 게 좋다.

이유:

- direct deep link 가능
- phase 1 푸시에서 특정 날짜로 진입 가능
- 웹에서도 새로고침/공유/디버깅이 쉬움
- future intercepting route로 확장 가능

MVP에서는 다음처럼 운영한다.

- 월 뷰에서 날짜 클릭
  - URL에 `selectedDate`를 반영하거나
  - `day/[localDate]`로 이동한 뒤 sheet-like UI를 렌더링

개인적으로는 MVP에서 아래 방식이 가장 현실적이다.

- canonical route: `/calendar/[calendarId]/day/[localDate]`
- month page에서도 동일 component를 sheet wrapper로 재사용

즉, `화면 상태`와 `딥링크 가능성`을 둘 다 잡는다.

## 8. Server / Client 경계 설계

### 8.1 Server Component로 둘 것

- `(app)/layout.tsx`
- `calendar/[calendarId]/page.tsx`
- auth gate wrapper
- bootstrap payload fetch wrapper

이 레이어는:

- 세션 확인
- 기본 캘린더 리다이렉트
- 초기 month/layer 파라미터 해석
- 초기 데이터 prefetch

까지 담당한다.

### 8.2 Client Component로 둘 것

- `CalendarMonthScreen`
- `MonthGrid`
- `DayRecordSheetController`
- `PhraseInput`
- `PhotoUploader`
- `DoodleEditor`
- `LayerToggle`
- `AutosaveStatus`

원칙:

- `use client`는 feature entry에서만 선언
- 하위 component는 가능한 한 dumb component

## 9. 데이터 흐름

### 9.1 App bootstrap

1. server route가 session을 확인
2. 필요하면 `/login`으로 redirect
3. 현재 calendarId와 month/layer를 결정
4. bootstrap data를 가져옴
   - `GET /v1/me`
   - `GET /v1/calendars`
   - `GET /v1/calendars/:calendarId/month-view`
5. client screen에 hydrate

### 9.2 날짜 클릭

1. 사용자가 calendar cell 클릭
2. URL state 업데이트
3. `day-record` feature가 `GET /day-records/:localDate` 호출
4. bottom sheet open

### 9.3 phrase autosave

1. 사용자가 phrase 수정
2. local draft state 업데이트
3. debounce 후 `PATCH /day-records/:localDate`
4. 성공 시:
   - day record query cache 업데이트
   - month view query cache preview 업데이트
   - save status 성공 표시

### 9.4 photo upload

1. 사용자가 이미지 선택
2. `POST /uploads/photos/presign`
3. storage direct upload
4. 성공 시 `PATCH /day-records/:localDate` with `assetId`
5. month view cache와 day record cache 동기화

### 9.5 doodle autosave

1. 사용자가 doodle 수정
2. local canvas state 유지
3. idle/debounce 시 patch
4. cache 업데이트

## 10. 상태 관리 전략

### 10.1 URL state

다음은 URL에서 관리한다.

- `calendarId`
- `month`
- `layer`
- `selectedDate`

이유:

- deep link 가능
- back/forward 동작 자연스러움
- phase 1 push와 연결 가능

### 10.2 Server state

TanStack Query key 예시:

```ts
["me"]
["calendars"]
["month-view", calendarId, month, layer]
["day-record", calendarId, localDate]
```

원칙:

- 서버 응답은 query cache가 source of truth
- optimistic update는 최소 범위만

### 10.3 UI state

로컬 state로 충분한 것:

- sheet open
- active slot tab
- phrase draft
- doodle draft
- upload progress
- save indicator

MVP에서는 `Zustand` 같은 글로벌 store를 기본 도입하지 않는다.

도입 조건:

- month page와 sheet가 여러 route에서 같은 interactive state를 공유해야 할 때
- local state lifting이 과도해질 때

그 전까지는:

- URL state
- query cache
- local component state

이 세 가지로 충분하다.

## 11. 계약 중심 API 연동

`packages/contracts`를 중심으로 프론트/백엔드를 맞춘다.

### 원칙

- request/response DTO는 contracts에서 import
- 프론트는 임의 타입을 새로 만들지 않는다
- API client는 DTO -> UI view model adapter 정도만 가진다

예:

```ts
// contracts
type GetMonthViewResponse = ...

// frontend adapter
function toMonthGridModel(dto: GetMonthViewResponse) {
  return dto.cells.map(...)
}
```

즉:

- contract는 공유
- UI shape는 adapter에서 파생

## 12. 컴포넌트/기능 구조 제안

### 12.1 Month screen

```text
CalendarMonthPage (server)
  -> CalendarMonthScreen (client feature)
     -> CalendarToolbar
     -> MonthGrid
        -> CalendarCell[]
     -> DayRecordSheetController
```

### 12.2 Day record feature

```text
DayRecordSheetController
  -> useDayRecordQuery
  -> useDayRecordAutosave
  -> DayRecordSheetFrame
     -> SlotSegmentControl
     -> PhotoEditor
     -> PhraseEditor
     -> DoodleEditor
     -> SaveStatusBadge
```

### 12.3 Upload feature

```text
PhotoEditor
  -> usePhotoUpload
     -> requestPresign
     -> uploadToStorage
     -> patchDayRecordPhoto
```

## 13. 에러/로딩 설계

### route level

- `loading.tsx`
- `error.tsx`

### feature level

- month view fetch error
- day record load error
- upload failure
- autosave failure

원칙:

- 화면 전체 실패와 slot level 실패를 구분한다
- autosave 실패는 전체 crash처럼 보이면 안 된다

## 14. MVP 구현 우선순위

### Step 1. 구조 세팅

- `providers/`
- `lib/api`
- `lib/query`
- `features/calendar-month`
- `features/day-record`

### Step 2. 인증/부트스트랩

- Supabase session provider
- auth gate
- me / calendars bootstrap

### Step 3. month view

- page route
- month summary query
- layer switching
- selected date URL state

### Step 4. day record sheet

- day record query
- segmented slot editing
- phrase autosave
- doodle autosave

### Step 5. photo flow

- presign request
- upload
- patch
- month/day cache sync

## 14.1 로직 우선 구현 순서

스타일이 아직 확정되지 않았다는 점을 감안하면, 프론트는 아래 순서로 구현하는 것이 가장 안전하다.

### 1. App shell과 provider

- `providers/app-providers.tsx`
- `providers/query-provider.tsx`
- `lib/query/query-client.ts`

목표:

- TanStack Query를 붙이고
- 이후 feature hook이 바로 올라올 수 있는 기반을 만든다

### 2. API client와 query key

- `lib/api/client.ts`
- `lib/api/month-view.ts`
- `lib/api/day-records.ts`
- `lib/api/uploads.ts`
- `lib/query/keys.ts`

목표:

- backend contract와 연결되는 가장 얇은 typed client를 먼저 만든다
- UI 컴포넌트가 API 형식을 직접 알지 않게 한다

### 3. route entry와 auth gate

- `(app)/page.tsx`
- `calendar/[calendarId]/page.tsx`
- `calendar/[calendarId]/day/[localDate]/page.tsx`
- `lib/auth/require-session.ts`

목표:

- route 구조와 redirect 규칙을 먼저 고정한다
- deep link 가능한 day route를 초기에 확보한다

### 4. month/day feature hook

- `use-month-view-query.ts`
- `use-day-record-query.ts`
- `use-day-record-autosave.ts`

목표:

- 화면보다 먼저 data orchestration을 안정화한다
- 추후 스타일링 변경이 와도 feature contract는 유지한다

### 5. 얇은 skeleton component

- `calendar-month-screen.tsx`
- `day-record-sheet-controller.tsx`
- `month-grid.tsx`
- `day-record-sheet-frame.tsx`

목표:

- 구조와 props contract만 먼저 고정한다
- 시각 완성은 다른 스레드에서 올려도 된다

## 15. Phase 확장 관점에서의 적합성

### Post-MVP 1

필요해지는 것:

- push deep link handling
- `selectedDate`/canonical day route 활용

이 구조와 맞는 이유:

- URL state 중심이라 deep link 추가가 자연스럽다

### Post-MVP 2

필요해지는 것:

- weekly rewind route/group
- rewind card feature

이 구조와 맞는 이유:

- month/day feature와 별도 feature slice로 추가 가능

### Post-MVP 3

필요해지는 것:

- companion panel
- ritual indicator

이 구조와 맞는 이유:

- app shell 옆에 feature slice로 추가 가능
- month/day core를 깨지 않는다

### Post-MVP 4

필요해지는 것:

- week view feature
- location slot editor

이 구조와 맞는 이유:

- `slot_type` 기반 editor registry로 확장 가능

### Post-MVP 5

필요해지는 것:

- calendar switcher
- calendar list route/state

이 구조와 맞는 이유:

- calendarId가 이미 URL state의 핵심 키다

### Post-MVP 6

필요해지는 것:

- personal/feed route group 분리
- visibility-aware shared cards

이 구조와 맞는 이유:

- feature slice와 route group 분리를 그대로 확장하면 된다

## 16. 권장하지 않는 구조

### 대안 1. `app/page.tsx` 하나에 전부 넣기

문제:

- 로직과 스타일 스레드가 계속 충돌한다
- MVP 이후 확장이 어려워진다

### 대안 2. 모든 것을 client component로 만들기

문제:

- Next.js App Router 장점을 버린다
- auth/bootstrap/load boundary가 약해진다

### 대안 3. 글로벌 상태 저장소부터 도입하기

문제:

- URL state와 server state의 책임이 흐려진다
- MVP엔 과하다

## 17. 최종 추천

MVP 웹 프론트는 아래 원칙으로 가는 게 가장 좋다.

- `Next.js App Router`
- `Server by default`
- `interactive parts only client`
- `features/` 중심 구조
- `packages/contracts` 기반 API 연동
- 가능하면 `packages/app-core` 기반의 순수 로직 공유
- `TanStack Query`로 server state 관리
- `URL state + local state` 중심
- 스타일/모션은 별도 레이어로 작업

단, 이 문서는 이제 `출시 앱 그 자체`가 아니라 `모바일 제품을 보조하는 web surface` 문서로 이해하는 것이 맞다.

## 18. 다음 작업 추천

바로 이어서 하면 좋은 작업은 아래 순서다.

1. `apps/web` 폴더 구조 스캐폴딩
2. `packages/contracts` 프론트 소비 구조 정의
3. month/day feature용 query key와 API client 초안 작성
4. `CalendarMonthScreen`과 `DayRecordSheetController`의 skeleton 구현

## 19. 구현 착수 판단

이 문서는 현재 레포 기준으로 바로 구현을 시작해도 되는 수준의 경계를 잡는 데 목적이 있다.

즉, 다음 단계에서 중요한 건:

- UI를 완성하는 것보다 먼저 `route`, `state`, `contract`, `feature boundary`를 고정하는 것
- 백엔드가 준비되기 전에도 mock/fake adapter로 프론트 구조를 먼저 세울 수 있게 하는 것
- post-MVP 확장 시 `feature slice`를 추가하는 방식으로 커지게 만드는 것이다
