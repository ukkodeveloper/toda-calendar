# Toda Calendar Mobile Motion System

## 목적

이 문서는 Toda 캘린더 앱의 모바일 모션 기준을 정의한다.

관련 문서:

- 구현 중심 토큰 레퍼런스: [animation-tokens.md](./animation-tokens.md)

핵심 목표는 세 가지다.

- Apple-like in restraint
- Toss-like in responsiveness
- Calendar-like in spatial clarity

즉, 화려한 애니메이션이 아니라 모바일 일정 앱에 맞는 조용한 신뢰감을 만드는 것이 목적이다.

## 기본 원칙

1. 터치 피드백은 가장 빠르고 가장 짧아야 한다.
2. 화면 전환은 짧은 거리만 이동해서 사용자의 맥락을 유지해야 한다.
3. 바텀시트는 별도 페이지처럼 보이지 않고 현재 화면 위에 쌓인 레이어처럼 느껴져야 한다.
4. 리스트 삽입과 삭제는 레이아웃을 흔들지 않고 정리되듯 움직여야 한다.
5. Reduced Motion에서는 transform보다 fade, tint, highlight를 우선 사용한다.

## 모바일 토큰 표

| Layer      | Token            | Motion                                         | Mobile usage                                          | Guardrail                                                         | Reduced Motion                      |
| ---------- | ---------------- | ---------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------- |
| Touch      | `touch-feedback` | spring `560/36` + scale `0.97`                 | 하단 탭, 날짜 셀, 아이콘 버튼, CTA                    | y 이동이나 glow를 겹쳐 넣지 않는다                                | scale 제거, 색/opacity만 유지       |
| Selection  | `selection-flow` | shared layout + spring `430/34`                | 세그먼트 컨트롤, 활성 탭, 선택 날짜, 필터 칩          | 선택 배경을 remount 하지 말고 surface를 이동시킨다                | crossfade 하이라이트                |
| Navigation | `screen-slide`   | x `24px` + spring `320/30` + scale `0.992`     | 탭 내용 전환, 캘린더 뷰 전환, 경량 detail push        | 32px 이상 이동하거나 bounce를 넣지 않는다                         | opacity crossfade                   |
| Surface    | `sheet-stack`    | y `36px` + spring `250/30` + backdrop fade     | 바텀시트, quick add composer, 필터 패널, day details  | 센터 팝업처럼 보이게 scale을 크게 주지 않는다                     | fade + shadow only                  |
| Surface    | `floating-sheet` | y `28px` + scale `0.988` + spring `235/28`     | 핵심 quick-add, detail peek, safe-area 위에 뜨는 시트 | 전체 화면을 덮는 풀스크린 시트처럼 움직이지 않는다                | fade + shadow + detent snap only    |
| Gesture    | `drag-follow`    | direct finger tracking + spring settle         | 시트 drag-dismiss, swipe action, pull reveal          | 손가락보다 늦게 따라오는 easing을 쓰지 않는다                     | drag threshold를 줄이고 즉시 snap   |
| Navigation | `mode-page-swap` | x `26px` + spring `305/31` + scale `0.992`     | photo -> sketch -> sentence 같은 전면 모드 전환       | 단순 crossfade만으로 끝내지 않고 전체 표면이 넘어가듯 바뀌게 한다 | opacity crossfade + content replace |
| Feedback   | `list-cascade`   | stagger `30-45ms` + y `14px` settle            | agenda rows, reminder cards, quick add 결과 목록      | 여러 행을 동시에 크게 움직이지 않는다                             | opacity stagger                     |
| Feedback   | `cell-reveal`    | stagger `28-40ms` + y `12px` + spring `390/30` | 모드 전환 후 각 셀/칩/문장 조각 등장                  | 페이지 전체 전환보다 더 과하게 튀지 않게 한다                     | opacity stagger + instant layout    |
| Feedback   | `toast-confirm`  | y `16px` + `180ms` fade/settle                 | 저장 완료, 완료 처리, undo 가능한 snackbar            | 2초 이상 떠 있거나 화면 중심을 가리지 않는다                      | fade only                           |

