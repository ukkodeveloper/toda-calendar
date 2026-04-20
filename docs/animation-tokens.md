# Toda Calendar Animation Tokens Reference

## 목적

이 문서는 Toda 캘린더의 애니메이션 토큰을 구현 관점에서 빠르게 참조하기 위한 문서다.

- 어떤 토큰이 어떤 상황에 쓰이는지
- 어떤 helper API로 연결되는지
- Apple-like restraint + Toss-like responsiveness를 유지하려면 무엇을 지켜야 하는지

시스템 전체 철학은 [motion-system.md](./motion-system.md)에서 보고, 실제 토큰 선택과 구현은 이 문서를 기준으로 본다.

## Token Index

| Token | Intent | Primary usage | Helper API | Reduced Motion |
| ----- | ------ | ------------- | ---------- | -------------- |
| `touch-feedback` | 눌림감 전달 | 날짜 셀, 아이콘 버튼, CTA, 하단 탭 | `motionTokens.spring.touch` | scale 제거, 색/opacity만 유지 |
| `selection-flow` | 선택 상태 이동 | 활성 탭, 필터 칩, 선택 날짜, 세그먼트 | `motionTokens.spring.selection` | crossfade 하이라이트 |
| `screen-slide` | 가벼운 컨텍스트 전환 | 탭 전환, 캘린더 뷰 전환, 경량 push | `getScreenSlideVariants()` | opacity crossfade |
| `sheet-stack` | 일반 보조 시트 | day detail, composer, 패널 | `getSheetStackVariants()` | fade + shadow only |
| `floating-sheet` | 핵심 floating bottom sheet | quick add, detail peek, 중요 액션 시트 | `getFloatingSheetVariants()` | fade + shadow + detent snap |
| `drag-follow` | 손가락 추적 | drag-dismiss, swipe action, pull reveal | `motionTokens.spring.drag` | threshold 축소 + 즉시 snap |
| `mode-page-swap` | 전면 모드 교체 | photo -> sketch -> sentence, full-surface swap | `getModePageSwapVariants()` | opacity replace |
| `list-cascade` | 결과 목록 정리 | agenda rows, reminder cards, 생성 결과 목록 | `getListContainerVariants()` + `getListItemVariants()` | opacity stagger |
| `cell-reveal` | 2차 내용 등장 | 모드 교체 뒤 칩, 셀, 문장 조각 등장 | `getCellRevealContainerVariants()` + `getCellRevealItemVariants()` | opacity stagger |
| `toast-confirm` | 짧은 확인 피드백 | 저장 완료, undo snackbar, 완료 처리 | `getToastVariants()` | fade only |

## Shared Source

토큰의 단일 소스는 아래 두 곳이다.

- 구현 값: [packages/ui/src/lib/motion.ts](../packages/ui/src/lib/motion.ts)
- 전역 모션 정책: [packages/ui/src/components/motion-provider.tsx](../packages/ui/src/components/motion-provider.tsx)

새 토큰을 추가할 때는 개별 컴포넌트 안에서 먼저 만들지 말고 `motion.ts`에 이름, 값, helper를 함께 추가한다.

## Token Anatomy

현재 토큰은 아래 네 층으로 나뉜다.

| Layer | What it controls | Example |
| ----- | ---------------- | ------- |
| `duration` | 시간 길이 | `modeSwap`, `floatingSheet` |
| `spring` | 물리감과 settle 리듬 | `touch`, `selection`, `drag` |
| `distance` | 이동 거리 | `screen`, `mode`, `floatingSheet`, `cell` |
| `transition` | 비-spring 전환 | `fade`, `navigationExit`, `toast` |

즉, 새로운 토큰을 설계할 때는 이름만 만드는 것이 아니라 아래 네 가지를 같이 판단해야 한다.

1. 어떤 계층의 인터랙션인지
2. 이동 거리가 필요한지
3. spring이 필요한지 아니면 fade가 맞는지
4. reduced motion에서 무엇을 남길지

## Selection Guide

새 인터랙션이 생기면 아래 순서로 먼저 분류한다.

1. 직접 누르는 행동이면 `touch-feedback`
2. 선택 상태가 이동하면 `selection-flow`
3. 화면 맥락이 바뀌면 `screen-slide`
4. 보조 표면이 열리면 `sheet-stack`
5. 핵심 시트가 safe area 위에 떠야 하면 `floating-sheet`
6. 손가락을 직접 따라가야 하면 `drag-follow`
7. 화면 전체 표현 모드가 바뀌면 `mode-page-swap`
8. 전환 뒤 내부 항목이 순차 등장하면 `cell-reveal`
9. 목록이 정리되듯 갱신되면 `list-cascade`
10. 짧은 성공 피드백이면 `toast-confirm`

## Detailed Rules

### `touch-feedback`

- 목적: 터치 성공 여부를 거의 즉시 느끼게 한다.
- 느낌: 짧고 조용한 눌림감
- 쓰는 곳: 날짜 셀, 작은 아이콘 버튼, CTA, 하단 탭
- 금지: y 이동, glow, 회전 효과를 함께 쓰지 않는다.

### `selection-flow`

