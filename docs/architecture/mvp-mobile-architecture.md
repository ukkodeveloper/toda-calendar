# Toda Calendar MVP Mobile Architecture

## 1. 문서 목적

이 문서는 [mvp-discovery.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/product/mvp-discovery.md), [phase-strategy.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/product/phase-strategy.md), [mvp-backend-architecture.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/architecture/mvp-backend-architecture.md)를 바탕으로, Toda Calendar의 `MVP 모바일 앱 구조`를 설계한 문서다.

이번 설계는 아래 스킬 조합의 원칙을 직접 반영한다.

- `vercel-react-native-skills`
  - native navigator 우선
  - state 최소화
  - monorepo에서 native dependency는 app package에 유지
  - large list는 성능 중심으로 설계
- `building-native-ui`
  - Expo Router route structure
  - formSheet 기반 sheet UX
  - Expo Go 우선
  - app 디렉터리에는 route만 두고 나머지 로직은 분리
- `api-and-interface-design`
  - contract-first
  - additive API evolution
- `nodejs-backend-patterns`
  - feature boundary
  - infra와 orchestration 분리

## 2. 핵심 결론

Toda MVP의 실제 출시 표면은 `React Native + Expo` 앱으로 가는 것이 맞다.

권장 방향:

- `apps/mobile`를 monorepo의 primary client로 둔다
- `Expo managed workflow`로 시작한다
- 핵심 기록 경험은 `WebView`가 아니라 native screen으로 구현한다
- `apps/web`는 보조 표면으로 둔다

즉, RN은 단순 껍데기만 두고 안쪽을 웹으로 채우는 구조보다, `월 뷰 / day record / photo / doodle`의 코어 플로우는 native-first로 가져가는 것이 Toda의 제품 성격에 더 잘 맞는다.

## 3. 왜 main WebView shell을 권장하지 않는가

Toda MVP의 핵심 상호작용은 아래와 같다.

- 월 뷰 스크롤과 탭 인터랙션
- day record bottom sheet
- 사진 선택/업로드
- 낙서 입력
- 저장 직후의 미세한 피드백
- 추후 푸시 딥링크와 haptic

이 조합은 단순 정보 앱보다 native interaction의 이점이 훨씬 크다.

main WebView shell의 문제:

- sheet와 gesture 품질이 떨어지기 쉽다
- 사진/카메라/파일 권한 플로우가 더 복잡해진다
- doodle/canvas 경험이 불안정해지기 쉽다
- push 딥링크 이후 상태 복원이 더 까다롭다
- 제품이 원하는 iPhone-first 감각을 살리기 어렵다

따라서 권장 원칙은 다음과 같다.

- `core product flow는 native`
- `정말 필요한 보조 화면만 제한적으로 web`

예:

- 약관/도움말/운영 공지
- 내부 어드민 미리보기
- 마케팅/소개

## 4. 설계 목표

MVP 모바일 앱이 만족해야 할 핵심은 다음과 같다.

- 월 뷰를 첫 홈으로 제공한다
- 날짜를 탭하면 day record screen이 `formSheet`처럼 열린다
- 사진 / 문장 / 낙서를 각각 입력할 수 있다
- autosave와 저장 상태 피드백이 가능하다
- deep link 가능한 route 구조를 가진다
- Expo Go에서 최대한 개발 가능한 범위로 시작한다
- phase 확장 시 구조를 깨지 않고 기능을 추가할 수 있다

## 5. 핵심 결정

### 결정 1. `apps/mobile`을 primary client로 둔다

monorepo의 사용자-facing 제품 표면은 `apps/mobile`이다.

이유:

- Toda는 iPhone-first 경험이 중요하다
- MVP 핵심 UX가 native route와 sheet에 잘 맞는다
- post-MVP 1의 알림/딥링크/재진입 구조와 자연스럽게 이어진다

### 결정 2. Expo managed workflow + Expo Router로 시작한다

이유:

- `building-native-ui` 기준으로 Expo Router route structure가 명확하다
- native stack과 formSheet를 바로 활용할 수 있다
- solo MVP 속도가 좋다
- Expo Go로 빠르게 검증하기 쉽다

원칙:

- 먼저 `Expo Go`에서 돌아가는 MVP를 만든다
- custom native build는 꼭 필요한 시점까지 미룬다

### 결정 3. day record는 route 기반 `formSheet`로 푼다

월 뷰가 중심이지만, 입력은 별도 full page보다 `formSheet` route가 더 자연스럽다.

권장:

- 월 뷰 route: `/calendar/[calendarId]`
- day record route: `/calendar/[calendarId]/day/[localDate]`
- day record route는 `presentation: "formSheet"` 사용

이유:

- 딥링크 가능
- push 이후 특정 날짜로 바로 진입 가능
- iOS에 더 자연스럽다
- 내부 상태보다 route가 source of truth가 되기 쉽다

