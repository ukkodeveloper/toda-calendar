# the-court-api — 로컬 런북

Hono(REST) + Socket.IO(WS)를 **한 프로세스·한 포트**에 얹은 상태유지 서버. 로컬은 Docker Postgres에 붙는다.

명령은 전부 **모노레포 루트**에서 실행한다:
`/Users/kimyoukwon/Desktop/labs-worktrees/the-court/01-rearrange`

셸 표기: `!` 로 시작하는 줄은 **네가 손으로 실행**하는 명령이다.

---

## A. 처음부터 로컬 구동

### 0) 사전 — Postgres 컨테이너

**이미 떠 있으면 그대로 재사용한다** (`thecourt-pg`, 포트 5433). 확인:

```
! docker ps --filter name=thecourt-pg
```

`Up ...` 이 보이면 1)로 건너뛴다.

컨테이너가 없거나 지웠으면 **재생성**:

```
! docker run -d --name thecourt-pg \
    -e POSTGRES_PASSWORD=devpass \
    -e POSTGRES_DB=thecourt \
    -p 5433:5432 \
    postgres:16
```

멈춰만 있으면(`docker ps -a` 에 있고 `Exited`) 다시 켠다:

```
! docker start thecourt-pg
```

> 데이터는 컨테이너 볼륨에 있다. `docker rm` 하면 DB가 날아간다 — 그 경우 재생성 후 마이그레이션(3)을 다시 돌린다.

### 1) 환경변수 — `.env` 생성

`apps/the-court-api/.env` 를 만든다 (`.env` 는 gitignore — 커밋 안 된다). `.env.example` 을 복사해서 채운다:

```
HOST=0.0.0.0
PORT=8080
DATABASE_URL=postgresql://postgres:devpass@localhost:5433/thecourt
CORS_ORIGINS=http://localhost:3100
CORS_ORIGIN_PREVIEW_REGEX=
```

`env.ts` 가 실제로 읽는 키는 이 5개뿐이다:

| 키                          | 뜻                               | 로컬 값                                                 |
| --------------------------- | -------------------------------- | ------------------------------------------------------- |
| `HOST`                      | 바인드 주소                      | `0.0.0.0`                                               |
| `PORT`                      | REST+WS 공용 포트                | `8080`                                                  |
| `DATABASE_URL`              | Postgres 접속 (Prisma)           | `postgresql://postgres:devpass@localhost:5433/thecourt` |
| `CORS_ORIGINS`              | 허용 오리진(콤마 구분)           | `http://localhost:3100` (프론트 dev 포트)               |
| `CORS_ORIGIN_PREVIEW_REGEX` | preview 동적 오리진 정규식(선택) | 로컬은 빈값                                             |

한 줄 복사:

```
! cp apps/the-court-api/.env.example apps/the-court-api/.env
```

복사한 뒤 `DATABASE_URL` 을 위 값으로 채운다 (`.env.example` 은 비어 있다).

### 2) contracts dist 빌드 (런타임 의존)

서버는 `@workspace/contracts` 의 **dist** 를 런타임에 import 한다. 없으면 부팅이 깨진다. app-core → contracts 순서로 빌드하는 스크립트가 루트에 있다:

```
! pnpm run build:packages
```

### 3) Prisma — client 생성 + 마이그레이션 적용

```
! pnpm --filter the-court-api prisma:generate
! DATABASE_URL=postgresql://postgres:devpass@localhost:5433/thecourt \
    pnpm --filter the-court-api exec prisma migrate deploy \
    --schema prisma/schema.prisma
```

> **`prisma migrate dev` 는 절대 쓰지 않는다.** 수동 partial unique index 2개
> (`case_one_active_per_defendant`, `trial_one_active_per_case`)를 드리프트로 인식해 지운다.
> 이 프로젝트는 **`migrate deploy` 만** 쓴다. 상세: `prisma/README.md`.
> (컨테이너를 재사용 중이면 마이그레이션은 이미 적용돼 있다 — `migrate deploy` 는 멱등이라 다시 돌려도 안전.)

### 4) 서버 기동