- 목적: 선택 상태가 "교체"되는 것이 아니라 "이동"된다고 느끼게 한다.
- 느낌: 안정적인 active surface 이동
- 쓰는 곳: 세그먼트, 필터 칩, 선택 날짜
- 금지: 배경 surface remount, 깜빡이는 on/off 전환

### `screen-slide`

- 목적: 같은 정보 축 안에서 뷰만 바뀌는 느낌을 만든다.
- 느낌: 짧은 수평 이동과 낮은 scale 변화
- 쓰는 곳: 탭 전환, 월/주/일 뷰 전환
- 금지: 큰 travel distance, page-like dramatic push

### `sheet-stack`

- 목적: 현재 화면 위에 보조 레이어가 쌓이는 느낌을 만든다.
- 느낌: 올라오되 과하게 커지지 않는 시트
- 쓰는 곳: 일반 day detail, filter panel, lightweight composer
- 금지: 중앙 모달처럼 보이게 큰 scale을 넣는 것

### `floating-sheet`

- 목적: 핵심 액션을 담은 바텀시트를 safe area 위에 살짝 띄운다.
- 느낌: 무게감은 있으나 과시적이지 않은 안착
- 쓰는 곳: quick add, 중요 편집, detail peek
- 금지: 풀스크린 전환처럼 보이게 만드는 것

### `drag-follow`

- 목적: 손가락과 표면의 결합감을 만든다.
- 느낌: 즉각적인 추적, release 후 짧은 settle
- 쓰는 곳: drag-dismiss, swipe action, pull reveal
- 금지: 손가락보다 늦게 따라오는 easing

### `mode-page-swap`

- 목적: 앱 내부에서 표현 모드 전체가 넘어가듯 바뀌게 한다.
- 느낌: 페이지를 넘기듯 표면 전체가 교체됨
- 쓰는 곳: `photo -> sketch -> sentence` 같은 전면 모드 전환
- 금지: 단순 crossfade만으로 끝내는 것

### `list-cascade`

- 목적: 새 결과가 정리되듯 자연스럽게 들어오게 한다.
- 느낌: 짧은 stagger와 얕은 settle
- 쓰는 곳: agenda row, reminder card, 결과 목록
- 금지: 모든 행을 동시에 크게 움직이는 것

### `cell-reveal`

- 목적: 모드 전환 이후 내부 단위를 순차적으로 소개한다.
- 느낌: 주연이 아닌 후속 등장
- 쓰는 곳: 셀, 칩, 짧은 문장, 상태 조각
- 금지: 페이지 전환보다 더 튀는 움직임

### `toast-confirm`

- 목적: 상태가 반영되었다는 사실만 짧게 확인시킨다.
- 느낌: 가볍고 빠른 settle
- 쓰는 곳: 저장, 완료, undo
- 금지: 오래 머무르거나 화면 중심을 가리는 것

## Key Recipes

### 1. Floating Bottom Sheet

사용 토큰:

- `floating-sheet`
- `drag-follow`
- backdrop fade

추천 리듬:

1. backdrop가 먼저 깔린다
2. sheet가 아래에서 짧게 올라온다
3. drag 중에는 손가락을 직접 따른다
4. 닫힐 때는 열릴 때보다 조금 더 빠르게 사라진다

이 조합은 "새 페이지 진입"보다 "현재 맥락 위의 중요한 레이어"에 가깝게 보여야 한다.

### 2. Photo -> Sketch -> Sentence

사용 토큰:

- `mode-page-swap`
- `cell-reveal`

추천 리듬:

1. 전체 표면이 먼저 바뀐다
2. 내부 셀 또는 내용 조각이 짧은 stagger로 등장한다
3. 다음 단계로 갈수록 내용 구조는 더 선명해지고, 모션은 더 조용해진다

핵심은 "전면 교체"와 "내부 등장"을 분리하는 것이다.

## Naming Rule

새 토큰 이름은 아래 형식을 우선 따른다.

- 동작 의도 중심으로 짓는다
- 컴포넌트 이름보다 인터랙션 역할을 우선한다
- 한 토큰은 한 가지 리듬만 담당한다

좋은 예:

- `floating-sheet`
- `selection-flow`
- `toast-confirm`

피해야 할 예:

- `calendar-modal-open`
- `blue-tab-active`
- `fun-bounce`

## Change Checklist

토큰을 추가하거나 수정할 때는 아래를 같이 바꾼다.

1. `packages/ui/src/lib/motion.ts`의 값
2. helper variant 함수 또는 공용 export
3. `mobileMotionTable`
4. 데모 페이지 [apps/web/components/motion-showcase.tsx](../apps/web/components/motion-showcase.tsx)
5. 이 문서와 [motion-system.md](./motion-system.md)

## Guardrails

- 일정 관리 UI에서 강한 bounce를 기본값으로 쓰지 않는다.
- width, height, top, left를 기본 애니메이션 축으로 삼지 않는다.
- hover 중심 토큰을 모바일 핵심 플로우에 섞지 않는다.
- 토큰 없이 컴포넌트별 bespoke easing을 늘리지 않는다.
- reduced motion 대체안을 나중으로 미루지 않는다.
