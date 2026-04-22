# Toda MVP Integration Runbook

이 문서는 `apps/api`, `apps/web`, `apps/mobile`이 한 흐름으로 연결된 현재 기준의 실행/배포 확인 절차를 정리한다.

## 1. 현재 연결 구조

- `apps/api`
  - Fastify + JSON file store
  - 기본 저장 위치: `apps/api/.data/store.json`
- `apps/web`
  - Next.js support surface
  - 브라우저에서 `apps/api`를 직접 호출
- `apps/mobile`
  - Expo shell
  - `react-native-webview`로 `apps/web`를 감싼다

즉, 흐름은 아래와 같다.

`RN shell -> WebView -> web app -> API -> JSON store`

## 2. 로컬 확인

### 2.1 설치

루트에서:

```bash
pnpm install
pnpm build:packages
```

### 2.2 API 실행

터미널 1:

```bash
pnpm --filter api dev
```

기본 주소:

- `http://127.0.0.1:3030`
- 같은 LAN 기기에서는 `http://<your-local-ip>:3030`

기본 health check:

```bash
curl http://127.0.0.1:3030/health
```

### 2.3 Web 실행

터미널 2:

```bash
pnpm --filter web dev
```

기본 주소:

- 브라우저: `http://127.0.0.1:3000`
- Expo/실기기 확인용: `http://<your-local-ip>:3000`

로컬에서는 `NEXT_PUBLIC_API_BASE_URL`을 비워둬도 된다.

- `localhost`로 접속하면 web이 자동으로 `127.0.0.1:3030`을 본다
- LAN IP로 접속하면 web이 자동으로 같은 host의 `:3030`을 본다

### 2.4 Web 동작 확인 포인트

- 웹 첫 진입 시 로딩 후 캘린더가 열리는지
- 날짜를 열고 텍스트를 저장하면 새로고침 뒤에도 유지되는지
- 사진을 추가하거나 낙서를 저장한 뒤 다시 열었을 때 유지되는지
- API 저장 파일 `apps/api/.data/store.json`에 내용이 반영되는지

### 2.5 Expo 실행

터미널 3:

```bash
pnpm --filter mobile start
```

현재 모바일 앱은 루트 화면에서 WebView shell을 띄운다.

로컬 확인 방식:

1. Expo를 같은 머신에서 실행한다
2. Next.js dev server도 같은 머신에서 실행한다
3. 실기기라면 같은 Wi-Fi를 사용한다
4. 앱을 열면 Expo host IP를 기준으로 `http://<same-host>:3000`을 자동 추정해 WebView를 연다

자동 추정이 맞지 않으면 `apps/mobile/.env.local`에 아래를 넣는다.

```bash
EXPO_PUBLIC_WEB_APP_URL=http://<your-local-ip>:3000
```

## 3. Dev 배포

권장 분리:

- web: Vercel
- api: Render/Railway 같은 Node runtime host

### 3.1 API dev 배포

필수 조건:

- `pnpm install`
- `pnpm build:packages`
- `pnpm --filter api build`
- `pnpm --filter api start`

예시 설정:

- Build Command:
  - `pnpm install && pnpm build:packages && pnpm --filter api build`
- Start Command:
  - `pnpm --filter api start`
- Env:
  - `HOST=0.0.0.0`
  - `TODA_API_DATA_FILE=.data/store.json`

주의:

- JSON file store라서 디스크가 없는 호스팅에서는 데이터가 초기화될 수 있다
- dev 확인용이면 괜찮지만, 유지가 필요하면 persistent disk를 붙인다

### 3.2 Web dev 배포

필수 env:

```bash
NEXT_PUBLIC_API_BASE_URL=https://<your-api-dev-domain>
```

현재 웹은 정적 export로 배포 가능하다.

배포 전 확인:

```bash
pnpm build:packages
pnpm --filter web build
```

### 3.3 Expo에서 dev 배포 확인

`apps/mobile/.env.local` 또는 EAS env에 아래를 넣는다.

```bash
EXPO_PUBLIC_WEB_APP_URL=https://<your-web-dev-domain>
```

그 다음:

```bash
pnpm --filter mobile start
```

Expo에서 앱을 열면 RN shell이 배포된 web을 바로 감싼다.

## 4. 검증 명령

이번 연결 기준으로 최소 검증 명령은 아래다.

```bash
pnpm build:packages
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter mobile typecheck
pnpm lint
pnpm --filter web build
pnpm --filter api build
pnpm --filter mobile build
```

메모:

- `pnpm --filter mobile build`는 현재 산출물은 정상 생성하지만, Expo export 프로세스가 환경에 따라 종료를 늦게 반환할 수 있다
- 이 경우 `apps/mobile/dist`가 생성됐는지만 추가로 확인하면 된다
