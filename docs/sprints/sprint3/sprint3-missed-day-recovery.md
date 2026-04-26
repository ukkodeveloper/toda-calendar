# sprint3-missed-day-recovery

## Discovery

### Service History And Policy Notes

- Toda는 빈 하루를 `실패`나 `누락`처럼 다루지 않는다.
- 이번 스프린트의 복구 흐름은 새 화면이 아니라 기존 홈 흐름 안에서 끝내야 한다.
- 주 진입점은 캘린더 홈의 `QuietNudge`다.
- 복구 액션은 기존 `DayEditorSheet`와 `QuietToast`를 재사용한다.
- 후보 날짜는 `어제 -> 그제` 순서로만 본다.
- 한 번에 하나의 날짜만 제안한다.
- 셀 표시는 이번 스프린트에서 넣지 않는다.

### Current Problem

- 최근 하루가 비어 있어도 홈에서 조용히 다시 채울 진입점이 없다.
- 빈 날짜를 강하게 표시하면 Toda 톤과 어긋나기 쉽다.
- 복구를 위해 새 페이지나 무거운 리마인드 흐름을 만들면 범위가 커진다.
- `어제`와 `그제` 중 무엇을 언제 보여줄지 정책이 없으면 구현이 흔들린다.

### Why Now

- 최근 `1`~`2`일 공백은 실제 사용 중 자주 생기는 작은 이탈이다.
- 지금 노출 정책과 톤을 고정해야 데모 구현을 짧게 가져갈 수 있다.
- 이번 스프린트에서 홈 진입, 저장 완료, 닫기 처리만 잠그면 구현 범위를 작게 유지할 수 있다.

## PRD Lite

### Goal

- 빈 하루를 실패처럼 보이게 하지 않고, 캘린더 홈에서 최근 공백 하루를 조용히 채우도록 돕는다.

### Success Criteria

- 앱 첫 진입에서 조건을 만족하면 홈에 `QuietNudge`가 최대 `1`건만 보인다.
- `어제`가 비어 있으면 `어제`를 먼저 제안한다.
- `어제`가 채워져 있으면 `그제`를 제안한다.
- 사용자가 `열어보기`를 누르면 기존 `DayEditorSheet`가 대상 날짜로 바로 열린다.
- 저장 완료 후 `QuietToast`가 날짜 기준 동적 문구로 노출된다.
- 사용자가 닫거나, 시트만 열고 저장 없이 나오면 `24시간` 동안 다시 제안하지 않는다.
- 한 번 저장 완료한 날짜는 다시 제안하지 않는다.

### Non-Goals

- 외부 알림
- 전용 복구 페이지
- 복수 날짜 일괄 복구
- 셀 표시를 통한 별도 행동 유도
- `실패`, `누락`, `연속 기록` 같은 압박 문구
- `3`일 이상 지난 날짜 복구 제안

### Scope

- `Calendar Home`의 `QuietNudge`
- 앱 첫 진입 기준 하루 `1`회 후보 계산
- 후보 우선순위 `어제 -> 그제`
- 한 번에 `1`개 날짜만 제안
- 기존 `DayEditorSheet`를 대상 날짜로 여는 연결
- 저장 완료 후 `QuietToast`
- 닫기 또는 저장 없는 종료 시 `24시간` 숨김
- 저장 완료 날짜 재노출 방지

### Launch Or Marketing Notes

- 별도 런치 메시지는 없다.
- 카피는 `복구`, `실패`, `놓침`보다 `한 칸 남겨보기`, `채워졌어요`처럼 조용한 표현을 쓴다.

## UX Decisions

### Ambiguous Core Paths To Design

- 홈에서 어디를 주 진입점으로 쓸지
- `닫기`와 `저장 없이 종료`를 같은 규칙으로 볼지
- 셀 표시를 실제로 넣을지
- `QuietNudge`, CTA, 완료 토스트 문구를 어떻게 고정할지

### Key UX Decisions

- 메인 진입점은 캘린더 홈 dock 바로 위 `QuietNudge`로 고정한다.
- 별도 복구 페이지는 만들지 않는다.
- `QuietNudge`는 대상 날짜에 따라 본문만 바꾼다.
  - `어제를 한 칸 남겨볼까요?`
  - `그제를 한 칸 남겨볼까요?`