### 결정 4. 공유는 `UI`가 아니라 `순수 로직`만 한다

웹과 모바일은 렌더링 표면이 다르므로, 처음부터 cross-platform UI 공유를 목표로 두지 않는다.

공유 대상:

- `packages/contracts`
- `packages/app-core`
  - query key
  - date helper
  - DTO adapter
  - enum / constants
  - pure domain utility

공유하지 않는 것:

- React component
- styling token implementation
- native dependency wrapper

### 결정 5. native dependency는 `apps/mobile`에 직접 둔다

`vercel-react-native-skills` 원칙대로, native code가 필요한 dependency는 shared package에만 두지 않는다.

예:

- `react-native-reanimated`
- `react-native-gesture-handler`
- `react-native-svg`
- `expo-image-picker`

이런 dependency는 반드시 `apps/mobile/package.json`에 직접 들어가야 한다.

## 6. 권장 기술 스택

| 영역 | 권장 선택 | 이유 |
|---|---|---|
| App shell | `Expo` managed workflow | MVP 속도와 운영 단순성 |
| Routing | `expo-router` | file-based route, native stack |
| Navigation | Expo Router `Stack` | native stack 사용 |
| Sheet presentation | `presentation: "formSheet"` | iOS에 자연스럽고 MVP UX와 맞음 |
| Server state | `@tanstack/react-query` | month/day record cache와 mutation에 적합 |
| API contracts | `packages/contracts` + Zod | backend와 동일 계약 |
| Shared pure logic | `packages/app-core` | web/mobile 공용 순수 TS |
| Auth | `@supabase/supabase-js` + `expo-secure-store` | backend auth 전략과 일치 |
| Image rendering | `expo-image` | RN skill / Expo skill 모두와 정합 |
| Photo picking | `expo-image-picker` | MVP 사진 입력 |
| Doodle | `react-native-svg` + gesture 기반 stroke 저장 | Expo Go 친화적 |
| Haptics | `expo-haptics` | 저장/전환 피드백 강화 |
| Safe area | `react-native-safe-area-context` | Expo 권장 |
| Notifications later | `expo-notifications` | post-MVP 1 확장 |

### doodle에서 Skia 대신 SVG를 먼저 권장하는 이유

Skia는 강력하지만 solo MVP에서는 초기 복잡도를 올릴 수 있다.

MVP에서는 아래가 더 중요하다.

- 빠르게 동작할 것
- Expo Go 친화적일 것
- stroke JSON을 저장하기 쉬울 것

그래서 초기 낙서는 `stroke[] -> SVG path 렌더링` 구조가 더 현실적이다.

## 7. 모노레포 구조 제안

```text
apps/
  mobile/
    app/
      _layout.tsx
      +not-found.tsx
      (auth)/
        sign-in.tsx
      (app)/
        _layout.tsx
        index.tsx
        calendar/
          [calendarId]/
            index.tsx
            day/
              [localDate].tsx
    src/
      components/
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
        query/
        haptics/
      providers/
        app-providers.tsx
        query-provider.tsx
        session-provider.tsx
  web/
packages/
  contracts/
  app-core/
  ui/
```

### 경계 규칙

- `app/`에는 route와 `_layout`만 둔다
- reusable component와 logic은 `src/` 아래로 보낸다
- `packages/app-core`는 pure TypeScript만 허용한다
- native dependency는 `apps/mobile`이 직접 가진다
- `packages/ui`를 모바일과 웹 공용 UI 패키지로 만들지 않는다

## 8. 라우팅 설계

### 8.1 기본 경로

- `/`
  - 기본 캘린더로 redirect
- `/sign-in`
- `/calendar/[calendarId]`
- `/calendar/[calendarId]?month=2026-04&layer=PHOTO`
- `/calendar/[calendarId]/day/[localDate]`

### 8.2 권장 route 구조

```text
app/
  _layout.tsx
  +not-found.tsx
  (auth)/
    sign-in.tsx
  (app)/
    _layout.tsx
    index.tsx
    calendar/
      [calendarId]/
        index.tsx
        day/
          [localDate].tsx
```

### 8.3 sheet route 처리

`[localDate].tsx`는 별도 route이지만 UI는 sheet처럼 보이게 처리한다.

권장 screen option:

- `presentation: "formSheet"`
- `sheetGrabberVisible: true`
- `sheetAllowedDetents: [0.5, 1.0]`
- `contentStyle: { backgroundColor: "transparent" }`

이 구조 덕분에:

- 월 뷰 맥락을 유지하면서 입력 가능
- 딥링크 가능
- 향후 알림 클릭 후 특정 날짜 진입 가능

## 9. 상태 관리 전략

모바일에서도 상태는 3종류로 나눈다.

### 9.1 Navigation / URL state

