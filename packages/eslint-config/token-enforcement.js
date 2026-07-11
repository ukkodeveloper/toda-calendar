/**
 * Token enforcement — design-system 헌법 규칙1·2를 기계로 강제한다.
 * (출처: ~/vault/kb/design-system/enforcement-rules.md)
 *
 * 규칙1: 하드코딩 색 금지 — hex/rgb/hsl/oklch 리터럴, Tailwind 임의색(`bg-[#...]`·`text-[rgb(...)]`).
 * 규칙2: 매직넘버 금지 — 간격·radius·폰트크기 임의값(`p-[13px]`·`rounded-[5px]`·`text-[0.93rem]`).
 *
 * 대상: 컴포넌트·앱 `.tsx` 의 className 문자열(모든 string Literal).
 * 예외(막지 않음): 뷰포트·비율·기하 제약 — em/dvh/vh/vw/%/함수(min·max·calc·clamp·env·var),
 * 그리고 레이아웃 컨테이너/아이콘 geometry 로서의 rem(max-w/w/h/size). 색·간격 매직넘버만 막는다.
 *
 * .css 토큰 정의 파일은 문자열 리터럴이 아니라 자연히 대상 밖(거긴 hex 가 정당).
 *
 * 심각도: 규칙은 error 로 선언하나, 레포 공통 lint 는 eslint-plugin-only-warn 이
 * 전역으로 warning 으로 낮춘다(dev 친화 — 위반을 막지 않고 드러낸다).
 * 하드 게이트는 소비 패키지의 lint 스크립트에서 `--max-warnings 0` 로 건다
 * (예: @workspace/ui 는 src 한정 strict lint). 데모·쇼케이스·아직 이관 중인 앱
 * 코드는 advisory 로 남겨 S4c 범위 밖 작업을 깨지 않는다.
 */

// --- 규칙1: 색 리터럴 ---------------------------------------------------------

// className 안 임의색 유틸: (bg|text|border|...)-[#... | rgb(... | hsl(... | oklch(... ]
const ARBITRARY_COLOR =
  "(?:bg|text|border|fill|stroke|ring|from|via|to|shadow|outline|decoration|accent|caret|divide|ring-offset)-\\[(?:#[0-9a-fA-F]{3,8}|(?:rgba?|hsla?|oklch|oklab|hwb|lab|lch|color)\\()[^\\]]*\\]"

// 문자열 어디든 등장하는 날 hex 색 리터럴 (#fff·#ff3b30·#08090a 등, 6/3/4/8 자리).
// 앞이 & 아닌 경계로 CSS 셀렉터(#id)·해시 경로 오탐을 줄이고, 색으로 쓰이는 3/4/6/8자리만.
const RAW_HEX =
  "#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\\b"

// --- 규칙2: 매직넘버(간격·radius·폰트크기) ------------------------------------

// 막을 프리픽스: padding/margin/gap/radius/font-size/line-height/letter-spacing/space/inset.
// 통과할 프리픽스(geometry): w/h/size/min-w/max-w/min-h/max-h/basis/top/right/bottom/left → rem 허용.
const SPACING_PREFIX =
  "(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|gap|gap-x|gap-y|rounded|rounded-[a-z]+|text|leading|tracking|space-x|space-y|inset|inset-x|inset-y|indent|scroll-p[a-z]*|scroll-m[a-z]*)"

// 위 프리픽스 + 임의값이 날 px/rem 또는 unitless 숫자면 매직넘버. em/%/dvh/vh/vw/함수/var 는 제외.
const MAGIC_SPACING = SPACING_PREFIX + "-\\[[+-]?[0-9]*\\.?[0-9]+(?:px|rem)?\\]"

/**
 * esquery 는 value 정규식 매칭에 대소문자 플래그를 못 주므로, 케이스는 문자클래스로 이미 처리했다.
 * Literal · TemplateElement(백틱 className) 양쪽을 잡는다.
 */
function selectors(pattern) {
  return [
    `Literal[value=/${pattern}/]`,
    `TemplateElement[value.raw=/${pattern}/]`,
  ]
}

const messages = {
  arbitraryColor:
    "규칙1 위반 — Tailwind 임의색(예: bg-[#...]/text-[rgb(...)]) 금지. semantic 토큰 유틸(bg-fill-brand 등)로 교체.",
  rawHex:
    "규칙1 위반 — 하드코딩 색(hex/rgb/hsl) 금지. semantic 토큰/CSS 변수로 교체.",
  magicSpacing:
    "규칙2 위반 — 간격·radius·폰트크기 매직넘버(예: p-[13px]/rounded-[5px]/text-[0.93rem]) 금지. 토큰 스케일(p-3, rounded-pill, text-label 등)로 교체. (뷰포트·비율·아이콘 기하 제약은 허용)",
}

/** @type {import("eslint").Linter.Config} */
export const tokenEnforcement = {
  files: ["**/*.tsx"],
  ignores: [
    // 토큰 정의·데모 토큰은 예외 (거긴 hex 가 정당). CSS 는 애초에 대상 아님이나 명시.
    "**/*-tokens.css",
    "**/globals.css",
    // 디자인 시스템 쇼케이스·데모는 export 되는 라이브러리가 아니다 — 강제 대상 밖.
    // (임의값으로 스케일을 시연하는 게 목적. 라이브러리는 src/components 만.)
    "**/app/design-system/**",
    "**/features/design-system/**",
    "**/*-demo.tsx",
  ],
  rules: {
    "no-restricted-syntax": [
      "error",
      ...selectors(ARBITRARY_COLOR).map((selector) => ({
        selector,
        message: messages.arbitraryColor,
      })),
      ...selectors(RAW_HEX).map((selector) => ({
        selector,
        message: messages.rawHex,
      })),
      ...selectors(MAGIC_SPACING).map((selector) => ({
        selector,
        message: messages.magicSpacing,
      })),
    ],
  },
}
