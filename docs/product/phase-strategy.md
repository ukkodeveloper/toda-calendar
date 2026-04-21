# Toda Calendar Phase Strategy

## 1. 문서 목적

이 문서는 [mvp-discovery.md](/Users/kimyoukwon/.codex/worktrees/c067/toda-calendar/docs/product/mvp-discovery.md)를 바탕으로, Toda Calendar의 `MVP -> Post-MVP 1~6` 확장 전략을 단계별로 정리한 제품 전략 문서다.

이 문서의 목적은 다음과 같다.

- 어떤 기능을 어떤 순서로 붙여야 정체성을 잃지 않는지 정리한다
- 각 단계에서 핵심으로 봐야 할 사용자 수와 리텐션 지표를 명확히 한다
- 다음 단계로 넘어가도 되는 성공 기준을 phase gate 형태로 정의한다
- 서비스 기획 전문가, 마케터, 성공한 앱 CEO 관점을 동시에 반영해 우선순위를 검증한다

## 2. 전제와 해석 기준

이 문서의 숫자는 장기 예측치가 아니라 `다음 단계로 넘어갈 수 있는지 판단하는 운영 기준`이다.

가정:

- 제품은 `iPhone first`다
- 초기에는 소수 유저를 빠르게 학습하는 방식으로 운영한다
- 창업팀이 아니라 `첫 1인 개발자가 운영하는 인디 제품` 기준으로 본다
- 핵심 경쟁력은 기능 수보다 `감정적 완성도`, `기록 습관`, `회상 surface`에 있다
- 모든 단계는 직선형 출시보다 `실험 -> 관찰 -> 보완 -> 확대`를 전제로 한다

핵심 원칙:

- Toda는 생산성 캘린더가 아니라 `기억 인터페이스`다
- 단계가 올라가도 이 정체성을 해치면 안 된다
- `소셜`, `멀티 캘린더`, `게이미피케이션`은 강한 확장 카드지만, 코어 루프가 살아 있기 전에는 독이 될 수 있다
- 각 단계의 성공 판단은 install 절대량보다 `작은 cohort에서의 retention signal`을 더 우선한다

## 3. 전체 제품 전략 한 줄

Toda는 `한 칸 남기기`에서 출발해,  
`다시 돌아오게 하고 -> 다시 보고 싶게 만들고 -> 감정적으로 애착이 생기게 하고 -> 삶의 여러 축으로 확장하고 -> 마지막에 관계 기반 제품으로 넓히는` 순서로 진화해야 한다.

## 4. 공통 KPI 체계

### 4.1 공통 North Star

`Monthly Remembered Days per Active User`

정의:

- 한 사용자가 한 달 동안 최소 1개 이상의 기록을 남긴 `서로 다른 날짜 수`
- 사진, 문장, 낙서, 위치 등 포맷이 무엇이든 그날 기록이 있으면 1일로 계산

이 지표를 쓰는 이유:

- Toda의 본질은 `많이 쓰는 것`이 아니라 `하루를 남기는 것`이기 때문
- 생산성 앱처럼 태스크 개수로 보면 제품 정체성이 흐려진다

### 4.2 공통 핵심 지표

| 구분 | 지표 | 의미 |
|---|---|---|
| Activation | 첫 24시간 내 첫 기록 작성률 | 첫 진입 장벽이 낮은지 |
| Habit | 첫 7일 내 서로 다른 3일 기록 비율 | 초기 습관 형성 가능성 |
| Retention | D7 / D30 / D90 | 장기 잔존 가능성 |
| Depth | WAU당 주간 기록 일수 | 제품이 일상 안에 들어왔는지 |
| Recall | 회상 기능 진입률 | Toda가 기억 surface로 작동하는지 |
| Emotional | 저장 후 재진입율 / 리포트 오픈율 / companion 사용률 | 감정적 보상이 실제 행동으로 이어지는지 |

### 4.3 공통 Guardrail

- crash-free session: `99.3%+`
- 첫 기록까지 걸리는 시간: `15초 이내` 유지
- 푸시 opt-out 이후 주간 리텐션 급락 여부
- 기능 추가 후 월 뷰 중심 사용성이 무너지지 않는지
- 사진 업로드/낙서 저장 실패율
- privacy 관련 불만 비율

### 4.4 공통 운영 규칙