## 적용 가이드

### 1. 터치 가능한 모든 주요 컨트롤

- `touch-feedback` 사용
- 하단 탭, 날짜 셀, CTA 버튼 모두 같은 press 리듬을 유지
- “버튼마다 다른 눌림감”을 만들지 않는다

### 2. 선택 상태가 움직이는 UI

- `selection-flow` 사용
- 세그먼트, 활성 탭, 선택 날짜는 배경 surface가 이동하는 방식이 우선
- 선택 효과를 깜빡이는 교체 애니메이션으로 구현하지 않는다

### 3. 화면 레벨 전환

- `screen-slide` 사용
- 탭 전환, 월/주/일 뷰 전환, 가벼운 detail push에서 재사용
- travel distance는 24px 전후로 유지

### 4. 바텀시트와 보조 레이어

- `sheet-stack` + `drag-follow` 사용
- 기본 열림은 바닥에서 올라오고, 닫힘은 drag-dismiss를 우선 고려
- 화면 위에 “쌓인 레이어”처럼 느껴져야 한다

### 4-1. 핵심 Floating Bottom Sheet

- `floating-sheet` + `drag-follow` 사용
- safe area 위에 살짝 떠 있는 인상이 나야 한다
- 첫 등장에서는 묵직하게 튀지 말고, 아래에서 안착하듯 올라와야 한다
- dismiss는 enter보다 조금 더 빠르게 닫혀야 한다

### 4-2. Photo -> Sketch -> Sentence 전환

- 전체 표면은 `mode-page-swap` 사용
- 전환이 끝난 뒤 내부 요소는 `cell-reveal`로 후속 등장
- 즉, “표면 전체 교체”와 “셀 단위 등장”을 분리해서 설계해야 한다
- 이 플로우는 단일 crossfade로 끝내면 안 된다

### 5. 결과 피드백

- `list-cascade`와 `toast-confirm` 사용
- 완료/추가 후 전체 화면을 재전환하지 않는다
- 리스트는 제자리에서 정리되고, 토스트는 짧게 확인만 해준다

## 금지 규칙

- width/height/top/left 애니메이션을 기본값처럼 쓰지 않는다.
- bounce가 강한 spring을 일정 관리 표면에 적용하지 않는다.
- 모션만으로 성공/실패/선택 상태를 전달하지 않는다.
- 배경에 상시 움직이는 장식용 애니메이션을 두지 않는다.
- 모바일 핵심 플로우에 데스크톱 hover 중심 토큰을 섞지 않는다.

## 구현 위치

- 공용 토큰: [packages/ui/src/lib/motion.ts](/Users/kimyoukwon/.codex/worktrees/bf8a/toda-calendar/packages/ui/src/lib/motion.ts)
- 전역 Motion 설정: [packages/ui/src/components/motion-provider.tsx](/Users/kimyoukwon/.codex/worktrees/bf8a/toda-calendar/packages/ui/src/components/motion-provider.tsx)
- 모바일 데모 페이지: [apps/web/components/motion-showcase.tsx](/Users/kimyoukwon/.codex/worktrees/bf8a/toda-calendar/apps/web/components/motion-showcase.tsx)

## 기본 선택 규칙

새로운 인터랙션에서 판단이 애매하면 아래 순서로 선택한다.

- 직접 누르는 행동: `touch-feedback`
- 선택 상태 이동: `selection-flow`
- 탭/화면 컨텍스트 전환: `screen-slide`
- 바텀시트/보조 표면: `sheet-stack`
- 핵심 floating bottom sheet: `floating-sheet`
- photo/sketch/sentence 전면 전환: `mode-page-swap`
- 전환 뒤 셀/칩/문장 등장: `cell-reveal`
- 제스처 추적: `drag-follow`
- 리스트 변화: `list-cascade`
- 완료 확인: `toast-confirm`
