# sprint2-calendar-develop

## Discovery

### Service History And Policy Notes
- 현재 논의 범위는 `외부 데이터 없는 기본 캘린더`다.
- 공휴일, 외부 일정, 서버 동기화는 이번 스프린트에서 다루지 않는다.
- 날짜 뼈대는 저장 데이터가 아니라 계산 가능한 달력 엔진으로 본다.
- 공유 진입이 중요하므로 특정 날짜를 바로 여는 URL 정책이 초기 요구사항에 포함된다.

### Current Problem
- 기본 캘린더의 최소 책임이 문서로 고정돼 있지 않다.
- 현재 월 진입, 월 이동, 날짜 선택, 공유 진입 기준이 모호하다.
- 날짜 범위를 미리 저장할지 계산할지에 대한 판단이 흔들리고 있다.
- 이 상태로 구현하면 범위가 커지거나 나중에 구조를 다시 바꿔야 한다.

### Why Now
- 이번 스프린트는 캘린더의 가장 기본이 되는 동작을 먼저 안정화해야 한다.
- 이후 일정, 공유, 외부 연동을 붙이려면 날짜 엔진 기준이 먼저 고정돼야 한다.
- 데모 리뷰 전에 핵심 화면과 핵심 상태를 좁혀야 구현과 검증이 빨라진다.

## PRD Lite

### Goal
- 외부 데이터 없이도 동작하는 기본 월간 캘린더를 정의하고 구현 기준을 고정한다.
- 앱 진입, 월 이동, 날짜 선택, 공유 URL 진입이 한 흐름으로 자연스럽게 이어지게 한다.

### Success Criteria
- 앱 진입 시 사용자의 로컬 오늘 날짜가 포함된 현재 월이 열린다.
- 이전 월과 다음 월 이동이 자연스럽게 동작한다.
- 연도 제한 없이 월 단위 탐색이 가능하다.
- 월 그리드는 매번 계산으로 생성된다.
- 오늘, 선택한 날짜, 현재 월이 아닌 날짜가 구분되어 보인다.
- 공유 URL에 날짜가 있으면 해당 날짜가 포함된 월이 먼저 열리고 그 날짜가 선택 상태로 보인다.
- 잘못된 쿼리스트링이 들어와도 앱이 깨지지 않고 기본 오늘 기준 월로 안전하게 돌아간다.

### Non-Goals
- 공휴일 표시
- 외부 일정 연동
- 서버에서 날짜 뼈대를 내려주는 구조
- 주간, 일간, 연간 뷰
- 반복 일정, 알림, 캘린더 권한 정책
- 국가별 로컬라이징 정책 확장

### Scope
- 월간 캘린더 엔진
- 오늘 기준 초기 진입
- 이전/다음 월 탐색
- 날짜 선택 상태
- 다른 달 날짜 포함 월 그리드 렌더링
- 날짜 공유를 위한 쿼리스트링 해석과 안전한 fallback
- 데모 리뷰용 핵심 화면 `3`개에서 `5`개 정의

### Launch Or Marketing Notes
- 없음. 이번 스프린트는 내부 기본기 정리와 구현 기준 확정이 목적이다.

## UX Decisions

### Ambiguous Core Paths To Design
- 첫 진입에서 오늘이 어떻게 보이는지
- 공유 URL로 진입했을 때 어떤 월과 어떤 날짜가 먼저 보여야 하는지
- 월 이동 중 선택 날짜를 어떻게 유지할지
- 현재 월이 아닌 날짜를 어떤 강도로 구분할지

### Key UX Decisions
- 기본 뷰는 월간 캘린더 하나로 시작한다.
- 주 시작 요일은 `일요일`로 둔다.
- 첫 진입 기준은 `사용자 로컬 타임존의 오늘`이다.
- 월 그리드는 고정 데이터 저장이 아니라 연/월 계산으로 만든다.
- 월 셀에는 이전 달 말일과 다음 달 초일을 함께 보여준다.
- `오늘`과 `선택일`은 분리해서 표현한다.
- 공유 URL은 `?date=YYYY-MM-DD` 형식을 기본으로 본다.
- 쿼리스트링 날짜가 유효하면 해당 월을 열고 그 날짜를 선택한다.
- 쿼리스트링 날짜가 없거나 잘못되면 오늘 기준 현재 월을 연다.
- 이번 데모 리뷰는 아래 핵심 화면만 보면 된다.
  - 오늘 기준 월 진입 화면
  - 이전/다음 월 이동 화면
  - 날짜 선택 상태 화면
  - 공유 URL 날짜 진입 화면