- 각 phase는 `install 수`보다 `최소 평가 cohort`를 먼저 만족해야 평가할 수 있다
- 각 phase에는 `Primary KPI` 1개와 `Kill Metric` 1개를 둔다
- Primary KPI가 좋아도 Kill Metric이 무너지면 다음 단계로 넘어가지 않는다
- 같은 phase 안에서 최소 `2회 이상` 개선 사이클을 돌린 뒤 다음 단계 진입 여부를 판단한다
- 글로벌 홍보는 하되, 초기 운영 언어와 카피는 `영문 중심, 필요 시 한국어 보조`처럼 최소 복잡도로 간다
- 소셜/멀티 캘린더 같은 큰 확장은 앞 phase의 retention signal이 약하면 보류한다

## 5. 단계별 로드맵 요약

| 단계 | 핵심 질문 | 목표 사용자 규모 | 최소 평가 cohort | Primary KPI | Kill Metric | 단계의 대표 기능 |
|---|---|---|---|---|---|---|
| MVP | 사용자가 하루 한 칸을 남기기 시작하는가 | 50~150 installs | 신규 가입 30명 | 첫 7일 내 3일 기록 비율 | 첫 기록 작성률 35% 미만 또는 D7 15% 미만 | 월 뷰, bottom sheet 기록, 사진/문장/낙서 |
| Post-MVP 1 | 다시 돌아오게 만드는 기반이 있는가 | 150~400 installs | push prompt 노출 40명 | notification -> record conversion | push 기반 재방문 세션 비중 10% 미만 | RN 셸, 푸시, 알림 설정, 딥링크 |
| Post-MVP 2 | 다시 보는 재미가 리텐션으로 이어지는가 | 400~1,000 installs | rewind eligible 50명 | 2주 연속 active user 비율 | Weekly Rewind open rate 20% 미만 | weekly rewind, missed-day recovery, 주간 회상 |
| Post-MVP 3 | 감정적 보상이 습관을 더 강화하는가 | 800~2,000 installs | retained user 60명 | companion cohort D30 uplift | companion adoption 20% 미만 또는 기록 빈도 정체 | 펫/companion, ritual형 habit layer |
| Post-MVP 4 | 표현과 회상 surface를 넓혀도 코어가 유지되는가 | 1,500~4,000 installs | 확장 포맷 노출 75명 | 30일 내 과거 기록 revisit 비율 | 첫 기록 시간 20초 초과 또는 activation 10%p 하락 | 주간 뷰, 위치/지도, richer formats |
| Post-MVP 5 | 사용자가 삶의 주제별로 기억을 분리해 쌓고 싶어 하는가 | 3,000~8,000 installs | retained user 100명 | 두 번째 캘린더 생성률 | 기본 캘린더 기록 빈도 10% 이상 하락 | 멀티 캘린더, 테마별 아카이브 |
| Post-MVP 6 | private social layer가 정체성을 강화하는가 | 5,000~20,000 installs | active user 150명 + 연결 쌍 40개 | connected users D30 uplift | privacy complaint 1% 초과 또는 solo retention 10% 하락 | 피드, 코드 기반 팔로우, 노출 범위 설정 |

### 5.1 Post-MVP 3과 4의 분기 규칙

기본 순서는 `Post-MVP 3 -> Post-MVP 4`이지만, 아래 조건이면 순서를 바꿀 수 있다.

- `Post-MVP 3`을 먼저 간다
  - 재방문은 생겼지만 장기 애착이 약하다
  - 유저가 기록을 더 남길 이유보다 `다시 열 감정적 이유`가 부족하다
  - weekly rewind는 열지만, 그 다음 주 기록 지속성이 낮다

- `Post-MVP 4`를 먼저 간다
  - 이미 기록 습관은 어느 정도 살아 있다
  - 유저가 `더 다양한 방식으로 남기고 싶다`, `주간으로 보고 싶다`를 반복적으로 말한다
  - 포맷/회상 확장 요구가 companion 요구보다 더 강하다

## 6. MVP

### 6.1 단계 목표

핵심 질문:

> 긴 글이 부담스러운 사용자도, 사진/짧은 문장/낙서 중 하나로 오늘을 남기고 다시 열 이유를 느끼는가?

### 6.2 핵심 기능