- CTA는 `열어보기`로 고정한다.
- 저장 완료 토스트는 대상 날짜 기준 동적 문구로 고정한다.
  - `어제가 채워졌어요.`
  - `그제가 채워졌어요.`
- 후보 계산은 앱 첫 진입 시 하루 `1`회만 한다.
- 후보 우선순위는 `어제 -> 그제`다.
- 한 번에 하나의 날짜만 제안한다.
- 사용자가 `닫기`를 누르면 `24시간` 동안 다시 제안하지 않는다.
- 시트를 열었다가 저장 없이 닫은 경우도 `닫기`와 같은 규칙으로 처리한다.
- 저장 완료한 날짜는 다시 제안하지 않는다.
- 셀 표시는 이번 스프린트에서 넣지 않는다.
- 데모 구현은 아래 `5`개 상태만 보면 된다.
  - `Calendar Home`에서 `어제`용 `QuietNudge`가 보이는 상태
  - `Calendar Home`에서 `그제`용 `QuietNudge`가 보이는 fallback 상태
  - 대상 날짜로 열린 `DayEditorSheet`
  - 저장 완료 후 `QuietToast`가 뜬 홈 상태
  - 닫기 또는 저장 없이 종료한 뒤 nudge가 숨겨진 홈 상태

### Asset Links

- 핵심 흐름 다이어그램: `docs/sprints/sprint3/assets/missed-day-recovery/diagrams/core-flow.md`
- 데모 구현 기준 화면: `Calendar Home`, `DayEditorSheet`, `QuietToast`, `Dismissed Home`

## Demo Review

### Prototype Location

- Demo route: `/design-system/examples/sprint3-missed-day-recovery`
- Demo source: `apps/web/app/design-system/examples/sprint3-missed-day-recovery`
- 현재 설계 자산: `docs/sprints/sprint3/assets/missed-day-recovery/diagrams/core-flow.md`

### Entry Points

- `Calendar Home` dock 바로 위 `QuietNudge`

### Flow Path

- `Calendar Home -> QuietNudge -> DayEditorSheet(target=어제|그제) -> Save -> QuietToast -> Calendar Home`
- `Calendar Home -> QuietNudge -> DayEditorSheet -> Close without save -> Calendar Home(hidden for 24h)`

### Included Screens (`3` to `5` max)

- `Calendar Home / 어제 제안`
- `Calendar Home / 그제 fallback 제안`
- `DayEditorSheet / 대상 날짜 열림`
- `Calendar Home / 저장 완료 + QuietToast`
- `Calendar Home / dismissed state`

### Design System Usage

- `Surface`, `AppBar`, `CalendarPreview`, `SegmentedControl`, `Button`, `Badge`, `Text`
- `QuietNudge`, `QuietToast`는 이번 데모 폴더 안에서 mock으로 표현
- Recovery 전용 색은 만들지 않는다.
- 시각 강조가 필요해도 기존 `--calendar-accent` 범위 안에서만 쓴다.

### Review Round (`1` or `2`)

- `1`

### Feedback And Changes

- Demo Build 완료.
- 대상 날짜 `어제/그제`와 단계 `홈/시트/완료/숨김`을 데모 안에서 바로 전환할 수 있게 구성했다.
- `저장 없이 닫기`와 `닫기`가 같은 숨김 상태로 합쳐지는 흐름을 화면 안에서 확인할 수 있게 했다.
- Preview 배포는 현재 워크트리에 `node_modules`가 없어 실패했다. 같은 이유로 lint/typecheck도 환경 단계에서 막혔다.

### Approved Direction

- `QuietNudge` 단일 진입
- `어제 -> 그제` 우선순위
- `닫기`와 `저장 없이 종료`는 같은 `24시간` 숨김 처리
- 저장 완료 후 동일 날짜 재노출 없음
- 셀 표시 없음

## Technical Freeze

### Surface Ownership

- 구현 surface는 `apps/web/app/design-system/examples/sprint3-missed-day-recovery` 한 곳으로 고정한다.
- 이번 스프린트의 1차 owner는 web demo surface다.
- 제품 홈, 실제 `DayEditorSheet`, 저장 persistence, API, mobile surface는 이번 구현 범위에 넣지 않는다.

### Shared Contracts

