# the-court — 개발 규칙 (@workspace/ui-first · Astryx 걷어내는 중)

> 이 앱은 **자체 DS `@workspace/ui`(Base UI + Tailwind v4, Spotify-green 토큰)로 이관 중**이다.
> 원래 Astryx 단독이었으나 브랜치 `the-court/01-rearrange`에서 **페이지별로 Astryx 를 걷어내고 `@workspace/ui`로 재건**한다. layout 이 이미 `@workspace/ui/globals.css`를 로드하고, onboarding·home 은 DS 로 이관됐다. 아직 안 옮긴 화면(chat·트라이얼·다이얼로그 등)은 Astryx 로 남아 **과도기 공존**한다 — Astryx CSS 는 unlayered 라 Tailwind preflight 를 이겨 공존이 안전하다.
> 아래 "import 패턴 / gotchas / 테마 / 컴포넌트 찾기" 중 Astryx 전용 내용은 **아직 안 옮긴 화면용 레거시 참고**다.

## 절대 규칙

1. **@workspace/ui 우선.** 새/이관 UI(버튼·입력·레이아웃·카드·배지·아이콘·다이얼로그·리스트 등)는 `@workspace/ui` 컴포넌트를 먼저 쓴다. 없으면 **`@workspace/ui`에 새로 정의**한다(생짜 `<button>`/`<div>` + CSS 로 다시 만들지 않는다). 손대는 화면은 그 김에 DS 로 옮긴다.
2. **새 Astryx 도입 금지.** 남은 Astryx 는 늘리는 게 아니라 걷어내는 대상. 새 화면·컴포넌트에 `@astryxdesign/*`를 새로 import 하지 않는다.
3. **토큰만 쓴다.** 하드코딩 금지 → DS 시맨틱 유틸(`bg-fill-*`·`text-text-*`·`rounded-*` 등, `@workspace/ui`). 아직 Astryx 인 화면은 Astryx 테마 토큰(`--color-*`·`--spacing-*` 등). `style={{}}` 매직값 지양.

## import 패턴

- 서브패스 named import: `import { Button } from "@astryxdesign/core/Button"`
- 레이아웃: `import { VStack, HStack, Stack, Grid } from "@astryxdesign/core/Layout"`
- 아이콘: `@astryxdesign/core/Icon` (hugeicons 아님)

## 자주 틀리는 것 (gotchas)

- **`Button`·`Badge` 는 `children` 이 아니라 `label` prop.** → `<Button label="저장" variant="primary" size="lg" />`
- `Heading` 은 `level={1..6}` 필수, 큰 제목은 `type="display-1|2|3"`.
- 정렬·간격은 Stack 의 `align`/`justify`/`gap`(spacing 토큰)으로. div+flex 새로 짜지 말 것.
- `Button` variant: `primary|secondary|ghost|destructive` · `Badge` variant: `neutral|success|error|warning|info|blue|…`

## 테마 — the_court_theme

- 정의: `the-court-theme.ts` (`defineTheme` — 골드 accent `#DCCA04`, Outfit 폰트, `tokens`+`components` 오버라이드).
- 적용: `app/providers.tsx` 의 `<Theme theme={the_court_themeTheme} mode="dark">`.
- 라이트/다크: `light-dark()` 토큰. 모드 바꾸려면 `providers.tsx` 의 `mode` 와 `layout.tsx` 의 `<html data-theme>` 를 함께.
- **CLI 빌드 없이 런타임 주입**(`<Theme>` 가 `<style>` 삽입). 프로덕션에서 초기 flash 없애려면 나중에 Node ≥22.13 에서 `npx astryx theme build` 로 CSS 프리컴파일.

## 컴포넌트 찾기 (discovery)

- 전체 목록: `node_modules/@astryxdesign/core/package.json` 의 `exports` 키.
- 문서: https://astryx.atmeta.com/docs
- MCP(컴포넌트 검색·props 조회): 세션에 붙이려면 →
  `claude mcp add --transport http astryx https://astryx.atmeta.com/mcp`
  붙이면 `search()`/`get()` 으로 컴포넌트·props 를 조회할 수 있다.
- 있는 컴포넌트(발췌): Button, IconButton, Text, Heading, Badge, Card, ClickableCard, Dialog, AlertDialog, Popover, Overlay, Layer, MobileNav, TopNav, SideNav, **Chat**, TextInput, TextArea, NumberInput, DateInput, SegmentedControl, Switch, CheckboxList, RadioList, Selector, MultiSelector, List, Item, Table, Banner, Toast, Tooltip, Spinner, Skeleton, Avatar, AvatarGroup, Divider, ProgressBar, Slider, Stack/HStack/VStack, Grid, Center, Section, Layout, AppShell …

## 이 앱의 빈틈

- **전용 `BottomSheet` 없음** → 바텀시트(사건등록·목격·사건목록)는 `Dialog`/`Overlay`/`Layer` 위에 커스텀. (맥락: `~/vault/projects/the-court/domain/screen-map.md`)

## 작업 방식 (속도 우선)

- 흐름: **plan → 빠르게 개발 → commit.** 매 작업 이 순서로 돈다.
- 병렬 진행이라 커밋이 서로 겹칠 수 있다. **겹쳐도 상관없이 그냥 커밋한다.**
- **안정성보다 속도가 훨씬 중요.** 완벽한 정리·충돌 회피보다 빠른 산출을 택한다.

## 로컬 실행

- `PORT=3100 pnpm --filter the-court dev` → http://localhost:3100
- 검증: `pnpm --filter the-court typecheck`