- 로그인
- 월 뷰 홈
- 날짜 탭 -> floating bottom sheet
- 사진 / 문장 / 낙서 입력
- 포맷별 1개 슬롯
- 월 뷰 포맷 레이어 전환
- 저장 직후 안착 모션

**왜 지금**

- 모든 후속 phase는 `한 칸 남기기`가 실제로 먹히는지 확인된 뒤에만 의미가 있다

**핵심 메시지**

- 길게 쓰지 않아도 오늘을 남길 수 있다

**마케팅 포인트**

- App Store와 초기 랜딩의 대표 훅은 `오늘 한 칸 남기기`다

**개발 복잡도 메모**

- `중간`: 사진 업로드, 낙서 입력, 저장 모션의 완성도가 핵심 난이도다

**이번 단계에서 하지 않을 것**

- 푸시/알림
- 주간 리포트
- companion/펫
- 주간 뷰
- 멀티 캘린더
- 소셜 기능

### 6.3 목표 사용자 규모

- closed alpha/beta: `50~150 installs`
- 관측 가능한 주간 활성 사용자: `15~50 WAU`
- 최소 평가 cohort: `신규 가입 30명`

### 6.4 핵심 성공 지표

**Primary KPI**

- 첫 7일 내 서로 다른 3일 기록 비율

**Kill Metric**

- 첫 24시간 내 첫 기록 작성률 `35% 미만` 또는 D7 retention `15% 미만`

- 첫 24시간 내 첫 기록 작성률: `60%+`
- 첫 7일 내 서로 다른 3일 기록 비율: `35%+`
- D7 retention: `25%+`
- 월 뷰 포맷 전환 사용률: `50%+`
- WAU당 주간 기록 일수: `2.2일+`

**필수 이벤트**

- `signup_completed`
- `calendar_month_opened`
- `day_cell_tapped`
- `record_started`
- `record_saved`
- `format_switched`

### 6.5 Phase Gate

아래를 만족하면 Post-MVP 1로 넘어간다.

- 15명 이상이 첫 7일 내 3일 기록을 달성
- 저장 모션과 월 뷰 구조에 대한 정성 피드백이 긍정적
- 기록 입력 시간이 `15초 안팎`으로 유지

**Phase Gate를 못 넘으면**

- 로그인/온보딩 마찰부터 줄인다
- 입력 포맷 기본값을 더 단순화한다
- 모션은 유지하되 저장/편집 경로를 더 짧게 만든다
- 리텐션 기능을 추가하지 않고 MVP 루프 자체를 다시 다듬는다

### 6.6 전문가 관점 평가

`서비스 기획 전문가`

- MVP는 반드시 `한 칸 남기기`만 검증해야 한다
- 여기서 회고, 리마인드, 소셜을 넣으면 문제-해결 검증이 흐려진다

`마케터`

- 메시지는 하나여야 한다: `길게 쓰지 않아도 오늘을 남길 수 있다`
- install 이유는 기능이 아니라 낮은 입력 부담과 감성적 저장 보상이다

`성공한 앱 CEO`

- 이 단계는 확장보다 `반복 사용의 씨앗`을 확인하는 단계다
- install 수보다 3일 기록률과 D7이 훨씬 중요하다

## 7. Post-MVP 1: 재진입 인프라

### 7.1 단계 목표

핵심 질문:

> 사용자가 제품을 다시 열 이유를 기술적으로, 운영적으로 만들 수 있는가?

### 7.2 핵심 기능

- React Native 셸 안정화
- 웹뷰 기반 앱 구조 정비
- 푸시 권한 플로우
- 매일 알림
- 알림 설정 화면
- 딥링크로 특정 날짜/오늘 기록 화면 진입
- 푸시에서 앱 진입 후 바로 기록할 수 있는 복귀 UX
- 알림/재진입 이벤트 로깅

**왜 지금**

- MVP에서 코어 기록 루프가 보였다면, 이제는 다시 열게 만드는 재진입 인프라가 필요하다

**핵심 메시지**

- 잊지 않게, 조용히 다시 돌아오게 한다

**마케팅 포인트**

- acquisition보다는 lifecycle messaging 실험 단계다

**개발 복잡도 메모**

- `높음`: RN 셸, 웹뷰, 푸시, 딥링크, 권한 흐름이 동시에 얽힌다

**이번 단계에서 하지 않을 것**