- `calendarId`
- `month`
- `layer`
- `localDate`
- 필요 시 `slot`

Expo Router의 route param과 search param을 source of truth로 둔다.

### 9.2 Server state

- `me`
- `calendars`
- `month-view`
- `day-record`
- `upload-presign`

TanStack Query key 예시:

```ts
["me"]
["calendars"]
["month-view", calendarId, month, layer]
["day-record", calendarId, localDate]
```

### 9.3 UI state

- 현재 편집 slot
- phrase draft
- doodle draft
- upload progress
- autosave indicator

원칙:

- 중복 state를 만들지 않는다
- query 데이터에서 파생 가능한 값은 render에서 계산한다
- global store는 기본 도입하지 않는다

## 10. 데이터 흐름

### 10.1 bootstrap

1. 세션 확인
2. 필요 시 `/sign-in` 이동
3. 기본 calendar 결정
4. month-view bootstrap
5. month route 렌더링

### 10.2 날짜 탭

1. 사용자가 셀을 탭
2. `/calendar/[calendarId]/day/[localDate]`로 push
3. day record query 실행
4. formSheet route 표시

### 10.3 phrase autosave

1. phrase draft 변경
2. debounce
3. `PATCH /day-records/:localDate`
4. day record cache / month-view cache 갱신
5. 저장 성공 시 haptic + status 반영

### 10.4 photo flow

1. 이미지 선택
2. `POST /uploads/photos/presign`
3. storage direct upload
4. `PATCH /day-records/:localDate`
5. month/day cache 동기화

### 10.5 doodle flow

1. stroke draft 유지
2. idle 또는 debounce 시 patch
3. stroke JSON 저장
4. month/day cache 갱신

## 11. 컴포넌트와 feature 경계

### route file

책임:

- page entry
- screen option
- route param 해석
- feature component 연결

원칙:

- route는 얇게 유지
- fetch/mutation 로직을 직접 넣지 않는다

### `src/features/`

책임:

- query / mutation
- route state 해석
- orchestration

예:

- `features/calendar-month`
- `features/day-record`
- `features/uploads`

### `src/components/`

책임:

- 프레젠테이션 단위
- props contract 소비

예:

- `MonthGrid`
- `CalendarCell`
- `DayRecordSheetFrame`
- `PhraseEditor`
- `DoodleCanvas`
- `SaveStatusBadge`

## 12. 성능 관점 메모

### 월 뷰

한 달만 렌더링하면 복잡도가 낮지만, Apple Calendar처럼 여러 달을 연속 스크롤하는 구조로 가면 리스트 성능이 중요해진다.

권장:

- 단일 month MVP면 단순 grid로 시작
- 여러 month를 세로로 붙이면 `FlashList` 검토
- cell component는 가볍게 유지
- inline object와 inline callback을 과도하게 만들지 않는다

### derived state

아래는 state로 저장하지 않는다.

- 선택된 셀의 강조 여부
- month completeness 비율
- slot 존재 여부에서 파생 가능한 badge

파생 가능한 값은 render에서 계산한다.

## 13. MVP 구현 우선순위

### Step 1. mobile app scaffold

- `apps/mobile` 생성
- Expo Router 세팅
- root layout / route group 구성

### Step 2. provider와 API boundary

- query provider
- session provider
- API client
- contracts 연결

### Step 3. month route

- calendar route
- month query
- layer 전환
- date 탭

### Step 4. day formSheet

- day record route
- slot segmented control
- phrase autosave
- doodle autosave

### Step 5. photo flow

- image picker
- presign
- upload
- patch

### Step 6. polish-ready hooks

- haptic
- error boundary
- loading state
- deep link readiness

## 14. Phase 확장 적합성

### Post-MVP 1

- `expo-notifications`
- 알림 클릭 시 day route deep link

### Post-MVP 2

- weekly rewind route 추가
- 회상 카드 feature slice 추가

### Post-MVP 3

- companion panel / ritual UI 추가
- month route 옆 보조 panel 또는 card 추가

### Post-MVP 4

- 위치 slot 추가
- 주간 뷰 route 추가

### Post-MVP 5

- calendar switcher
- 여러 calendar route

### Post-MVP 6

- feed tab
- visibility-aware social route
- 이 시점부터 `NativeTabs` 검토

## 15. 최종 추천

Toda MVP 모바일 앱은 아래 원칙으로 가는 것이 가장 좋다.

- `Expo managed workflow`
- `Expo Router`
- `native stack + formSheet`
- `main WebView shell 비권장`
- `TanStack Query`
- `Supabase auth + storage`
- `packages/contracts` + `packages/app-core`
- `apps/mobile`에 native dependency 직접 선언
- `Expo Go`에서 먼저 검증

이 방향이 MVP에도 맞고, phase-strategy의 post-MVP 1~6 확장에도 가장 자연스럽다.
