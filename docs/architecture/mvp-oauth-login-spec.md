# Toda Calendar MVP OAuth Login Spec

## 1. 문서 목적

이 문서는 Toda Calendar 웹 로그인 MVP를 위한 `OAuth 로그인 페이지 + 세션 처리 + API 인증`
스펙을 정의한다.

이번 스펙은 다음 전제를 동시에 만족해야 한다.

- `Supabase Auth`를 적극 사용한다.
- 하지만 앱이 Supabase에 영구적으로 종속되지 않도록 내부 경계를 둔다.
- 이번 단계의 소셜 로그인 provider는 `Kakao`, `Apple`, `Google`만 지원한다.
- 외부 콘솔 설정, client id/secret, redirect allow list 등록 같은 부분은 `TODO`로 남긴다.
- 그 외 프론트엔드/서버 구현은 지금 레포 구조 안에서 끝까지 진행 가능한 수준으로 설계한다.

## 2. 세 명의 senior가 합의한 결론

| 관점 | 핵심 주장 | 최종 반영 |
| --- | --- | --- |
| Senior Frontend | 로그인 UI는 서버 우선, 최소 JS, 작은 client island로 가야 한다. | `/login`은 Server Component shell로 만들고, 소셜 진입은 내부 `/auth/*` route로 보낸다. |
| Senior Frontend Toda | 현재 Toda의 calm / Apple-like 톤을 유지하면서도 모바일에서 하단 고정 액션이 자연스러워야 한다. | 로그인 버튼 영역은 하단 safe-area에 고정된 패널로 설계한다. |
| Senior Backend Toda | 제품 백엔드는 계속 우리 소유여야 하고, 외부 auth는 adapter 뒤로 숨겨야 한다. | `apps/api`는 유지하고, Supabase는 인증 브로커로만 사용한다. 내부 user id는 Supabase user id와 분리한다. |

## 3. 핵심 결정

### 결정 1. Supabase는 "인증 브로커"로만 사용한다

Supabase가 맡는 범위:

- OAuth provider 연결
- OAuth code exchange
- 웹 세션 쿠키 관리
- access token 발급

Toda가 계속 소유하는 범위:

- `/login` UI
- `/auth/sign-in/*`, `/auth/callback`, `/auth/sign-out` 라우트
- 앱 내부 세션 해석 로직
- `apps/api` 제품 API
- 사용자 프로필 / 캘린더 / 도메인 데이터

즉, `Auth는 Supabase`, `제품 데이터와 제품 백엔드는 Toda`가 원칙이다.

### 결정 2. 외부 auth subject와 내부 user id를 분리한다

락인 완화를 위해 내부 도메인 user id를 외부 auth user id와 동일하게 쓰지 않는다.

- 외부 식별자: Supabase JWT의 `sub`
- 내부 식별자: Toda가 발급하는 `user.id` UUID

둘 사이 연결은 `AuthIdentity` 매핑 레코드가 담당한다.

이 구조를 택하면 나중에 Supabase를 제거하더라도:

- 기존 `user.id`
- 기존 `calendar.ownerUserId`
- 기존 도메인 데이터

를 유지한 채 auth adapter만 교체할 수 있다.

### 결정 3. 로그인 진입은 내부 route를 통해 시작한다

로그인 버튼이 곧바로 Supabase SDK를 직접 호출하지 않는다.

대신:

- UI는 내부 경로 `/auth/sign-in/[provider]`로 이동
- route handler가 Supabase OAuth URL 생성
- handler가 provider로 redirect

이렇게 하면 UI가 auth vendor SDK에 덜 결합된다.

### 결정 4. 현재 `apps/api`를 계속 제품 API 서버로 유지한다

이 레포는 이미 `apps/api` Fastify 서버와 `packages/contracts`를 가지고 있다.

이번 auth 작업에서도:

- `apps/web`는 인증 UX와 callback을 담당
- `apps/api`는 Bearer token 검증과 user context 주입을 담당

으로 역할을 분리한다.

Next.js Route Handler는 웹 auth entry와 callback까지만 맡고, 제품 도메인 API를 대체하지 않는다.

## 4. 범위

### In Scope

- `Kakao`, `Apple`, `Google` 소셜 로그인
- 웹 전용 `/login` 페이지
- 하단 고정 소셜 로그인 버튼 영역
- Next.js callback route와 session cookie 저장
- 로그아웃 route
- `apps/api` Bearer token 검증
- 첫 로그인 시 내부 사용자 bootstrap
- 기존 웹 루트 페이지의 인증 게이트

### Out of Scope

- 이메일/비밀번호 로그인
- magic link / OTP
- 모바일 네이티브 Sign in with Apple / Google SDK
- MFA
- 관리자 권한 / role system
- provider account linking 고도화
- Supabase DB로 제품 데이터를 옮기는 작업

