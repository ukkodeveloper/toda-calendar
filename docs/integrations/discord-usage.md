# Discord 원격 스프린트 사용법

이 문서는 실제로 Discord에서 어떻게 스프린트를 돌리는지에 집중한 운영 문서다.

대화 톤과 버튼/메시지 규칙은 [docs/integrations/discord-message-spec.md](/Users/kimyoukwon/Desktop/toda-calendar/docs/integrations/discord-message-spec.md)를 따른다.

## 기본 개념

- Discord 앱 하나가 전체 스프린트의 관제탑 역할을 한다.
- `#toda-sprints` 채널에서 스프린트를 시작한다.
- 스프린트 하나당 thread 하나가 생긴다.
- thread 하나마다 worktree 하나와 branch 하나가 붙는다.
- thread 하나마다 Codex 대화 세션도 하나 붙는다.

즉:

- thread = 대화방
- codex session = 같은 맥락으로 이어지는 대화 엔진
- worktree = 작업 폴더
- branch = 반영 단위

## 최소 명령어

사용자가 기억할 명령어는 두 개뿐이다.

```text
/sprint
/status
```

그 외에는 그냥 자연어로 말하면 된다.

이 자연어 메시지는 bridge가 실제 `codex exec`로 넘겨서 답을 만든다.
첫 메시지에서 Codex 세션을 만들고, 그다음부터는 같은 세션을 `resume`해서 이어간다.
그래서 Discovery나 Demo 단계에서는 질문마다 다른 답을 주는 것이 정상이다.

## 시작 방법

채널에서:

```text
/sprint feature:oauth sprint:sprint1
```

그러면 bot이:

1. `sprint1-oauth` thread를 만든다.
2. 해당 스프린트를 state store에 등록한다.
3. worktree / branch 메타데이터를 같이 기록한다.
4. Discovery 게이트 메시지를 띄운다.

이미 같은 스프린트가 열려 있으면 바로 막지 않고 선택지를 보여준다.

- `이어서 하기`
- `새로 시작하기`

`새로 시작하기`를 누르면:
- 새 스레드를 만든다.
- 새 worktree와 branch를 만든다.
- 이전 스레드는 `일시 정지` 상태로 남겨둔다.

예시:
- 기존: `sprint1-oauth`
- 새 실행: `sprint1-oauth-2`

스프린트를 아예 접고 싶으면 스레드 안의 `파기 후 종료` 버튼을 누르면 된다.
한 번 더 확인한 뒤:
- worktree를 정리하고
- 스프린트를 종료 상태로 바꾸고
- 스레드를 닫아둔다.

## thread 안에서는 어떻게 말하면 되나

그냥 평소처럼 말하면 된다.

예시:

- `이 기능의 목표는 온보딩 이탈 감소야`
- `애플 로그인은 iOS 우선으로 가자`
- `Supabase Auth랑 직접 구현 비교해줘`
- `UX 관점에서 이 흐름 너무 길지 않아?`
- `백엔드에서 제일 단순한 설계 추천해줘`

bot은 단계에 따라 다르게 반응한다.

- Discovery, Demo에서는 의견과 추천안을 같이 준다.
- Design Pack, Technical Freeze, Implementation, Merge에서는 불필요한 답장 대신 진행 상황과 다음 알림 시점만 짧게 알려준다.

즉, 같은 스레드 안에서는 Discord 로그만 다시 읽어 붙이는 게 아니라 실제 Codex 세션 맥락도 계속 이어진다.
앱이 재시작돼도 state store에 저장된 session id를 보고 다시 이어붙인다.

특히 Discovery에서는 아래 같은 질문도 자연스럽게 받아야 한다.

- `다른 캘린더 앱은 보통 어떻게 해?`
- `이 기능의 goal은 어떻게 잡는 게 좋아?`
- `선택지 A와 B를 PM 관점에서 비교해줘`
- `지금 당장 정해야 할 것과 나중에 미뤄도 되는 걸 나눠줘`

## 단계 전환

직접 `approve` 같은 텍스트를 칠 필요는 없다.

