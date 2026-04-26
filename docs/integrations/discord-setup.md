# Discord Setup

이 문서는 `toda-codex` Discord bot과 집 데스크탑 bridge를 안정적으로 붙이는 설치/운영 가이드다.

## 1. 권장 서버 구조

- private Discord 서버 1개
- text channel 1개: `#toda-sprints`
- 스프린트 1개당 thread 1개

v1에서는 forum channel보다 일반 text channel + thread 조합이 더 단순하고 안정적이다.

## 2. Discord 앱 권한

필수 scope:

- `bot`
- `applications.commands`

권장 bot permission:

- `채널 보기`
- `메시지 보내기`
- `스레드에서 메시지 보내기`
- `공개 스레드 만들기`
- `메시지 기록 보기`
- `링크 포함`
- `파일 첨부`

추가로 `MESSAGE CONTENT INTENT`를 켜야 thread 안 자연어 메시지를 읽을 수 있다.

## 3. 로컬 env

예시 파일 복사:

```bash
cp apps/discord-bridge/.env.example apps/discord-bridge/.env
```

필수값:

- `DISCORD_BOT_TOKEN`
- `DISCORD_APPLICATION_ID`
- `DISCORD_GUILD_ID`
- `DISCORD_SPRINT_CHANNEL_ID`

선택값:

- `DISCORD_DEFAULT_SPRINT_ID`
- `DISCORD_BRIDGE_STATE_FILE`
- `DISCORD_WORKTREE_ROOT`
- `DISCORD_CODEX_MODEL`
- `DISCORD_CODEX_TIMEOUT_MS`
- `DISCORD_CODEX_STAGE_TIMEOUT_MS`
- `DISCORD_DESIGN_SYSTEM_TIMEOUT_MS`
- `VERCEL_AUTOMATION_BYPASS_SECRET`

`DISCORD_WORKTREE_ROOT`를 비워두면 기본값은 `~/.codex/worktrees/discord`다.
`DISCORD_CODEX_MODEL`을 비워두면 기본값은 `gpt-5.4`다.
긴 자동 작업의 기본 제한 시간은 90분이다.
Vercel Deployment Protection이 켜진 preview를 자동 확인하려면 Vercel의 Protection Bypass for Automation secret을
`VERCEL_AUTOMATION_BYPASS_SECRET`에 넣는다. bridge는 이 값을 Discord 메시지나 URL에 노출하지 않고 HTTP header 검증에만 쓴다.

## 4. 설치와 점검

repo root에서:

```bash
pnpm install
pnpm discord:doctor
pnpm discord:register
```

## 5. 장기 실행

권장 방식은 전역 명령을 쓰는 것이다.

```bash
toda-discord start
toda-discord status
toda-discord health
toda-discord logs
```

설명:

- `toda-discord start`
  - shell supervisor를 백그라운드로 띄운다.
- `toda-discord status`
  - supervisor 상태와 bridge health 요약을 보여준다.
- `toda-discord health`
  - bridge heartbeat가 건강한지 확인한다.
- `toda-discord logs`
  - stdout / stderr 로그를 tail 한다.
- `toda-discord restart`
  - worker 재기동
- `toda-discord stop`
  - worker 종료

## 6. Discord에서 실제 사용

시작:

```text
/sprint feature:oauth sprint:sprint1
```

상태 확인:

```text
/status
```

그 이후에는 thread 안에서 그냥 자연어로 이야기하면 된다.

- 정책 정리
- 자료 조사
- UX 피드백
- 기술 자문
- 구현 방향 토론

지금은 이 자연어 메시지를 local bridge가 받아서 `codex exec`로 실제 Codex 답변을 만든다.
즉 Discovery와 Demo에서는 고정 문구가 아니라, 최근 스레드 문맥을 포함한 실제 대화 응답이 나온다.

단계 전환은 버튼으로만 한다.

- Discovery
  - `이 방향으로 진행`
  - `조정 필요`
- Demo
  - `데모 승인`
  - `수정 필요`

## 7. worktree / branch 컨벤션

- worktree: `sprint1-oauth`
- branch: `codex/sprint1-oauth`

이 규칙으로 병렬 스프린트를 운영한다.

## 8. health 운영 체크리스트

작업 전에:

```bash
toda-discord status
toda-discord health
```

정상 기준:

- `status=running`
- `bridge=healthy`

이상 시:

1. `toda-discord restart`
2. `toda-discord health`
3. `toda-discord logs`

## 9. Discord에서 "애플리케이션이 응답하지 않았어요"가 뜰 때

가장 먼저 볼 것:

```bash
toda-discord status
toda-discord health
```

대부분 원인:

- background worker가 꺼져 있음
- bridge heartbeat가 없음
- 로컬 코드 에러로 bridge가 부팅 직후 종료됨

이때는 보통:

```bash
toda-discord restart
toda-discord logs
```

순서로 확인하면 된다.