## 5. 제품 / UX 스펙

### 5.1 라우트

- `/login`
- `/auth/sign-in/[provider]`
- `/auth/callback`
- `/auth/error`
- `/auth/sign-out`

### 5.2 로그인 페이지 구조

`/login`은 모바일 우선의 단일 페이지로 설계한다.

레이아웃:

- 상단: 브랜드/서비스 설명
- 중단: 여백 중심의 calm background
- 하단: 소셜 로그인 패널

하단 패널 규칙:

- viewport bottom에 붙는다.
- iPhone safe-area를 고려한다.
- 버튼은 세로 스택으로 배치한다.
- 첫 버전은 `Kakao`, `Apple`, `Google` 순서로 노출한다.

이 순서를 택하는 이유:

- 현재 요청된 우선순위를 그대로 반영한다.
- 한국 사용자 기준에서 Kakao의 진입성을 우선 확보한다.
- Apple / Google은 뒤이어 동일 위계의 보조 진입점으로 둔다.

### 5.3 카피

MVP PRD 기준을 따라 첫 릴리스는 `English-only`로 유지한다.

예상 카피:

- Title: `Start your calm calendar`
- Body: `Sign in to keep your month, memories, and editing state together.`
- Footer note: `By continuing, you agree to the Toda Calendar terms and privacy policy.`

### 5.4 상태

필수 상태:

- 기본 상태
- provider 진입 중 상태
- callback 실패 상태
- 이미 로그인된 사용자의 `/login` 재진입 상태

UX 규칙:

- 이미 세션이 있으면 `/login`에서 `/`로 즉시 redirect
- callback 오류가 있으면 `/auth/error` 또는 `/login?error=...`로 복귀
- 오류 문구는 버튼 아래 `aria-live="polite"` 영역에 노출

### 5.5 접근성

- `<main>`, `<header>`, `<section>` 등 semantic HTML 사용
- 페이지의 유일한 `<h1>` 유지
- 소셜 로그인 버튼은 실제 `<a>` 또는 `<button>` semantics 유지
- focus ring은 현재 UI token을 사용해 명확하게 표시
- 키보드만으로 provider 선택 가능
- 로딩/오류 상태는 screen reader에 전달

## 6. 프론트엔드 구조

### 6.1 선택한 구조

`apps/web` 안에서 최소 범위로 확장한다.

```text
apps/web/
  app/
    login/
      page.tsx
    auth/
      sign-in/
        [provider]/
          route.ts
      callback/
        route.ts
      sign-out/
        route.ts
      error/
        page.tsx
  components/
    auth/
      social-login-button.tsx
      social-login-panel.tsx
  lib/
    auth/
      app-session.ts
      providers.ts
      require-session.ts
      session.ts
    supabase/
      browser.ts
      server.ts
  app/page.tsx
```

### 6.2 파일 책임

- `app/login/page.tsx`
  - Server Component
  - 세션 존재 여부 확인
  - 비로그인 상태면 로그인 화면 렌더링
- `app/auth/sign-in/[provider]/route.ts`
  - provider 유효성 검사
  - `next` 경로 sanitize
  - Supabase OAuth URL 생성
  - provider consent 화면으로 redirect
- `app/auth/callback/route.ts`
  - `code` 교환
  - 세션 쿠키 저장
  - `next` 또는 `/`로 redirect
- `app/auth/sign-out/route.ts`
  - 세션 종료
  - `/login` redirect
- `app/auth/error/page.tsx`
  - 사용자 친화 오류 화면
- `components/auth/*`
  - 앱 전용 로그인 UI
- `lib/auth/providers.ts`
  - Toda provider enum과 Supabase provider 매핑
- `lib/auth/session.ts`
  - 현재 앱 세션 해석
- `lib/auth/require-session.ts`
  - 보호된 route에서 공통 사용
- `lib/supabase/*`
  - Supabase client 생성 책임만 담당

### 6.3 프론트엔드 원칙

- 로그인 페이지 shell은 Server Component로 둔다.
- 버튼 렌더링 자체는 client component가 아니어도 되게 설계한다.
- 가능한 경우 plain navigation + route handler 조합으로 유지한다.
- `use client`는 provider별 pending UI나 세밀한 feedback이 필요할 때만 도입한다.
- auth vendor SDK 타입은 `components/`에서 직접 import하지 않는다.
- auth 관련 route handler 응답은 `Cache-Control: private, no-store`를 기본으로 둔다.
- 보호된 페이지에는 ISR이나 공유 캐시 전략을 붙이지 않는다.

### 6.4 웹 세션 모델

웹 내부에서는 Supabase session 객체를 직접 앱 전역 계약으로 삼지 않는다.

대신 다음 개념을 사용한다.