```
! pnpm --filter the-court-api dev
```

`[the-court-api] http+ws listening on :8080` 이 뜨면 성공. (`.env` 를 자동 로드한다.)

### 5) 스모크 — 헬스체크

새 터미널에서:

```
! curl -s http://localhost:8080/health
```

기대 출력: `{"status":"ok"}`

---

## B. DB 를 직접 눈으로 보기

셋 중 편한 걸 쓴다. 접속 정보는 공통:

```
host=localhost  port=5433  db=thecourt  user=postgres  password=devpass
DATABASE_URL=postgresql://postgres:devpass@localhost:5433/thecourt
```

### B-1. Prisma Studio (GUI — 가장 쉬움)

브라우저로 열리는 테이블 뷰어. Prisma가 `.env` 의 `DATABASE_URL` 을 자동으로 읽는다:

```
! pnpm --filter the-court-api exec prisma studio
```

`.env` 없이 한 번만 띄우려면 앞에 주입:

```
! DATABASE_URL=postgresql://postgres:devpass@localhost:5433/thecourt \
    pnpm --filter the-court-api exec prisma studio
```

→ `http://localhost:5555` 가 열린다. 왼쪽에서 테이블(User·Room·Case·Trial·Vote…) 클릭.

### B-2. psql (터미널 — 쿼리)

컨테이너 안의 psql 을 쓰면 로컬 설치가 필요 없다:

```
! docker exec -it thecourt-pg psql -U postgres -d thecourt
```

자주 쓰는 조회:

```sql
-- 테이블 목록
\dt

-- 방과 참여코드
SELECT id, title, code, "createdAt" FROM "Room" ORDER BY id DESC;

-- 방의 사건(피고·상태)
SELECT c.id, c.title, c.status, u.nickname AS defendant
FROM "Case" c JOIN "User" u ON u.uuid = c."defendantUuid"
ORDER BY c.id DESC;

-- 사건의 재판 이력(최신순)
SELECT id, "caseId", status, verdict, "createdAt"
FROM "Trial" ORDER BY id DESC;

-- 재판별 투표 집계(유죄/무죄)
SELECT "trialId",
       count(*) FILTER (WHERE guilty) AS guilty,
       count(*) FILTER (WHERE NOT guilty) AS not_guilty
FROM "Vote" GROUP BY "trialId" ORDER BY "trialId";

-- partial unique index 2개 존재 확인
SELECT indexname FROM pg_indexes
WHERE indexname IN ('case_one_active_per_defendant','trial_one_active_per_case');
```

나가기: `\q`. (테이블명은 대문자라 큰따옴표 필수.)

### B-3. GUI 클라이언트 (TablePlus · DBeaver)

새 접속을 만들 때:

```
Host: localhost   Port: 5433
User: postgres    Password: devpass
Database: thecourt
```

또는 접속 문자열 한 줄:

```
postgresql://postgres:devpass@localhost:5433/thecourt
```

---

## C. 트러블슈팅

| 증상                                        | 원인                                   | 처방                                                            |
| ------------------------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| `EADDRINUSE :8080`                          | 포트 점유(이전 서버·다른 앱)           | `lsof -i :8080` 로 PID 확인 후 종료, 또는 `.env` 의 `PORT` 변경 |
| `Cannot find module '@workspace/contracts'` | contracts dist 없음                    | `pnpm run build:packages` (A-2) 다시                            |
| `@prisma/client did not initialize`         | prisma generate 안 함                  | `pnpm --filter the-court-api prisma:generate` (A-3)             |
| `Can't reach database server ... :5433`     | 컨테이너 안 떠 있음                    | `docker start thecourt-pg` (A-0)                                |
| CORS 에러(브라우저)                         | 프론트 오리진이 `CORS_ORIGINS` 에 없음 | 프론트 포트(3100)를 `.env` 에 추가                              |
| 마이그레이션이 partial index 를 지우려 함   | `migrate dev` 를 씀                    | **`migrate deploy` 만** 사용 (A-3 경고)                         |

> prod(Railway) 배포는 `DEPLOY.md` 참고.