- weekly rewind
- companion/펫
- 주간 뷰, 위치 포맷
- 멀티 캘린더
- 소셜

### 7.3 목표 사용자 규모

- `150~400 installs`
- `40~120 WAU`
- 최소 평가 cohort: `push prompt 노출 40명`

### 7.4 핵심 성공 지표

**Primary KPI**

- `notification -> record conversion`

**Kill Metric**

- 전체 주간 재방문 세션 중 푸시/딥링크 기여 비중이 `10% 미만`

- 푸시 권한 허용률: `55%+`
- reminder notification open rate: `15%+`
- notification -> record conversion: `8%+`
- D7 retention: `30%+`
- D30 retention: `12%+`
- push로 돌아온 사용자의 주간 기록 일수: 비푸시 복귀 유저 대비 `동등 이상`

**필수 이벤트**

- `push_permission_prompted`
- `push_permission_granted`
- `notification_sent`
- `notification_opened`
- `deep_link_opened`
- `reminder_record_saved`

### 7.5 Phase Gate

- 전체 주간 재방문 세션 중 `20%+`가 푸시/딥링크에서 발생
- 푸시 기반 복귀 사용자의 이탈률이 과도하게 높지 않음
- RN 셸로 인해 저장/카메라/낙서 경험이 훼손되지 않음

**Phase Gate를 못 넘으면**

- permission prompt 타이밍을 늦춘다
- 푸시 빈도보다 카피와 링크 목적지를 먼저 고친다
- 웹뷰 범위를 줄이고 핵심 네이티브 escape hatch를 검토한다

### 7.6 전문가 관점 평가

`서비스 기획 전문가`

- 이 단계는 기능 확장이 아니라 `리텐션 기반 공사`다
- 푸시는 제품의 본질이 아니라, 본질로 다시 돌아오게 만드는 장치로 써야 한다

`마케터`

- lifecycle 메시지 실험이 시작되는 첫 단계다
- 푸시 카피는 죄책감이 아니라 회상과 애착을 건드려야 한다

`성공한 앱 CEO`

- RN 셸은 성장 투자지만, 핵심 경험이 나빠지면 장기적으로 더 큰 비용을 만든다
- 이 단계의 KPI는 설치 수가 아니라 `push-enabled retention lift`다

## 8. Post-MVP 2: 리텐션 루프와 Weekly Rewind

### 8.1 단계 목표

핵심 질문:

> 쌓인 기록을 다시 보는 재미가 실제 리텐션으로 이어지는가?

### 8.2 핵심 기능

- `Weekly Rewind` 또는 `This Week in Toda`
- 스포티파이 결산처럼 카드형 주간 리포트
- 이번 주 기록한 날짜 수
- 가장 많이 사용한 포맷
- 이번 주 대표 하루
- 한 줄 분위기 요약
- 지난 7일 달력 카드
- `오늘 한 칸 남기기` CTA
- missed-day recovery UX
- 주간 리포트 푸시/인앱 진입

**왜 지금**

- 재진입 채널이 생겼다면, 이번에는 유저가 `보고 싶어서` 다시 여는 이유를 만들어야 한다

**핵심 메시지**

- 이번 주의 내가 한눈에 보인다

**마케팅 포인트**

- 나중에 공유 가능한 브랜드 카드의 원형을 만드는 단계다

**개발 복잡도 메모**

- `중간`: 리포트 생성 로직, 카드 UX, 푸시 타이밍 설계가 핵심이다

**이번 단계에서 하지 않을 것**

- companion/펫
- 주간 뷰와 지도 포맷 확장
- 멀티 캘린더
- 소셜 공유 피드

### 8.3 목표 사용자 규모

- `400~1,000 installs`
- `100~250 WAU`
- 최소 평가 cohort: `Weekly Rewind eligible user 50명`

### 8.4 핵심 성공 지표

**Primary KPI**

- `2주 연속 active user 비율`

**Kill Metric**

- Weekly Rewind open rate `20% 미만`

- Weekly Rewind eligible user open rate: `35%+`
- Weekly Rewind -> record CTA conversion: `12%+`
- 2주 연속 active user 비율: `30%+`
- WAU/MAU: `45%+`
- D30 retention: `18%+`
- 지난 기록 revisit 비율: `25%+`

**필수 이벤트**