```ts
type AppAuthProvider = "kakao" | "apple" | "google"

type AuthIdentity = {
  source: "supabase"
  subject: string
  email: string | null
}

type AppSession = {
  isAuthenticated: boolean
  identity: AuthIdentity | null
}
```

Supabase session 전체 객체는 `lib/supabase/*`와 `lib/auth/session.ts` 안으로 가둔다.

### 6.5 루트 페이지 게이트

현재 `app/page.tsx`는 캘린더 앱 entry다.

이번 auth 작업 후 동작:

- 세션 없음: `/login`으로 redirect
- 세션 있음: 기존 `CalendarApp` 진입 유지

즉, 대규모 route group 재구성 없이 최소 수정으로 auth gate를 붙인다.

## 7. 백엔드 구조

### 7.1 선택한 구조

현재 `apps/api` 구조를 유지하면서 auth 계층만 추가한다.

```text
apps/api/src/
  application/
    ports/
      access-token-verifier.ts
    services/
      auth-context-service.ts
  domain/
    authenticated-user.ts
    auth-errors.ts
  infrastructure/
    auth/
      supabase-jwks-verifier.ts
    persistence/
      file-store.ts
      file-calendar-repository.ts
  http/
    auth/
      get-bearer-token.ts
      require-auth.ts
    routes.ts
```

### 7.2 API 인증 방식

제품 API는 기존처럼 `apps/api`에서 제공한다.

인증 규칙:

- `/health`만 공개
- 나머지 `/v1/*`는 인증 필요
- 웹 클라이언트는 `Authorization: Bearer <access_token>` 전송
- API 서버는 Supabase JWT를 검증
- 성공 시 request context에 내부 사용자 정보 주입

### 7.3 JWT 검증 방식

기본 방침:

- Supabase 프로젝트는 비대칭 JWT signing key 사용을 권장
- API는 Supabase JWKS endpoint를 사용해 JWT 서명을 검증
- Node runtime을 기본으로 유지한다.

검증 포인트:

- signature
- `iss`
- `exp`
- `sub`

필요 시 추가 검증:

- `aud`
- `role`

MVP에서는 `jose` 기반 verifier adapter가 가장 현실적이다.

예외:

- Supabase 프로젝트가 아직 HS256 대칭 키만 쓰고 있다면, 임시로 Auth server 검증 fallback을 둘 수 있다.
- 이 경우 성능과 교체성을 해치므로 비대칭 키 전환을 빠른 TODO로 남긴다.

### 7.4 내부 사용자 bootstrap

첫 로그인 직후 앱 내부 user가 아직 없을 수 있다.

MVP에서는 다음 정책을 채택한다.

- 인증된 첫 요청에서 내부 user를 idempotent하게 bootstrap
- bootstrap 결과로 기본 캘린더도 함께 준비
- 이후 `GET /v1/me`는 항상 내부 user 기준 응답을 반환

주의:

- 이 bootstrap은 구현상 side effect를 가질 수 있다.
- MVP 단순성을 위한 예외이며, 이후 DB 기반 구조로 옮길 때는 별도 onboarding step으로 분리할 수 있다.

### 7.5 내부 도메인 모델

도메인 데이터는 Supabase auth user id에 직접 매달지 않는다.

권장 모델:

```text
User
- id
- displayName
- locale
- timezone
- createdAt
- updatedAt

AuthIdentity
- id
- source              # "SUPABASE"
- externalSubject     # Supabase JWT sub
- email
- userId              # Toda internal user id
- createdAt
- updatedAt
```

캘린더, day record 등 모든 제품 데이터는 `userId` 기준으로 연결한다.

### 7.6 에러 규칙

기존 에러 포맷을 유지한다.

추가 코드 예시:

- `AUTH_REQUIRED`
- `INVALID_ACCESS_TOKEN`
- `AUTH_PROVIDER_NOT_SUPPORTED`
- `SESSION_EXCHANGE_FAILED`

응답 예시:

```ts
{
  error: {
    code: "AUTH_REQUIRED",
    message: "Authentication is required"
  }
}
```

## 8. 계약과 vendor lock-in 완화 규칙

### 8.1 `packages/contracts` 원칙

공유 계약은 앱 중심으로 유지한다.

허용:

- `MeResponse`
- 앱 고유의 에러 코드
- 앱 고유 DTO

지양:

- Supabase session 객체 노출
- Supabase user metadata shape 노출
- provider별 원시 응답 shape 노출

### 8.2 provider 매핑 규칙

UI와 앱 내부는 다음 enum만 안다.

```ts
type AppAuthProvider = "kakao" | "apple" | "google"
```

이 enum을 Supabase provider 문자열로 바꾸는 일은 오직 한 파일에서만 한다.

예:

```ts
const providerMap = {
  kakao: "kakao",
  apple: "apple",
  google: "google",
} as const
```