### Asset Links
- [핵심 흐름 다이어그램](./assets/calendar-develop/diagrams/core-flow.md)

## Demo Review

### Prototype Location

### Included Screens (`3` to `5` max)

### Review Round (`1` or `2`)

### Feedback And Changes

### Approved Direction

## Technical Freeze

### Surface Ownership
- 1차 구현 surface는 `apps/web` 하나로 고정한다.
- 주 소유 범위는 아래로 제한한다.
  - `apps/web/features/calendar/hooks/use-month-range.ts`
  - `apps/web/features/calendar/utils/date.ts`
  - `apps/web/features/calendar/components/calendar-app.tsx`
  - 필요 시 `apps/web/app/page.tsx` 또는 캘린더 내부 route/query 처리 지점
- 이번 스프린트에서는 `apps/api`, `apps/mobile`, `packages/contracts`, `packages/ui`를 건드리지 않는다.
- `packages/app-core`에는 달력 보조 유틸이 이미 있지만, 이번 스프린트에서는 공유 패키지 추출까지 확장하지 않는다.
- UI, 디자인, 스크롤 상호작용 충돌이 생기면 새 구조보다 현재 구현을 우선 채택한다.

### Shared Contracts
- 서버 계약 변경 없음.
- 외부 데이터 계약 변경 없음.
- 공유 URL 계약은 웹 내부 규칙으로만 추가한다.
  - 형식: `?date=YYYY-MM-DD`
  - 유효한 날짜면 해당 월을 먼저 연다.
  - 유효한 날짜면 해당 날짜를 선택 상태로 연다.
  - 값이 없거나 잘못되면 오늘 기준 현재 월로 fallback 한다.
- 월 그리드 계산 결과는 기존 UI가 기대하는 shape를 유지한다.
  - 주 시작 요일: `일요일`
  - 한 주는 `7`칸 고정
  - 다른 달 날짜도 placeholder가 아니라 실제 날짜 값으로 채운다.
  - `today`, `selected`, `out-of-month` 구분 정보는 렌더에 필요한 최소 범위만 추가하거나 유지한다.

### Dependency Order
- 1. 현재 캘린더 UI가 의존하는 날짜 shape와 스크롤 기준을 고정한다.
- 2. 월 계산 로직을 정리한다.
  - 오늘 기준 초기 월
  - 이전/다음 월 확장
  - 월 시작 요일과 말일 계산
  - 다른 달 날짜 포함 `42`칸 grid 계산
- 3. 공유 URL `date` 파싱과 안전한 fallback을 붙인다.
- 4. 선택 날짜와 초기 스크롤 위치를 공유 날짜 기준까지 확장한다.
- 5. 기존 월 스크롤, 월 헤더, 날짜 셀 스타일이 그대로 유지되는지 확인한다.
- 의존성 기준상 구현 순서는 `date utils -> month range hook -> calendar app state -> UI smoke check`로 고정한다.