- `weekly_rewind_generated`
- `weekly_rewind_opened`
- `weekly_rewind_card_viewed`
- `rewind_cta_clicked`
- `missed_day_recovery_opened`
- `past_record_revisited`

### 8.5 Phase Gate

- 주간 리포트 오픈이 실제 기록 행동으로 연결됨
- 2주 연속 active cohort가 안정적으로 형성됨
- 유저 인터뷰/피드백에서 `다시 보고 싶어서 열었다`는 반응이 반복적으로 확인됨

**Phase Gate를 못 넘으면**

- 통계 느낌을 줄이고 회상 카드 중심으로 단순화한다
- 리포트 길이를 줄이고 `대표 하루` 중심으로 재설계한다
- 푸시보다는 홈 진입 카드로 먼저 학습한다

### 8.6 전문가 관점 평가

`서비스 기획 전문가`

- 이 단계의 리포트는 `성과 보고서`가 아니라 `회상 경험`이어야 한다
- productivity tone으로 흐르면 Toda 정체성이 무너진다

`마케터`

- 주간 리포트는 retention 기능이자 브랜딩 자산이다
- 나중에 공유 기능으로 확장될 수 있는 카드 언어를 미리 확보해야 한다

`성공한 앱 CEO`

- D30이 올라가지 않는 weekly feature는 아름답지만 비싼 장식이 될 위험이 있다
- 이 단계는 `reopen reason`을 만드는 데 성공해야 한다

## 9. Post-MVP 3: 감정적 게이미피케이션

### 9.1 단계 목표

핵심 질문:

> 감정적 companion과 ritual layer가 기록 습관을 더 오래 붙잡아 둘 수 있는가?

### 9.2 핵심 기능

- 펫/companion 시스템
- 기록할수록 반응하거나 성장하는 요소
- ritual형 habit layer
- 과도한 생산성 체크리스트가 아닌 `삶의 리듬`을 기록하는 습관 UI
- 연속 기록, 회복 기록, gentle streak
- 기록하지 못한 날을 죄책감 없이 복귀시키는 UX

**왜 지금**

- 이제는 기능적 리텐션을 넘어, 유저가 감정적으로 애착을 느끼는 이유가 필요하다

**핵심 메시지**

- 내 기록과 함께 자라는 작은 존재가 있다

**마케팅 포인트**

- companion은 앱을 기억하게 만드는 마스코트가 될 수 있다

**개발 복잡도 메모**

- `중간~높음`: 상태 변화 규칙, 성장 피드백, 과한 게임화 방지가 어렵다

**이번 단계에서 하지 않을 것**

- 위치/지도, 포맷 대확장
- 멀티 캘린더
- 피드 중심 소셜
- 과한 게임 시스템

### 9.3 목표 사용자 규모

- `800~2,000 installs`
- `200~500 WAU`
- 최소 평가 cohort: `retained user 60명`

### 9.4 핵심 성공 지표

**Primary KPI**

- `companion cohort D30 uplift`

**Kill Metric**

- companion adoption `20% 미만` 또는 WAU당 주간 기록 일수 개선 없음

- companion adoption rate: `40%+` of retained users
- companion user D30: non-companion retained user 대비 `1.25x+`
- WAU당 주간 기록 일수: `3.0일+`
- 4주 연속 active user 비율: `15%+`
- push off users 중에서도 self-driven revisit 증가

**필수 이벤트**

- `companion_enabled`
- `companion_interacted`
- `gentle_streak_extended`
- `streak_recovered`
- `ritual_completed`
- `companion_prompt_opened`

### 9.5 Phase Gate

- companion이 단순 novelty가 아니라 실사용 리텐션 개선으로 이어짐
- gamification 요소를 넣어도 제품이 생산성 앱이나 육성 게임처럼 오해되지 않음
- 연속 기록 끊김 이후 복귀율이 유의미하게 개선됨

**Phase Gate를 못 넘으면**

- companion 범위를 축소해 `gentle streak + recovery UX`만 남긴다
- 캐릭터 성장보다 기록 복귀 보상에 집중한다
- 게임성을 더하는 대신 감정적 카피와 마이크로 모션을 강화한다

### 9.6 전문가 관점 평가

`서비스 기획 전문가`

- 게이미피케이션은 가능하지만 제품 본질을 덮으면 안 된다
- 펫은 목표가 아니라 `기록 습관을 감정적으로 도와주는 인터페이스`여야 한다