- 새 shared contract는 만들지 않는다.
- `packages/ui`의 기존 `AppBar`, `Badge`, `Button`, `CalendarPreview`, `SegmentedControl`, `Surface`, `Text`만 소비한다.
- `QuietNudge`, `QuietToast`, `DayEditorSheet` 미리보기는 데모 로컬 mock으로만 둔다.

### Dependency Order

- `Discovery -> UX Decisions -> Demo route 구현 -> 문서 정리 -> 검증 시도 -> merge 판단` 순서로 진행한다.
- 데모는 제품 코드보다 먼저 고정하고, 제품 연동은 후속 작업으로 분리한다.
- preview URL 확보나 실제 제품 연동 없이는 이번 산출물을 design-system demo 수준으로만 판단한다.

### Validation Plan

- 최소 검증 기준은 `pnpm --filter web lint`, `pnpm --filter web typecheck`다.
- demo route 추가라서 가능하면 `pnpm --filter web build`까지 넓힌다.
- preview 검증은 `pnpm preview:vercel` 성공 후 `/design-system/examples/sprint3-missed-day-recovery` 화면 확인으로 닫는다.
- 현재 워크트리에 `node_modules`가 없어 위 검증은 환경 준비 전에는 통과시킬 수 없다.

### Merge Guardrails

- `main`에 이 스프린트와 무관한 변경이 있으면 자동 반영하지 않는다.
- lint, typecheck, preview 중 하나라도 환경 문제로 막히면 미검증 상태를 그대로 남긴다.
- preview 없이 `24시간` 숨김과 저장 후 재노출 방지 동작을 최종 확인하지 못하면 blocker로 남긴다.

## Delivery Notes

### Implementation Status

- `apps/web/app/design-system/examples/sprint3-missed-day-recovery` 데모 route 추가
- 홈 `QuietNudge`, 기존 `DayEditorSheet` mock, 완료 토스트, 24시간 숨김 상태를 한 페이지에서 확인 가능
- 제품 로직, API, auth, persistence는 추가하지 않음

### Verification Summary

- `pnpm --filter web lint`
  - 실패. `@workspace/eslint-config`를 찾지 못했고 현재 워크트리에 `node_modules`가 없다.
- `pnpm --filter web typecheck`
  - 실패. `@workspace/typescript-config/nextjs.json`과 `next/react` 타입을 찾지 못했고 현재 워크트리에 `node_modules`가 없다.
- `pnpm install --offline`
  - 실패. pnpm store에 `@vitest/coverage-v8@3.2.4` tarball이 없어 오프라인 설치를 끝내지 못했다.
- `pnpm preview:vercel`
  - 실패. 로컬 의존성 설치가 안 된 상태라 preview 스크립트가 종료됐다.

### Reviewer Summary

- 문서와 데모 구현 범위를 기준으로 자체 리뷰했다.
- 현재 diff 안에서는 `P1`, `P2` 수준의 코드 결함은 찾지 못했다.
- 다만 실행 검증이 전혀 끝나지 않아 runtime regression 가능성은 남아 있다.

### Merge Result

- 자동 main 반영은 보류한다.
- blocker `1`: `/Users/kimyoukwon/Desktop/toda-calendar`의 `main` worktree에 이번 스프린트와 무관한 변경이 이미 있어 안전한 squash 반영 조건을 만족하지 못한다.
- blocker `2`: 현재 worktree에 `node_modules`가 없어 `lint`, `typecheck`, `preview`를 완료하지 못했다.
- blocker `3`: preview URL이 없어 `24시간` 숨김과 저장 후 재노출 방지 동작을 실제 화면에서 최종 확인하지 못했다.

## Durable Delta

### Durable Repo Truths Updated

- sprint3의 `missed-day-recovery`는 제품 코드가 아니라 design-system demo route로 먼저 정리됐다.
- 이번 데모는 `QuietNudge -> DayEditorSheet -> QuietToast` 흐름과 `24시간` 숨김 규칙을 문서와 예제로 고정했다.

### Follow-Up Work

- 의존성을 설치할 수 있는 환경에서 `pnpm --filter web lint`, `pnpm --filter web typecheck`, `pnpm --filter web build`를 다시 돌린다.
- preview 배포를 다시 시도해 실제 화면에서 `24시간` 숨김과 저장 후 재노출 방지를 확인한다.
- `main`의 unrelated change를 정리한 뒤에만 squash merge를 다시 시도한다.