### Validation Plan
- 최소 검증 범위는 `apps/web`만 사용한다.
- 필수 검증:
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web test`
- 이번 변경은 월 계산과 초기 진입 흐름을 건드리므로 테스트 보강 범위도 함께 고정한다.
  - 월 grid가 다른 달 날짜까지 채워지는지
  - 유효한 `?date=YYYY-MM-DD`가 해당 월과 선택일을 여는지
  - 잘못된 `date` 값이 오늘 기준으로 fallback 되는지
  - 기존 월 확장 로직이 끊기지 않는지
- 필요 시 `pnpm --filter web build`를 추가한다.
  - App Router query 처리나 client/server 경계가 바뀌는 경우
  - route entrypoint가 바뀌는 경우

### Merge Guardrails
- 스프린트 범위는 `기본 월간 캘린더 엔진 보강`으로 고정한다.
- 아래 항목이 필요해지면 이번 작업에서 제외하고 후속으로 넘긴다.
  - 공휴일
  - 외부 일정 연동
  - API contract 변경
  - 주간/일간/연간 뷰
  - shared package 추출 리팩터
- 기존 UI, 디자인, 스크롤 동작이 바뀌면 merge blocker로 본다.
- `P1`, `P2` 리뷰 이슈가 남아 있으면 머지하지 않는다.
- 검증 명령을 돌리지 못했거나 실패 원인이 남아 있으면 머지하지 않는다.

## Delivery Notes

### Implementation Status
- `apps/web` 내부에서 월간 캘린더 엔진을 실제 구현했다.
- 월 그리드는 `42`칸 고정 계산으로 바꿨다.
  - 이전 달 말일, 다음 달 초일도 실제 날짜 값으로 채운다.
  - 바깥 달 날짜는 기존 셀 UI 안에서 약하게 구분한다.
- 첫 진입 기준을 `오늘`과 `공유 날짜`로 분리했다.
  - 기본 진입은 오늘 기준 현재 월
  - `?date=YYYY-MM-DD`가 유효하면 해당 월로 진입
  - 공유 날짜는 기존 선택 흐름을 재사용해 초기 open 상태로 연결
- 수정 범위는 `apps/web` 안으로 제한했다.
  - `app/page.tsx`
  - `features/calendar/utils/date.ts`
  - `features/calendar/hooks/use-month-range.ts`
  - `features/calendar/hooks/use-calendar-state.ts`
  - `features/calendar/components/calendar-app.tsx`
  - `features/calendar/components/day-cell.tsx`
  - 관련 모델/테스트

### Verification Summary
- 실행 시도:
  - `pnpm --filter web test`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web lint`
- 결과:
  - 세 명령 모두 현재 워크트리에 `node_modules`가 없어 실행 환경 단계에서 실패했다.
  - `test`는 `tsx: command not found`
  - `typecheck`는 `@workspace/typescript-config/nextjs.json`와 패키지 의존성 해석 실패
  - `lint`는 `@workspace/eslint-config` 해석 실패
- 코드 변경 자체에 대한 추가 점검으로 `git diff --check`는 통과했다.

### Reviewer Summary
- 1차 셀프 리뷰 기준:
  - 기존 UI, 디자인, 스크롤 상호작용 유지
  - 날짜 계산 정확성
  - 공유 URL fallback 안전성
- 현재 판단:
  - UI 구조 변경 없이 내부 날짜 계산과 초기 진입만 수정했다.
  - 공유 날짜는 새 상태를 만들지 않고 기존 선택 흐름에 연결했다.
  - 별도 `P1`, `P2` 이슈는 발견하지 못했다.

### Merge Result
- 이번 MERGE 단계에서는 local `main` 반영을 진행하지 않았다.
- blocker:
  - 필수 검증 `pnpm --filter web test`, `typecheck`, `lint`가 모두 환경 의존성 부재로 실패했다.
  - 현재 작업 브랜치 `codex/sprint2-calendar-develop`에 미커밋 변경이 남아 있다.
  - local `main` worktree `/Users/kimyoukwon/Desktop/toda-calendar`가 dirty 상태다.
- 위 세 항목이 정리되기 전에는 squash merge를 진행하지 않는다.

## Durable Delta

### Durable Repo Truths Updated
- `sprint2-calendar-develop`의 기본 범위를 `외부 데이터 없는 월간 캘린더 엔진`으로 고정했다.
- 날짜 뼈대는 저장이 아니라 계산으로 생성하는 정책으로 정리했다.
- 공유 진입은 `?date=YYYY-MM-DD` 쿼리스트링을 기본 규칙으로 둔다.
- 월 그리드는 `42`칸 고정 계산을 기준으로 한다.
- 바깥 달 날짜도 placeholder가 아니라 실제 날짜 값으로 채운다.

### Follow-Up Work
- 의존성 설치가 가능한 환경에서 `pnpm --filter web test`, `typecheck`, `lint`를 다시 실행해야 한다.
- 현재 worktree 변경을 검토 후 의도된 범위만 커밋해야 한다.
- local `main` worktree의 기존 변경 범위를 먼저 정리하거나 분리해야 한다.