버튼만 누르면 된다.

### Discovery 단계

- `다음 단계로 진행`
- `파기 후 종료`

### Demo 단계

- `다음 단계로 진행`
- `파기 후 종료`

즉 사람이 직접 결정하는 버튼은 두 군데뿐이다.

- Discovery
- Demo Review

자동 진행 단계에서는 필요하면 `파기 후 종료`만 사용할 수 있다.

단계가 넘어갈 때는 바로 이전 단계에서 정리된 내용을 짧게 요약해서 같이 보여준다.

- Discovery -> Design Pack
- Design Pack -> Demo Review
- Demo Review -> Technical Freeze
- Technical Freeze -> Implementation
- Implementation -> Merge
- Merge -> Done

## /status 사용법

### thread 안에서

현재 스프린트의 상세 상태를 보여준다.

- 현재 단계
- 상태
- 현재 job 상태
- 다음 사람 체크포인트
- codex session
- worktree
- branch
- 직전 단계 요약

그리고 이 메시지에서도 바로:
- `다음 단계로 진행`
- `파기 후 종료`

를 누를 수 있다.

### 채널 본문에서

현재 등록된 모든 스프린트 요약을 보여준다.

즉 여러 스프린트를 병렬로 돌릴 때 전체 대시보드처럼 쓸 수 있다.

## 병렬 스프린트 예시

동시에 이런 식으로 운영할 수 있다.

- `sprint1/oauth`
- `sprint1/calendar-share`
- `sprint2/push-reminder`

각 스프린트는 서로 다른:

- thread
- worktree
- branch

를 가진다.

## 사용 전 체크

Discord에서 작업 시작 전에 데스크탑에서:

```bash
toda-discord status
toda-discord health
```

정상 기준:

- `status=running`
- `bridge=healthy`

## 장애 대응

### Discord에서 "애플리케이션이 응답하지 않았어요"

대부분 아래 두 개를 먼저 본다.

```bash
toda-discord status
toda-discord health
```

필요하면:

```bash
toda-discord restart
toda-discord logs
```

### bridge는 살아 있는데 응답이 이상함

- `pnpm discord:doctor`
- `pnpm discord:register`
- `toda-discord restart`

순서로 점검한다.

같은 답이 계속 반복되면:

1. `toda-discord logs`
2. `toda-discord restart`

를 먼저 보고, bridge가 Codex 호출에 실패해서 fallback 템플릿으로 내려간 것은 아닌지 확인한다.

## 자동 단계는 어떻게 도나

`ACTIVE`는 이제 그냥 이름만 바뀐 상태가 아니다.

- `DESIGN_PACK`
- `TECHNICAL_FREEZE`
- `IMPLEMENTATION`
- `MERGE`

이 단계에 들어가면 bridge가 실제 job을 시작한다.

job은:
- worktree를 준비하고
- Codex worker를 실행하고
- 끝나면 다음 단계로 자동 전환하거나
- 실패하면 `BLOCKED`로 멈춘다

`BLOCKED`가 되면 thread 안의 버튼이나 `/status`에서 `다시 시도`를 누르면 된다.

## 로그는 어디서 보나

기본 로그:

- stdout: [stdout.log](/Users/kimyoukwon/Desktop/toda-calendar/.data/discord-bridge/stdout.log)
- stderr: [stderr.log](/Users/kimyoukwon/Desktop/toda-calendar/.data/discord-bridge/stderr.log)
- health: [health.json](/Users/kimyoukwon/Desktop/toda-calendar/.data/discord-bridge/health.json)
- state: [discord-bridge-state.json](/Users/kimyoukwon/Desktop/toda-calendar/.data/discord-bridge-state.json)
- job history: [jobs.jsonl](/Users/kimyoukwon/Desktop/toda-calendar/.data/discord-bridge/jobs.jsonl)

`jobs.jsonl`에는 최소한 이력이 남는다.

- 어떤 thread에서
- 어떤 stage job을 시작했는지
- 성공했는지
- 실패했는지