`마케터`

- 이 단계는 브랜딩 포인트가 가장 강해질 수 있다
- companion은 앱을 기억하게 만드는 상징 자산이 될 수 있다

`성공한 앱 CEO`

- retention을 올리는 게임화는 강력하지만, 잘못하면 코어 유저를 분산시킨다
- 반드시 cohort 기준 uplift가 확인될 때만 확장 투자해야 한다

## 10. Post-MVP 4: 표현과 회상 Surface 확장

### 10.1 단계 목표

핵심 질문:

> 기록 표현 방식과 회상 surface를 확장해도, 입력 부담은 낮게 유지되는가?

### 10.2 핵심 기능

- 주간 뷰
- 위치/지도 포맷
- richer memory cards
- 포맷 확장에 맞는 월/주 회상 surface
- 특정 주/장소/분위기 기반 탐색

**왜 지금**

- 습관이 생긴 뒤에는 `더 다르게 남기고 더 잘 돌아보는 경험`이 깊이를 만든다

**핵심 메시지**

- 더 다르게 남기고, 더 짧게 돌아본다

**마케팅 포인트**

- `이번 주의 나`, `이달의 나`처럼 회상형 브랜딩 확장이 가능하다

**개발 복잡도 메모**

- `중간~높음`: 주간 뷰, 위치 데이터, 추가 포맷 저장 비용이 함께 증가한다

**이번 단계에서 하지 않을 것**

- 멀티 캘린더
- 소셜 피드
- 복잡한 편집기

주간 뷰 원칙:

- 생산성용 weekly planner가 아니다
- `지난 며칠을 더 짧게 훑어보는 회상 surface`로 설계한다

### 10.3 목표 사용자 규모

- `1,500~4,000 installs`
- `350~900 WAU`
- 최소 평가 cohort: `확장 포맷 또는 주간 뷰 노출 75명`

### 10.4 핵심 성공 지표

**Primary KPI**

- `30일 내 과거 기록 revisit 비율`

**Kill Metric**

- 첫 기록까지 걸리는 시간이 `20초 초과` 또는 activation이 이전 단계 대비 `10%p 하락`

- week view usage among retained users: `35%+`
- 신규 포맷 adoption: `20%+`
- multi-format recorded day ratio: `25%+`
- revisit to past records within 30 days: `35%+`
- 첫 기록까지 걸리는 시간: `15초 내` 유지
- D30 retention: `22%+`

**필수 이벤트**

- `week_view_opened`
- `location_added`
- `memory_card_opened`
- `past_record_revisited`
- `format_added`
- `week_to_month_switched`

### 10.5 Phase Gate

- 표현 확장이 입력 장벽을 높이지 않음
- 위치/주간 뷰가 실제 회상 품질을 높였다는 정성 피드백 확보
- `더 복잡해졌다`보다 `더 풍부하게 남길 수 있다`는 반응이 우세

**Phase Gate를 못 넘으면**

- 주간 뷰의 진입점을 낮추고 홈 중심은 월 뷰로 되돌린다
- 위치 같은 고급 포맷은 progressive disclosure로 숨긴다
- 표현 확장을 계속하기보다 회상 surface만 먼저 다듬는다

### 10.6 전문가 관점 평가

`서비스 기획 전문가`

- 이 단계에서 가장 주의할 점은 product sprawl이다
- 포맷은 많아져도 여전히 `오늘 한 칸 남기기`가 더 쉬워야 한다

`마케터`

- 위치/주간 뷰는 shareable narrative를 만든다
- `이번 주의 나`, `이달의 나` 같은 브랜딩 확장이 가능해진다

`성공한 앱 CEO`

- 포맷 확장은 저장 비용과 UI 복잡도를 동시에 키운다
- depth는 올라가도 activation이 깨지면 실패다

## 11. Post-MVP 5: 개인 아카이브 구조화

### 11.1 단계 목표

핵심 질문:

> 사용자는 하나의 삶이 아니라 여러 주제의 삶을 분리해서 기억하고 싶어 하는가?

### 11.2 핵심 기능

- 멀티 캘린더
- 테마별 캘린더 생성
- 예: 음악, 공부, 여행, 반려생활
- 캘린더별 표지/무드/커버
- 기본 캘린더와 서브 캘린더 간 자연스러운 이동
- 템플릿 기반 생성 검토