지금은 매핑이 1:1이지만, 나중에 auth vendor를 바꾸더라도 이 계층만 바꾸면 된다.

### 8.3 Supabase 제거 가능성에 대한 기준

이 스펙이 지키려는 교체 가능성의 기준은 다음과 같다.

- 로그인 버튼 UI는 Supabase SDK 호출을 직접 몰라도 된다.
- 웹 route 계약 `/auth/sign-in/*`, `/auth/callback`, `/auth/sign-out`은 유지된다.
- `apps/api`는 `AccessTokenVerifier` port만 믿는다.
- 제품 데이터의 owner key는 내부 `userId`다.

즉, 미래에 Supabase를 걷어내더라도 교체 범위는 주로 아래에 제한된다.

- `apps/web/lib/supabase/*`
- `apps/web/app/auth/*`
- `apps/api/src/infrastructure/auth/*`
- `AuthIdentity.source = "SUPABASE"` 관련 migration

## 9. 구현 순서

### Slice 1. 공유 경계와 타입

- `packages/contracts`에 auth 에러 코드 반영
- `apps/web/lib/auth/providers.ts` 추가
- `apps/api`의 auth port / domain type 추가

### Slice 2. 웹 auth infra

- `apps/web/lib/supabase/server.ts`
- `apps/web/lib/supabase/browser.ts`
- `apps/web/lib/auth/session.ts`

### Slice 3. 웹 라우트

- `/login`
- `/auth/sign-in/[provider]`
- `/auth/callback`
- `/auth/sign-out`
- `/auth/error`

### Slice 4. UI

- 하단 고정 로그인 패널
- provider 버튼 3종
- 오류 표시 / 접근성 처리

### Slice 5. API 인증

- Bearer token 파싱
- JWT 검증
- request user context 주입
- `GET /v1/me` bootstrap 흐름 연결

### Slice 6. 기존 캘린더 보호

- `app/page.tsx` auth gate
- `apps/web/lib/api/client.ts`에 access token 주입

## 10. TODO 목록

### 10.1 공통 환경 변수 TODO

웹:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

API:

- `SUPABASE_PROJECT_URL`
- `SUPABASE_JWT_ISSUER`
- `SUPABASE_JWKS_URL`

주의:

- 실제 변수명은 구현 시 한 번 더 정리해도 된다.
- 중요한 것은 web과 api가 각각 필요한 최소 값만 가지는 것이다.

### 10.2 Supabase Dashboard TODO

- Supabase 프로젝트 생성 또는 기존 프로젝트 선택
- Auth provider에서 `Kakao`, `Apple`, `Google` 활성화
- 웹 redirect allow list에 `/auth/callback` 등록
- 가능하면 비대칭 JWT signing key 사용

### 10.3 Kakao TODO

- Kakao Developers app 생성
- REST API key / client secret 발급
- redirect URI 등록
- `account_email` scope 사용 가능 여부 확인
- 필요 시 `Allow users without an email` 정책 검토

### 10.4 Google TODO

- Google Cloud OAuth client 생성
- redirect URI 등록
- client id / secret 발급

### 10.5 Apple TODO

- Apple Services ID 생성
- Sign in with Apple web 설정
- client secret 생성
- secret rotation 운영 캘린더 등록

## 11. 검증 계획

코드 구현 후 최소 검증:

- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter api lint`
- `pnpm --filter api typecheck`
- `pnpm --filter api test`

수동 확인:

- 비로그인 사용자가 `/` 접근 시 `/login`으로 이동하는지
- 각 provider 버튼이 올바른 auth entry로 진입하는지
- callback 성공 후 `/`로 돌아오는지
- `Authorization` 헤더가 API에 붙는지
- 첫 로그인 시 내부 user / default calendar가 bootstrap 되는지

## 12. 이번 스펙의 최종 원칙

이 작업은 `Supabase를 많이 쓴다`와 `언제든 걷어낼 수 있어야 한다`를 동시에 만족해야 한다.

그래서 이번 MVP의 기준은 다음 한 줄로 정리한다.

`Supabase는 인증을 빠르게 붙이기 위한 외부 브로커이고, 사용자 경험과 제품 데이터와 제품 API는 계속 Toda가 소유한다.`

## 13. 참고 자료

- Supabase Auth overview: https://supabase.com/docs/guides/auth
- Supabase SSR: https://supabase.com/docs/guides/auth/server-side
- Supabase SSR advanced guide: https://supabase.com/docs/guides/auth/server-side/advanced-guide
- Supabase social login - Kakao: https://supabase.com/docs/guides/auth/social-login/auth-kakao
- Supabase social login - Apple: https://supabase.com/docs/guides/auth/social-login/auth-apple
- Supabase social login - Google: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase JWT verification / JWKS: https://supabase.com/docs/guides/auth/jwts
