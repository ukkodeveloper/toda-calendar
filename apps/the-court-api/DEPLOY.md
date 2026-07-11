# the-court-api — Prod 배포 (Railway)

프론트 = Vercel, **백엔드 = Railway**(상태유지 단일 서비스, WS 지원), DB = Railway Postgres(같은 프로젝트, private networking).

배포 설정 파일은 이미 만들어 뒀다 — 리포 루트 **`railway.json`**. 네가 손으로 하는 건 로그인·리소스 생성·env 입력·배포뿐이다.

셸 표기: `!` 로 시작하는 줄은 **네가 손으로 실행**하는 인터랙티브 명령이다. 나머지는 이미 코드에 반영돼 있다.

---

## 0. 이미 만들어 둔 것 (`railway.json`)

빌드 순서를 강제한다 — contracts dist → prisma generate → api build, 그다음 배포 직전 마이그레이션:

- **build**: `pnpm run build:packages && prisma generate && api build`
  (루트 `turbo build` 로 프론트까지 빌드되는 걸 막고, **이 서비스만** 빌드한다.)
- **preDeployCommand**: `prisma migrate deploy` — 새 릴리스가 라이브되기 직전에 마이그레이션.
  `migrate dev` 아님(재차 강조 — partial index 보존). partial index 2개는 `migrations/*/migration.sql` 에 들어 있어 같이 적용된다.
- **startCommand**: `node dist/index.js` (`pnpm --filter the-court-api start`)
- **healthcheckPath**: `/health` — HTTP GET 이라 WS attach 를 건드리지 않는다.
- **numReplicas: 1** — **반드시 1대 고정.** socket.io 가 in-memory 어댑터라 2대+ 되면 WS fan-out 이 인스턴스 간에 안 퍼진다. 확장하려면 그때 `@socket.io/redis-adapter` 를 붙이고 나서 늘린다.

---

## 1. 인터랙티브 단계 — 네가 순서대로 실행

Railway CLI 가 없으면: `! npm i -g @railway/cli`

```
# 1) 로그인 (브라우저 열림)
! railway login

# 2) 리포 루트에서 새 프로젝트 생성 + 링크
#    (루트 = /Users/kimyoukwon/Desktop/labs-worktrees/the-court/01-rearrange)
! railway init

# 3) Postgres 추가 (같은 프로젝트 — private networking 자동)
! railway add --database postgres

# 4) DATABASE_URL 을 백엔드 서비스에 연결
#    Railway 대시보드 > api 서비스 > Variables 에서
#    New Variable > Reference > Postgres 의 DATABASE_URL 를 참조로 추가.
#    (private URL: postgres.railway.internal — 인터넷 안 거침, 지연·비용 낮음)

# 5) 나머지 env 입력 (2번 항목 참고 — CORS_ORIGINS 는 Vercel 도메인 확정 후)
! railway variables --set "PORT=8080" \
    --set "NODE_ENV=production" \
    --set "CORS_ORIGINS=https://<your-vercel-domain>" \
    --set "CORS_ORIGIN_PREVIEW_REGEX=^https://the-court-[a-z0-9-]+\.vercel\.app$"

# 6) 배포 (railway.json 의 build/start 로 빌드·기동)
! railway up

# 7) 공개 도메인 발급 (WS wss 종단 포함)
! railway domain
```

> `railway up` 이 실패하면 로그: `! railway logs`. 흔한 원인은 Node 버전 —
> Railway Variables 에 `NIXPACKS_NODE_VERSION=20` 을 넣어 20 으로 고정하면 안전하다
> (루트 `engines.node` 는 `>=20`).

---

## 2. 환경변수

### Railway (백엔드 서비스)

| 키                          | 값                                            | 비고                                                                |
| --------------------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`              | Postgres **private** URL 참조                 | 1단계 4)에서 Reference 로 연결 (`postgres.railway.internal`)        |
| `PORT`                      | `8080`                                        | Railway 가 주입하는 `$PORT` 와 맞춘다. `env.ts` 는 `PORT` 를 읽는다 |
| `NODE_ENV`                  | `production`                                  |                                                                     |
| `CORS_ORIGINS`              | `https://<vercel-prod-domain>`                | 콤마로 여러 개 가능. 커스텀 도메인도 여기                           |
| `CORS_ORIGIN_PREVIEW_REGEX` | `^https://the-court-[a-z0-9-]+\.vercel\.app$` | Vercel preview 배포 허용(선택). 프로젝트명 다르면 정규식 수정       |

> `PORT`: Railway 는 컨테이너에 `$PORT` 를 주입한다. `env.ts` 기본값이 8080 이라 `PORT=8080` 명시로 맞춘다.
> Railway 가 다른 포트를 강제하면 그 값으로 세팅하면 된다 — 서버는 `PORT` 를 그대로 바인드한다.

### Vercel (프론트) — 슬라이스 04 배선 시

| 키                    | 값                         | 비고                                                      |
| --------------------- | -------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `https://<railway-domain>` | REST 베이스 (https)                                       |
| `NEXT_PUBLIC_WS_URL`  | `wss://<railway-domain>`   | socket.io 접속 (**wss** — https 도메인이면 자동 TLS 종단) |

---

## 3. WS 특이사항 (Railway)

- **wss 종단**: `railway domain` 이 발급하는 `*.up.railway.app` 은 TLS 종단을 대신 해준다.
  프론트는 `wss://` 로 붙고, 서버 코드는 평문 http.Server 그대로 — 별도 인증서 설정 없음.
- **idle timeout**: socket.io 기본 하트비트(pingInterval 25s / pingTimeout 20s)가 25초마다 트래픽을
  흘려 연결을 살려 둔다. 현재 코드는 기본값이라 **추가 설정 불필요.** 엣지가 유휴 연결을 끊는 게
  관찰되면 `src/index.ts` 의 `new IOServer(...)` 에 `pingInterval: 20000` 로 낮추면 된다(선택).
- **헬스체크 안전**: `/health` 는 순수 HTTP GET(`{"status":"ok"}`). Socket.IO 는 같은 서버의
  `/socket.io/` 경로에 붙으므로 헬스체크가 WS attach 를 깨지 않는다.
- **단일 인스턴스**: `numReplicas: 1` 유지. 늘리기 전에 redis 어댑터 먼저(위 0번 참고).

---

## 4. 롤백

- **배포 롤백**: Railway 대시보드 > api 서비스 > Deployments > 직전 성공 배포 > **Redeploy/Rollback**.
  코드·이미지가 이전 버전으로 즉시 되돌아간다.
- **마이그레이션 주의**: `migrate deploy` 는 앞으로만 적용한다(다운 마이그레이션 없음).
  스키마를 되돌려야 하면 **되돌리는 새 마이그레이션 SQL 을 추가**해서 앞으로 적용한다
  (partial index 2개를 다시 손으로 넣는 규약 유지 — `prisma/README.md`).
- **설정 롤백**: `railway.json` 변경이 문제면 이 파일을 이전 커밋으로 되돌리고 `! railway up` 재실행.

---

## 5. 배포 후 스모크

```
! curl -s https://<railway-domain>/health      # {"status":"ok"}
```

DB 확인(원격)은 Railway 대시보드 > Postgres > **Data** 탭, 또는 로컬에서:

```
! railway connect postgres                       # 원격 DB 에 psql 접속
```