**왜 지금**

- 충분히 남기고 돌아보는 power user가 생기면, 삶의 여러 주제를 나누고 싶어질 수 있다

**핵심 메시지**

- 삶의 테마마다 따로 쌓을 수 있다

**마케팅 포인트**

- 여행/반려/공부처럼 카테고리별 acquisition 메시지를 만들 수 있다

**개발 복잡도 메모**

- `높음`: 데이터 모델, 탐색 구조, 생성 UX를 다시 설계해야 한다

**이번 단계에서 하지 않을 것**

- 공개형 피드
- 과한 협업 구조
- 너무 많은 정보 구조 옵션

### 11.3 목표 사용자 규모

- `3,000~8,000 installs`
- `700~1,800 WAU`
- 최소 평가 cohort: `retained user 100명`

### 11.4 핵심 성공 지표

**Primary KPI**

- retained users의 `두 번째 캘린더 생성률`

**Kill Metric**

- 기본 캘린더 기록 빈도가 이전 단계 대비 `10% 이상 하락`

- retained users의 두 번째 캘린더 생성률: `20%+`
- multi-calendar user의 D30: single-calendar retained user 대비 `1.15x+`
- multi-calendar user의 30일 후 유지율: `35%+`
- 기본 캘린더 기록 빈도 하락폭: `5% 이내`
- theme-based template start rate: `25%+` among creators

**필수 이벤트**

- `calendar_created`
- `calendar_switched`
- `second_calendar_created`
- `calendar_template_used`
- `record_saved_with_calendar_id`

### 11.5 Phase Gate

- 멀티 캘린더가 진짜 니즈로 확인됨
- 구조 확장 때문에 제품이 어려워졌다는 반응이 낮음
- power user value가 분명하지만, core calendar 사용성은 유지됨

**Phase Gate를 못 넘으면**

- 멀티 캘린더 대신 `collections` 또는 `tags` 수준으로 축소한다
- 새 캘린더 생성 UI를 늦게 노출한다
- power user 전용 실험 기능으로 남기고 전체 확장은 미룬다

### 11.6 전문가 관점 평가

`서비스 기획 전문가`

- 이 단계는 information architecture 재설계 단계다
- 여기서 무너지면 제품이 예쁜데 어려운 앱이 된다

`마케터`

- 테마 캘린더는 acquisition 훅으로도 좋다
- 여행 캘린더, 반려 캘린더, 공부 캘린더처럼 카테고리별 메시지 확장이 가능하다

`성공한 앱 CEO`

- 멀티 캘린더는 retention보다 ARPU/확장성 쪽 가치가 더 클 수 있다
- 하지만 너무 빨리 열면 제품이 핵심을 잃고 복잡해진다

## 12. Post-MVP 6: 프라이빗 소셜 레이어

### 12.1 단계 목표

핵심 질문:

> private social layer가 solo memory product를 해치지 않고 더 강하게 만들 수 있는가?

### 12.2 핵심 기능

- `개인` 탭 / `피드` 탭 분리
- 어제의 하루 중심 피드
- 코드 기반 팔로우
- 공개 범위 설정
- 전체 / 팔로워 / 친한 팔로워 등 visibility 제어
- 컨텐츠 타입별 노출 제어
- soft social interaction

핵심 원칙:

- 인스타그램처럼 공개 확산을 최적화하지 않는다
- 기본값은 private
- 공유는 선택
- 관계는 코드/초대 기반으로 천천히 확장

**왜 지금**

- 개인 제품으로서 충분한 잔존이 만들어진 뒤에만, 관계 기반 확장이 제품을 살릴 수 있다

**핵심 메시지**

- 보여주고 싶은 어제만, 보여주고 싶은 사람에게

**마케팅 포인트**

- viral growth보다 `private intimacy`를 브랜드 자산으로 삼는다

**개발 복잡도 메모**

- `매우 높음`: social graph, visibility rules, trust and safety, feed ranking이 모두 필요해진다

**이번 단계에서 하지 않을 것**

- 공개형 바이럴 피드
- 무제한 공개 추천 알고리즘
- 경쟁형 소셜 메트릭

### 12.3 목표 사용자 규모

- `5,000~20,000 installs`
- `1,200+ WAU`
- 최소 평가 cohort: `active user 150명 + 연결 쌍 40개`

