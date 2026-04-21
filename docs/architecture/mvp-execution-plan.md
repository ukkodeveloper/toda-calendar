# Toda Calendar MVP Execution Plan

## 1. 문서 목적

이 문서는 Toda Calendar MVP를 실제 구현 단계로 옮길 때, 총괄 시니어 개발자가 내린 실행 결정을 고정하는 문서다.

이번 구현은 아래 문서를 직접 따른다.

- [mvp-discovery.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/product/mvp-discovery.md)
- [phase-strategy.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/product/phase-strategy.md)
- [mvp-backend-architecture.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/architecture/mvp-backend-architecture.md)
- [mvp-frontend-architecture.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/architecture/mvp-frontend-architecture.md)
- [mvp-mobile-architecture.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/architecture/mvp-mobile-architecture.md)

## 2. 총괄 시니어 개발자 결정

이번 구현은 아래 원칙으로 진행한다.

- 질문 없이 진행한다
- 모든 비결정 상태는 총괄 시니어 개발자가 즉시 결정한다
- MVP 범위 밖 확장은 넣지 않는다
- UI와 애니메이션은 현재 동작을 깨지 않는 방향으로 유지한다
- 데이터 저장은 DB가 아니라 내부 JSON 저장소로 처리한다
- 로그인은 구현하지 않는다
- 혼자 사용하는 단일 사용자 앱으로 구현한다
- RN 앱을 primary client로, web을 secondary surface로 둔다
- 코드 퀄리티, 안정성, 최적화 기준을 낮추지 않는다

## 3. 이번 MVP에서 실제로 구현할 범위

### 포함

- `apps/api`
  - Fastify 기반 JSON 저장소 API
- `apps/mobile`
  - Expo Router 기반 MVP 앱
- `apps/web`
  - 보조 표면과 개발/검증용 viewer
- `packages/contracts`
  - request/response schema
- `packages/app-core`
  - 순수 TS 기반 shared logic

### 제외

- 로그인
- 실제 DB 연결
- 외부 스토리지 연동
- push 알림
- weekly rewind
- social
- multi-calendar UI
- production-grade auth

## 4. 데이터와 백엔드 결정

### 데이터 저장 방식

- 저장소는 `apps/api/data/*.json` 파일 기반으로 둔다
- API 서버만 JSON 파일에 접근한다
- FE/RN은 API만 호출한다

### 사용자 모델

- 단일 사용자 `local-user`를 고정으로 사용한다
- 로그인/세션 없이 API가 이 사용자를 전제로 동작한다

### 미디어 처리

- MVP에서는 실제 파일 업로드 인프라를 붙이지 않는다
- 우선은 아래 두 단계 중 더 단순한 방식으로 구현한다
  - web: data URL 또는 public fixture 경로
  - mobile: local uri를 선택하고 JSON에는 preview 메타데이터만 저장

총괄 결정:

- 이번 턴에서는 `실사용 가능한 구조`가 중요하므로, 사진은 우선 메타데이터 중심으로 저장하고 asset pipeline은 나중에 확장한다

## 5. 클라이언트 결정

### mobile

- `apps/mobile`가 primary client다
- Expo Router + native stack + formSheet를 사용한다
- day record는 route 기반 sheet로 구현한다

### web

- `apps/web`는 secondary surface다
- 현재 UI work와 충돌하지 않도록 로직/구조 위주로 붙인다
- viewer/debug/preview 역할을 우선 지원한다

## 6. 공유 경계

### `packages/contracts`

- API DTO
- Zod schema
- enum

### `packages/app-core`

- query key
- local date helper
- calendar grid helper
- adapter / mapper
- slot constants

### 공유하지 않는 것

- web UI component
- RN UI component
- native dependency wrapper
- backend infra

## 7. 작업 소유권

### 총괄 시니어 개발자

책임:

- 모든 의사결정
- 전체 구조 통합
- 문서와 구현 정합성 유지
- 최종 리뷰와 수정

### Backend

소유 파일 범위:

- `apps/api/**`
- `packages/contracts/**`
- `packages/app-core/**` 중 API/도메인 공용 부분

책임:

- JSON 저장소
- Fastify server
- routes / schema / repository
- mock single-user policy

### Mobile

소유 파일 범위:

- `apps/mobile/**`
- `packages/app-core/**` 중 mobile에서 필요한 순수 로직 추가

책임:

- Expo app scaffold
- month route
- day record sheet route
- API 연동

### Web

소유 파일 범위:

- `apps/web/**`
- `packages/app-core/**` 중 web에서 필요한 순수 로직 추가

책임:

- secondary viewer 구조
- API 연동
- UI를 크게 해치지 않는 로직 연결

## 8. 구현 순서

1. 총괄 시니어 결정 문서 고정
2. 공용 패키지와 API 구조 생성
3. mobile / web / backend 병렬 구현
4. 통합 실행
5. 영역별 리뷰
6. 수정 반영
7. 커밋과 검증

## 9. 품질 기준

- 타입 안전성 유지
- 파일 경계 명확성 유지
- 책임 분리 유지
- 불필요한 전역 상태 금지
- API / UI / domain 경계 혼합 금지
- 최소한의 lint / typecheck / build 검증 수행

## 10. 커밋 원칙

- 큰 단계가 끝날 때마다 커밋한다
- 최소 권장 단위
  - 실행 계획/문서 고정
  - backend scaffold
  - mobile scaffold
  - web integration
  - review fixes

## 11. 최종 목표

이번 턴의 목표는 `UI만 있는 상태`를 `실제로 동작하는 MVP 구조`로 바꾸는 것이다.

즉:

- FE, RN, BE가 각각 독립 구조를 가지되
- 공용 contract와 core 로직을 공유하고
- JSON 저장소를 통해 end-to-end로 연결되고
- 이후 DB/auth/notification을 붙일 수 있는 형태까지 만드는 것이 목적이다.

## 12. 구현 중 확정된 추가 결정

이번 구현 과정에서 총괄 시니어 개발자가 아래 결정을 추가로 고정했다.

- `apps/api/data/store.json`의 기본 상태는 `empty state`로 둔다
- backend의 월 뷰 조회는 `해당 YYYY-MM`만이 아니라 `실제로 보이는 6주 grid 전체 범위`를 기준으로 한다
- `packages/contracts`, `packages/app-core`는 build 산출물을 `dist/`에 고정하고, app들은 workspace package를 import한다
- monorepo의 루트 `dev` 계열 스크립트가 shared package build를 먼저 수행한다
- `apps/web`는 `output: export`를 제거하고 API 기반 dynamic support surface로 유지한다
- mobile은 doodle UI가 단순 preview여도 실제 stroke payload를 round-trip 가능하게 보존한다