### 12.4 핵심 성공 지표

**Primary KPI**

- `connected users D30 uplift`

**Kill Metric**

- privacy complaint `1% 초과` 또는 solo retention `10% 이상 하락`

- invite sent -> connected friend conversion: `25%+`
- 연결 유저 비율: `30%+` of active users
- connected users D30: non-connected users 대비 `1.5x+`
- feed consumers의 record continuation rate: `10%+` uplift
- privacy complaint / unwanted exposure complaint: `1% 미만`
- muted, blocked, visibility changed events 모니터링

**필수 이벤트**

- `invite_code_created`
- `follow_connected`
- `visibility_changed`
- `feed_opened`
- `shared_record_viewed`
- `privacy_reported`

### 12.5 Phase Gate

- 네트워크 효과가 solo retention을 실제로 끌어올림
- private by default 구조가 신뢰를 해치지 않음
- social 때문에 피로감이 증가하지 않음

**Phase Gate를 못 넘으면**

- invite-only, read-only 공유 모드로 축소한다
- 피드는 dark launch 상태로 유지하고 개인 탭을 계속 메인으로 둔다
- 소셜 확장보다 export/private share를 먼저 강화한다

### 12.6 전문가 관점 평가

`서비스 기획 전문가`

- 이 단계는 feature addition이 아니라 product identity 확장이다
- 설계 실패 시 Toda가 일반 SNS의 약한 복제품처럼 보일 위험이 있다

`마케터`

- social layer는 강한 성장 레버가 될 수 있다
- 하지만 viral보다 `private intimacy`를 브랜드 자산으로 삼는 편이 더 Toda답다

`성공한 앱 CEO`

- solo retention이 약한 상태의 social 투자는 대부분 실패한다
- social은 가장 늦게, 가장 의도적으로 들어가야 한다

## 13. 전문가들이 공통으로 요구할 추가 작업

단계별 기능 외에도 아래는 별도 initiative로 지속 관리해야 한다.

### 13.1 분석 체계

- 이벤트 taxonomy 문서화
- cohort dashboard 구축
- phase gate 기준 자동 보고
- 푸시 카피 A/B 테스트

### 13.2 신뢰와 데이터 보호

- 백업/복구 정책
- 사진 저장 정책
- export 가능성 검토
- privacy defaults 설계

### 13.3 저장 비용과 성능

- 사진/낙서 저장 비용 추적
- 미디어 최적화
- RN 셸 성능/메모리 관리
- 스크롤과 모션 프레임 드랍 모니터링

### 13.4 초기 성장 실험

- onboarding copy 실험
- app store positioning
- first 7 days lifecycle 설계
- weekly rewind naming 실험

### 13.5 브랜드 일관성

- Toda가 `기억 인터페이스`라는 정체성을 잃지 않도록 카피 가이드 유지
- 생산성, 다이어리, SNS 중 어디에 가까운지 계속 설명 가능해야 함

## 14. 최종 제안

지금 시점에서 가장 좋은 순서는 다음과 같다.

1. `MVP`: 한 칸 남기기 검증
2. `Post-MVP 1`: 푸시와 재진입 기반
3. `Post-MVP 2`: weekly rewind 중심 리텐션 강화
4. `Post-MVP 3`: companion 중심 감정적 게이미피케이션
5. `Post-MVP 4`: 주간 뷰, 위치 등 회상/표현 확장
6. `Post-MVP 5`: 멀티 캘린더
7. `Post-MVP 6`: private social

이 순서가 좋은 이유는 다음과 같다.

- 가장 큰 리스크인 `습관 형성 실패`를 앞단에서 먼저 다룬다
- Toda의 정체성인 `기억`과 `회상`을 중반까지 유지한다
- 강력하지만 무거운 확장 카드인 `멀티 캘린더`와 `소셜`을 뒤로 보낸다
- 각 단계가 다음 단계의 학습 재료가 되도록 설계한다

## 15. 다음 문서화 추천

다음으로 만들면 좋은 문서는 아래 둘이다.

- `post-mvp-prd.md`
  - 위 phase 전략을 바탕으로 가장 가까운 다음 단계인 Post-MVP 1~2만 PRD 수준으로 상세화
- `metrics-spec.md`
  - 이벤트 정의, 코호트 기준, 대시보드 구성, phase gate 계산 로직 정리
