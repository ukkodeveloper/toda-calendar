"use client"

import * as React from "react"

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"

import {
  ActionGrid,
  type ActionGridItem,
} from "@workspace/ui/components/action-grid"
import { AnimatedNumber } from "@workspace/ui/components/animated-number"
import { AppBar } from "@workspace/ui/components/app-bar"
import { Avatar } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { BottomSheet } from "@workspace/ui/components/bottom-sheet"
import { Button } from "@workspace/ui/components/button"
import { ChatBubble } from "@workspace/ui/components/chat-bubble"
import {
  CalendarPreview,
  type CalendarPreviewDay,
} from "@workspace/ui/components/calendar-preview"
import { Cluster } from "@workspace/ui/components/cluster"
import { Divider } from "@workspace/ui/components/divider"
import { FloatingActionButton } from "@workspace/ui/components/floating-action-button"
import { FormatFilter } from "@workspace/ui/components/format-filter"
import { Grid } from "@workspace/ui/components/grid"
import { IconButton } from "@workspace/ui/components/icon-button"
import { ListItem } from "@workspace/ui/components/list-item"
import { MessageInput } from "@workspace/ui/components/message-input"
import { NoticeBanner } from "@workspace/ui/components/notice-banner"
import { PageHeader } from "@workspace/ui/components/page-header"
import { PillTabs } from "@workspace/ui/components/pill-tabs"
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@workspace/ui/components/segmented-control"
import { SpacingScale } from "@workspace/ui/components/spacing-scale"
import { Stack } from "@workspace/ui/components/stack"
import { Surface } from "@workspace/ui/components/surface"
import { SwitchControl } from "@workspace/ui/components/switch-control"
import {
  ThreeStageSheetPreview,
  type SheetStage,
} from "@workspace/ui/components/three-stage-sheet-preview"
import { Text } from "@workspace/ui/components/text"
import { TokenSwatch } from "@workspace/ui/components/token-swatch"
import { ValueCard } from "@workspace/ui/components/value-card"
import { todaDesignSystem } from "@workspace/ui/lib/design-system"
import { motionTokens } from "@workspace/ui/lib/motion"
import { cn } from "@workspace/ui/lib/utils"

type ComponentId =
  | "typography"
  | "spacing"
  | "color"
  | "stack"
  | "cluster"
  | "grid"
  | "divider"
  | "badge"
  | "avatar"
  | "app-bar"
  | "page-header"
  | "pill-tabs"
  | "notice-banner"
  | "list-item"
  | "value-card"
  | "animated-number"
  | "action-grid"
  | "floating-action-button"
  | "chat-bubble"
  | "message-input"
  | "button"
  | "icon-button"
  | "segmented-control"
  | "switch-control"
  | "surface"
  | "bottom-sheet"
  | "calendar-preview"
  | "menu-checkbox"
  | "three-stage-sheet"
  | "example-pages"

type ComponentStatus = "사용 가능" | "초안" | "패턴" | "토큰"
type ComponentCategory =
  | "Foundation"
  | "Navigation"
  | "Feedback"
  | "Data Display"
  | "Actions"
  | "Communication"
  | "Surfaces"
  | "Patterns"
  | "Examples"
type DesignNavSection = "foundations" | "components" | "patterns" | "examples"

type ComponentItem = {
  id: ComponentId
  category: ComponentCategory
  description: string
  status: ComponentStatus
  title: string
  variantAxes: string[]
}

const componentItems: ComponentItem[] = [
  {
    id: "typography",
    category: "Foundation",
    description: "모바일에서 먼저 읽히는 텍스트 역할과 톤입니다.",
    status: "토큰",
    title: "Typography",
    variantAxes: ["variant", "tone", "align"],
  },
  {
    id: "spacing",
    category: "Foundation",
    description: "손가락 터치와 작은 화면을 기준으로 잡은 간격 토큰입니다.",
    status: "토큰",
    title: "Spacing",
    variantAxes: ["scale"],
  },
  {
    id: "color",
    category: "Foundation",
    description: "표면, 의미 색상, 상태 피드백에 쓰는 색상 토큰입니다.",
    status: "토큰",
    title: "Color",
    variantAxes: ["role", "tone"],
  },
  {
    id: "stack",
    category: "Foundation",
    description: "세로 흐름을 만드는 레이아웃 프리미티브입니다.",
    status: "사용 가능",
    title: "Stack",
    variantAxes: ["gap", "align"],
  },
  {
    id: "cluster",
    category: "Foundation",
    description:
      "가로 버튼 묶음, 칩 그룹, 보조 정보를 감싸는 프리미티브입니다.",
    status: "사용 가능",
    title: "Cluster",
    variantAxes: ["gap", "align", "justify"],
  },
  {
    id: "grid",
    category: "Foundation",
    description: "모바일 카드와 토큰을 안정적으로 나누는 그리드입니다.",
    status: "사용 가능",
    title: "Grid",
    variantAxes: ["columns", "gap"],
  },
  {
    id: "divider",
    category: "Foundation",
    description: "정보 그룹 사이를 조용히 나누는 구분선입니다.",
    status: "사용 가능",
    title: "Divider",
    variantAxes: ["orientation", "inset"],
  },
  {
    id: "badge",
    category: "Foundation",
    description: "상태와 짧은 메타 정보를 표현하는 라벨입니다.",
    status: "사용 가능",
    title: "Badge",
    variantAxes: ["tone", "size"],
  },
  {
    id: "avatar",
    category: "Foundation",
    description: "프로필, 아이콘 자리, 썸네일을 같은 크기 체계로 다룹니다.",
    status: "사용 가능",
    title: "Avatar",
    variantAxes: ["size", "shape", "tone"],
  },
  {
    id: "app-bar",
    category: "Navigation",
    description:
      "큰 타이틀, 중앙 타이틀, 뒤로가기와 도구 버튼을 담는 상단 바입니다.",
    status: "사용 가능",
    title: "AppBar",
    variantAxes: ["size", "align", "accessory"],
  },
  {
    id: "page-header",
    category: "Navigation",
    description:
      "화면별 대표 제목, 인라인 메타, 우측 도구를 묶는 상단 헤더입니다.",
    status: "사용 가능",
    title: "PageHeader",
    variantAxes: ["size", "align", "meta", "accessory"],
  },
  {
    id: "pill-tabs",
    category: "Navigation",
    description: "상단 텍스트 탭과 필터 칩을 같은 선택 모델로 다룹니다.",
    status: "사용 가능",
    title: "PillTabs",
    variantAxes: ["variant", "size", "state", "badge"],
  },
  {
    id: "notice-banner",
    category: "Feedback",
    description:
      "공지, 안내, 권한 요청을 한 줄 또는 두 줄로 보여주는 배너입니다.",
    status: "사용 가능",
    title: "NoticeBanner",
    variantAxes: ["tone", "size", "accessory"],
  },
  {
    id: "list-item",
    category: "Data Display",
    description: "메뉴, 채팅 목록, 피드 목록까지 커버하는 기본 행입니다.",
    status: "사용 가능",
    title: "ListItem",
    variantAxes: ["density", "leading", "meta", "trailing"],
  },
  {
    id: "value-card",
    category: "Data Display",
    description: "라벨, 값, 보조 설명을 중립 슬롯으로 담는 값 카드입니다.",
    status: "사용 가능",
    title: "ValueCard",
    variantAxes: ["size", "tone", "slot"],
  },
  {
    id: "animated-number",
    category: "Data Display",
    description: "금액, 카운트, 지표 숫자를 자릿수별 롤링 모션으로 표시합니다.",
    status: "사용 가능",
    title: "AnimatedNumber",
    variantAxes: ["value", "format", "motion"],
  },
  {
    id: "action-grid",
    category: "Data Display",
    description: "서비스 바로가기와 기능 모음을 균일한 그리드로 배치합니다.",
    status: "사용 가능",
    title: "ActionGrid",
    variantAxes: ["columns", "gap", "icon"],
  },
  {
    id: "button",
    category: "Actions",
    description: "주요 행동과 보조 행동을 구분하는 기본 버튼입니다.",
    status: "사용 가능",
    title: "Button",
    variantAxes: ["emphasis", "size", "state"],
  },
  {
    id: "icon-button",
    category: "Actions",
    description: "내비게이션과 도구성 행동을 위한 원형 버튼입니다.",
    status: "사용 가능",
    title: "IconButton",
    variantAxes: ["size", "state"],
  },
  {
    id: "segmented-control",
    category: "Actions",
    description: "동일 위계 옵션 중 하나를 고르는 모바일 컨트롤입니다.",
    status: "사용 가능",
    title: "SegmentedControl",
    variantAxes: ["size", "state"],
  },
  {
    id: "switch-control",
    category: "Actions",
    description: "켜짐과 꺼짐을 즉시 전환하는 이진 컨트롤입니다.",
    status: "사용 가능",
    title: "SwitchControl",
    variantAxes: ["size", "state"],
  },
  {
    id: "floating-action-button",
    category: "Actions",
    description: "작성, 추가 같은 화면 위 주요 행동을 엄지 영역에 띄웁니다.",
    status: "사용 가능",
    title: "FloatingActionButton",
    variantAxes: ["size", "tone", "label"],
  },
  {
    id: "chat-bubble",
    category: "Communication",
    description: "수신/발신 메시지와 시간 메타를 표현하는 말풍선입니다.",
    status: "사용 가능",
    title: "ChatBubble",
    variantAxes: ["side", "size", "tone"],
  },
  {
    id: "message-input",
    category: "Communication",
    description: "하단 입력 바와 좌우 액션 슬롯을 제공합니다.",
    status: "사용 가능",
    title: "MessageInput",
    variantAxes: ["size", "leading", "trailing"],
  },
  {
    id: "surface",
    category: "Surfaces",
    description: "캔버스 위에 떠 있는 패널과 눌린 표면의 깊이입니다.",
    status: "사용 가능",
    title: "Surface",
    variantAxes: ["surface", "padding"],
  },
  {
    id: "bottom-sheet",
    category: "Surfaces",
    description: "확인, 안내, 짧은 편집에 쓰는 공통 하단 시트입니다.",
    status: "사용 가능",
    title: "BottomSheet",
    variantAxes: ["open", "scrollable", "footer"],
  },
  {
    id: "calendar-preview",
    category: "Patterns",
    description: "격자, 선택, 오늘, 미리보기 밀도를 검증하는 UI 패턴입니다.",
    status: "초안",
    title: "CalendarPreview",
    variantAxes: ["density", "previewStyle", "state"],
  },
  {
    id: "menu-checkbox",
    category: "Patterns",
    description: "여러 옵션을 켜고 끄는 메뉴형 체크 컨트롤입니다.",
    status: "패턴",
    title: "MenuCheckboxGroup",
    variantAxes: ["selected", "open"],
  },
  {
    id: "three-stage-sheet",
    category: "Patterns",
    description: "컴팩트, 중간, 확장 높이를 오가는 하단 표면 패턴입니다.",
    status: "초안",
    title: "ThreeStageSheet",
    variantAxes: ["stage", "height"],
  },
  {
    id: "example-pages",
    category: "Examples",
    description:
      "이미지 시안 계열의 화면을 디자인 시스템 컴포넌트만으로 조립합니다.",
    status: "패턴",
    title: "ExamplePages",
    variantAxes: ["page", "density", "composition"],
  },
]

const componentGroups: ComponentCategory[] = [
  "Foundation",
  "Navigation",
  "Feedback",
  "Data Display",
  "Actions",
  "Communication",
  "Surfaces",
  "Patterns",
  "Examples",
]

const designNavSections: Array<{
  id: DesignNavSection
  label: string
  mobileLabel: string
  description: string
}> = [
  {
    id: "foundations",
    label: "파운데이션",
    mobileLabel: "기초",
    description: "토큰과 레이아웃 기초",
  },
  {
    id: "components",
    label: "컴포넌트",
    mobileLabel: "컴포넌트",
    description: "재사용 UI",
  },
  {
    id: "patterns",
    label: "패턴",
    mobileLabel: "패턴",
    description: "조립된 상호작용",
  },
  {
    id: "examples",
    label: "예시 페이지",
    mobileLabel: "예시",
    description: "화면 단위 샘플",
  },
]

const componentCategoryLabels: Record<ComponentCategory, string> = {
  Foundation: "기초",
  Navigation: "내비게이션",
  Feedback: "피드백",
  "Data Display": "데이터 표시",
  Actions: "액션",
  Communication: "커뮤니케이션",
  Surfaces: "표면",
  Patterns: "패턴",
  Examples: "예시 화면",
}

const previewDays: CalendarPreviewDay[] = [
  { day: 30, isCurrentMonth: false },
  { day: 31, isCurrentMonth: false },
  { day: 1, isCurrentMonth: true, preview: { style: "wash", label: "샘플 A" } },
  { day: 2, isCurrentMonth: true },
  {
    day: 3,
    isCurrentMonth: true,
    preview: { style: "lines", label: "샘플 B" },
  },
  { day: 4, isCurrentMonth: true },
  {
    day: 5,
    isCurrentMonth: true,
    preview: { style: "stroke", label: "샘플 C" },
  },
  { day: 6, isCurrentMonth: true },
  { day: 7, isCurrentMonth: true, preview: { style: "wash", label: "샘플 D" } },
  { day: 8, isCurrentMonth: true },
  { day: 9, isCurrentMonth: true },
  {
    day: 10,
    isCurrentMonth: true,
    preview: { style: "lines", label: "샘플 E" },
  },
  { day: 11, isCurrentMonth: true },
  { day: 12, isCurrentMonth: true },
  { day: 13, isCurrentMonth: true, isToday: true },
  {
    day: 14,
    isCurrentMonth: true,
    preview: { style: "stroke", label: "샘플 F" },
  },
  { day: 15, isCurrentMonth: true },
  {
    day: 16,
    isCurrentMonth: true,
    isSelected: true,
    preview: { style: "wash", label: "선택 샘플" },
  },
  { day: 17, isCurrentMonth: true },
  {
    day: 18,
    isCurrentMonth: true,
    preview: { style: "lines", label: "샘플 G" },
  },
  { day: 19, isCurrentMonth: true },
  {
    day: 20,
    isCurrentMonth: true,
    preview: { style: "wash", label: "샘플 H" },
  },
  { day: 21, isCurrentMonth: true },
  { day: 22, isCurrentMonth: true },
  {
    day: 23,
    isCurrentMonth: true,
    preview: { style: "stroke", label: "샘플 I" },
  },
  { day: 24, isCurrentMonth: true },
  { day: 25, isCurrentMonth: true },
  {
    day: 26,
    isCurrentMonth: true,
    preview: { style: "lines", label: "샘플 J" },
  },
  { day: 27, isCurrentMonth: true },
  {
    day: 28,
    isCurrentMonth: true,
    preview: { style: "wash", label: "샘플 K" },
  },
  { day: 29, isCurrentMonth: true },
  { day: 30, isCurrentMonth: true },
  { day: 1, isCurrentMonth: false },
  { day: 2, isCurrentMonth: false },
  { day: 3, isCurrentMonth: false },
]

const spacingItems = todaDesignSystem.foundations.spacing.map((item) => ({
  label: item.name,
  token: item.token,
  value: item.value,
}))
const colorItems = todaDesignSystem.foundations.color

const textVariants = ["display", "title", "body", "label", "caption"] as const
const textTones = [
  "primary",
  "secondary",
  "muted",
  "accent",
  "success",
  "danger",
] as const
const textAligns = ["start", "center", "end"] as const
const gaps = ["xs", "sm", "md", "lg", "xl"] as const
const gridGaps = ["xs", "sm", "md", "lg"] as const
const aligns = ["start", "center", "end", "stretch"] as const
const justifies = ["start", "center", "end", "between"] as const
const gridColumns = ["one", "two", "three"] as const
const dividerInsets = ["none", "sm", "md"] as const
const badgeTones = ["neutral", "accent", "success", "danger"] as const
const badgeSizes = ["sm", "md", "lg"] as const
const avatarSizes = ["xs", "sm", "md", "lg", "xl"] as const
const avatarShapes = ["circle", "rounded", "squircle"] as const
const avatarTones = ["neutral", "accent", "success", "danger"] as const
const buttonVariants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
] as const
const buttonSizes = ["sm", "default", "lg"] as const
const appBarSizes = ["compact", "regular", "large"] as const
const appBarAligns = ["start", "center"] as const
const pageHeaderSizes = ["compact", "regular", "large"] as const
const pageHeaderAligns = ["start", "center"] as const
const pillVariants = ["chip", "soft", "text"] as const
const pillSizes = ["sm", "md", "lg"] as const
const bannerTones = ["neutral", "accent", "warning", "success"] as const
const bannerSizes = ["sm", "md", "lg"] as const
const listDensities = ["compact", "regular", "roomy"] as const
const valueCardSizes = ["sm", "md", "lg"] as const
const animatedNumberSamples = [
  "88,888",
  "8,663",
  "27,435.00",
  "43",
  "3,498",
] as const
const actionGridColumns = ["two", "three", "four"] as const
const fabSizes = ["sm", "md", "lg"] as const
const fabTones = ["accent", "neutral", "soft"] as const
const chatSides = ["incoming", "outgoing"] as const
const chatSizes = ["sm", "md", "lg"] as const
const messageInputSizes = ["sm", "md", "lg"] as const
const examplePages = [
  "service-menu",
  "my-dashboard",
  "chat-list",
  "chat-thread",
  "social-dm",
  "calendar-toolbar",
  "commerce-category",
  "store-home",
  "social-feed",
  "finance-home",
  "community-feed",
] as const
const defaultComponentId = "typography" satisfies ComponentId
const defaultExamplePage = "community-feed" satisfies ExamplePage
const foundationComponentIds = [
  "typography",
  "spacing",
  "color",
  "stack",
  "cluster",
  "grid",
  "divider",
  "badge",
  "avatar",
] as const satisfies readonly ComponentId[]
const patternComponentIds = [
  "calendar-preview",
  "menu-checkbox",
  "three-stage-sheet",
] as const satisfies readonly ComponentId[]
const examplePageItems: Record<
  ExamplePage,
  {
    description: string
    title: string
  }
> = {
  "service-menu": {
    title: "서비스 메뉴",
    description: "메뉴, 섹션, 리스트 구조를 확인하는 금융형 서비스 화면입니다.",
  },
  "my-dashboard": {
    title: "마이 대시보드",
    description: "카드형 표면과 바로가기 그리드가 조합된 개인화 홈입니다.",
  },
  "chat-list": {
    title: "채팅 목록",
    description:
      "필터 탭, 공지 배너, 대화 목록이 함께 움직이는 목록 화면입니다.",
  },
  "chat-thread": {
    title: "채팅 상세",
    description: "상단 액션 탭과 메시지 입력 흐름을 확인하는 대화 화면입니다.",
  },
  "social-dm": {
    title: "소셜 DM",
    description:
      "검색, 빈 메시지 상태, 추천 계정, 알림 배너를 조합한 DM 홈입니다.",
  },
  "calendar-toolbar": {
    title: "캘린더 툴바",
    description:
      "월간 달력 구현이 아니라 우측 상단 보기 전환과 multi-select 메뉴를 검증합니다.",
  },
  "commerce-category": {
    title: "커머스 카테고리",
    description: "상단 카테고리 탭, 필터 칩, 상품 그리드 밀도를 확인합니다.",
  },
  "store-home": {
    title: "스토어 홈",
    description: "검색, 프로모션 배너, 바로가기 그리드, 큐레이션을 조합합니다.",
  },
  "social-feed": {
    title: "소셜 피드",
    description: "작성자 행, 미디어 영역, 반응 액션, 하단 탭을 확인합니다.",
  },
  "finance-home": {
    title: "금융 홈",
    description: "헤더 메타, 숫자 애니메이션, 값 카드가 들어간 투자 홈입니다.",
  },
  "community-feed": {
    title: "커뮤니티 피드",
    description:
      "상단 탭, 필터 칩, 피드 목록, 플로팅 액션을 조합한 화면입니다.",
  },
}
const iconSizes = ["sm", "md"] as const
const segmentedSizes = ["sm", "md", "lg"] as const
const switchSizes = ["sm", "md", "lg"] as const
const surfaceVariants = ["floating", "inset", "panel"] as const
const surfacePaddings = ["sm", "md", "lg"] as const
const calendarDensities = ["compact", "comfortable", "spacious"] as const
const previewStyles = ["채움", "선", "줄"] as const
const sheetStages: Array<{ value: SheetStage; label: string }> = [
  { value: "compact", label: "컴팩트" },
  { value: "medium", label: "중간" },
  { value: "expanded", label: "확장" },
]
const segmentOptions: Array<
  SegmentedControlOption<"first" | "second" | "third">
> = [
  { value: "first", label: "첫 번째" },
  { value: "second", label: "두 번째" },
  { value: "third", label: "세 번째" },
]
type PillDemoValue = "all" | "selling" | "buying" | "events"
type CommunitySectionValue = "life" | "club" | "cafe" | "apt"
type CommunityFilterValue = "recommend" | "popular" | "info" | "food"
type ChatActionValue = "gift" | "board" | "schedule" | "challenge"
type CalendarControlValue = "compact" | "stacked" | "details" | "list"
type CommerceCategoryValue = "outer" | "setup" | "innerwear" | "homewear"
type StoreSectionValue = "today" | "curation" | "ranking"

const pillDemoOptions: Array<{
  value: PillDemoValue
  label: string
  dot?: boolean
}> = [
  { value: "all", label: "All" },
  { value: "selling", label: "Selling" },
  { value: "buying", label: "Buying" },
  { value: "events", label: "Events", dot: true },
]
const communitySectionOptions: Array<{
  value: CommunitySectionValue
  label: string
  dot?: boolean
}> = [
  { value: "life", label: "동네생활" },
  { value: "club", label: "모임" },
  { value: "cafe", label: "카페" },
  { value: "apt", label: "아파트", dot: true },
]
const communityFilterOptions: Array<{
  value: CommunityFilterValue
  label: string
}> = [
  { value: "recommend", label: "추천" },
  { value: "popular", label: "인기" },
  { value: "info", label: "생활정보" },
  { value: "food", label: "맛집/음식" },
]
const chatActionOptions: Array<{ value: ChatActionValue; label: string }> = [
  { value: "gift", label: "선물하기" },
  { value: "board", label: "게시판" },
  { value: "schedule", label: "일정" },
  { value: "challenge", label: "챌린지" },
]
const calendarControlOptions: Array<{
  value: CalendarControlValue
  label: string
  description?: string
}> = [
  {
    value: "compact",
    label: "Compact",
    description: "일정 제목을 최소 밀도로 접습니다.",
  },
  {
    value: "stacked",
    label: "Stacked",
    description: "같은 날짜 안의 일정을 층으로 쌓습니다.",
  },
  {
    value: "details",
    label: "Details",
    description: "제목과 시간을 함께 보여줍니다.",
  },
  {
    value: "list",
    label: "List",
    description: "선택한 날짜를 목록으로 전환합니다.",
  },
]
const calendarSegmentOptions: Array<
  SegmentedControlOption<CalendarControlValue>
> = calendarControlOptions.map(({ label, value }) => ({ label, value }))
const commerceCategoryOptions: Array<{
  value: CommerceCategoryValue
  label: string
}> = [
  { value: "outer", label: "아우터" },
  { value: "setup", label: "셋업" },
  { value: "innerwear", label: "이너웨어" },
  { value: "homewear", label: "홈웨어" },
]
const storeSectionOptions: Array<{ value: StoreSectionValue; label: string }> =
  [
    { value: "today", label: "오늘" },
    { value: "curation", label: "큐레이션" },
    { value: "ranking", label: "랭킹" },
  ]
const actionGridItems: ActionGridItem[] = [
  {
    id: "meet",
    label: "Meet ups",
    icon: (
      <Avatar size="sm" shape="rounded">
        M
      </Avatar>
    ),
  },
  {
    id: "market",
    label: "Marketplace",
    icon: (
      <Avatar size="sm" shape="rounded">
        S
      </Avatar>
    ),
  },
  {
    id: "cafe",
    label: "Cafe",
    icon: (
      <Avatar size="sm" shape="rounded">
        C
      </Avatar>
    ),
  },
  {
    id: "jobs",
    label: "Jobs",
    icon: (
      <Avatar size="sm" shape="rounded">
        J
      </Avatar>
    ),
  },
  {
    id: "property",
    label: "Property",
    icon: (
      <Avatar size="sm" shape="rounded">
        P
      </Avatar>
    ),
  },
  {
    id: "walk",
    label: "Walks",
    icon: (
      <Avatar size="sm" shape="rounded">
        W
      </Avatar>
    ),
  },
]
const commerceProducts = [
  {
    brand: "챔피온",
    color: "sage",
    discount: "10%",
    likes: "199",
    name: "라이트웨이트 나일론 윈드브레이커",
    price: "98,100",
  },
  {
    brand: "시에라디자인",
    color: "silver",
    discount: "20%",
    likes: "620",
    name: "마가타 초경량 윈드 자켓",
    price: "175,200",
  },
  {
    brand: "세터",
    color: "black",
    discount: "60%",
    likes: "358",
    name: "로렌 스몰 로고 후드 집업",
    price: "55,600",
  },
  {
    brand: "컬럼비아",
    color: "navy",
    discount: "57%",
    likes: "140",
    name: "남성 클레어몬트 재킷",
    price: "54,830",
  },
  {
    brand: "챔피온",
    color: "mist",
    discount: "15%",
    likes: "280",
    name: "시어 나일론 윈드브레이커",
    price: "92,650",
  },
  {
    brand: "해브해드",
    color: "charcoal",
    discount: "",
    likes: "92",
    name: "City Worker Field Jacket",
    price: "169,000",
  },
]
const storeShortcutItems: ActionGridItem[] = [
  { id: "deal", label: "오늘끝딜", icon: <StoreBadge label="11" tone="red" /> },
  {
    id: "mart",
    label: "컬리N마트",
    icon: <StoreBadge label="N" tone="green" />,
  },
  { id: "look", label: "노크잇", icon: <StoreBadge label="L" tone="coral" /> },
  {
    id: "member",
    label: "멤버십데이",
    icon: <StoreBadge label="3%" tone="blue" />,
  },
  {
    id: "rank",
    label: "스토어랭킹",
    icon: <StoreBadge label="TOP" tone="cream" />,
  },
  {
    id: "travel",
    label: "N여행날딜",
    icon: <StoreBadge label="A" tone="violet" />,
  },
  { id: "ship", label: "N배송", icon: <StoreBadge label="N" tone="teal" /> },
  {
    id: "live",
    label: "쇼핑라이브",
    icon: <StoreBadge label="LIVE" tone="red" />,
  },
]
const examplePageComponentMap: Record<ExamplePage, ComponentId[]> = {
  "service-menu": [
    "page-header",
    "icon-button",
    "list-item",
    "divider",
    "avatar",
    "badge",
  ],
  "my-dashboard": [
    "page-header",
    "notice-banner",
    "surface",
    "action-grid",
    "button",
    "avatar",
  ],
  "chat-list": [
    "page-header",
    "pill-tabs",
    "notice-banner",
    "list-item",
    "avatar",
    "badge",
  ],
  "chat-thread": [
    "page-header",
    "pill-tabs",
    "chat-bubble",
    "message-input",
    "icon-button",
  ],
  "social-dm": [
    "app-bar",
    "action-grid",
    "list-item",
    "avatar",
    "notice-banner",
  ],
  "calendar-toolbar": [
    "app-bar",
    "segmented-control",
    "icon-button",
    "menu-checkbox",
    "surface",
  ],
  "commerce-category": ["page-header", "pill-tabs", "grid", "badge"],
  "store-home": ["app-bar", "action-grid", "pill-tabs", "grid"],
  "social-feed": ["app-bar", "avatar", "icon-button"],
  "finance-home": [
    "page-header",
    "notice-banner",
    "value-card",
    "animated-number",
    "grid",
    "list-item",
    "avatar",
  ],
  "community-feed": [
    "page-header",
    "pill-tabs",
    "list-item",
    "floating-action-button",
    "avatar",
  ],
}

function isComponentId(value: string | undefined): value is ComponentId {
  return Boolean(
    value && componentItems.some((component) => component.id === value)
  )
}

function isExamplePage(value: string | undefined): value is ExamplePage {
  return Boolean(value && examplePages.includes(value as ExamplePage))
}

function isFoundationComponentId(
  componentId: ComponentId
): componentId is (typeof foundationComponentIds)[number] {
  return (foundationComponentIds as readonly ComponentId[]).includes(
    componentId
  )
}

function isPatternComponentId(
  componentId: ComponentId
): componentId is (typeof patternComponentIds)[number] {
  return (patternComponentIds as readonly ComponentId[]).includes(componentId)
}

function getComponentSection(componentId: ComponentId): DesignNavSection {
  if (componentId === "example-pages") {
    return "examples"
  }

  if (isFoundationComponentId(componentId)) {
    return "foundations"
  }

  if (isPatternComponentId(componentId)) {
    return "patterns"
  }

  return "components"
}

function getRouteState(routeSegments: string[]): {
  componentId: ComponentId
  examplePage: ExamplePage
  section: DesignNavSection
} {
  const [scope, value] = routeSegments

  if (scope === "examples" && !value) {
    return {
      componentId: "example-pages",
      examplePage: defaultExamplePage,
      section: "examples",
    }
  }

  if (scope === "examples" && isExamplePage(value)) {
    return {
      componentId: "example-pages",
      examplePage: value,
      section: "examples",
    }
  }

  if (scope === "foundations" && !value) {
    return {
      ...getSectionDefaultTarget("foundations"),
      section: "foundations",
    }
  }

  if (scope === "components" && !value) {
    return {
      ...getSectionDefaultTarget("components"),
      section: "components",
    }
  }

  if (scope === "patterns" && !value) {
    return {
      ...getSectionDefaultTarget("patterns"),
      section: "patterns",
    }
  }

  if (
    (scope === "components" ||
      scope === "foundations" ||
      scope === "patterns") &&
    isComponentId(value)
  ) {
    const section = getComponentSection(value)

    return {
      componentId: value,
      examplePage: defaultExamplePage,
      section,
    }
  }

  return {
    componentId: defaultComponentId,
    examplePage: defaultExamplePage,
    section: getComponentSection(defaultComponentId),
  }
}

function getDesignSystemPath(
  componentId: ComponentId,
  examplePage: ExamplePage
) {
  if (componentId === "example-pages") {
    return `/design-system/examples/${examplePage}`
  }

  const section = getComponentSection(componentId)

  if (section === "foundations") {
    return `/design-system/foundations/${componentId}`
  }

  if (section === "patterns") {
    return `/design-system/patterns/${componentId}`
  }

  return `/design-system/components/${componentId}`
}

function getComponentItem(componentId: ComponentId) {
  return componentItems.find((component) => component.id === componentId)
}

function getSectionDefaultTarget(section: DesignNavSection): {
  componentId: ComponentId
  examplePage: ExamplePage
} {
  if (section === "foundations") {
    return {
      componentId: "typography" satisfies ComponentId,
      examplePage: defaultExamplePage,
    }
  }

  if (section === "patterns") {
    return {
      componentId: "calendar-preview" satisfies ComponentId,
      examplePage: defaultExamplePage,
    }
  }

  if (section === "examples") {
    return {
      componentId: "example-pages" satisfies ComponentId,
      examplePage: defaultExamplePage,
    }
  }

  return {
    componentId: "page-header" satisfies ComponentId,
    examplePage: defaultExamplePage,
  }
}

function getExamplePageDisplay(examplePage: ExamplePage): ComponentItem {
  const item = examplePageItems[examplePage]

  return {
    id: "example-pages",
    category: "Examples",
    description: item.description,
    status: "패턴",
    title: item.title,
    variantAxes: ["page", "interaction", "composition"],
  }
}

const screenVariants = {
  enter: {
    opacity: 0,
    y: 10,
    scale: 0.985,
  },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.992,
  },
}

const listVariants = {
  enter: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
  },
}

const listItemVariants = {
  enter: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: 5,
  },
}

type TextVariant = (typeof textVariants)[number]
type TextTone = (typeof textTones)[number]
type TextAlign = (typeof textAligns)[number]
type Gap = (typeof gaps)[number]
type GridGap = (typeof gridGaps)[number]
type Align = (typeof aligns)[number]
type Justify = (typeof justifies)[number]
type GridColumns = (typeof gridColumns)[number]
type DividerInset = (typeof dividerInsets)[number]
type BadgeTone = (typeof badgeTones)[number]
type BadgeSize = (typeof badgeSizes)[number]
type AvatarSize = (typeof avatarSizes)[number]
type AvatarShape = (typeof avatarShapes)[number]
type AvatarTone = (typeof avatarTones)[number]
type AppBarSize = (typeof appBarSizes)[number]
type AppBarAlign = (typeof appBarAligns)[number]
type PageHeaderSize = (typeof pageHeaderSizes)[number]
type PageHeaderAlign = (typeof pageHeaderAligns)[number]
type PillVariant = (typeof pillVariants)[number]
type PillSize = (typeof pillSizes)[number]
type BannerTone = (typeof bannerTones)[number]
type BannerSize = (typeof bannerSizes)[number]
type ListDensity = (typeof listDensities)[number]
type ValueCardSize = (typeof valueCardSizes)[number]
type AnimatedNumberSample = (typeof animatedNumberSamples)[number]
type ActionGridColumns = (typeof actionGridColumns)[number]
type FabSize = (typeof fabSizes)[number]
type FabTone = (typeof fabTones)[number]
type ChatSide = (typeof chatSides)[number]
type ChatSize = (typeof chatSizes)[number]
type MessageInputSize = (typeof messageInputSizes)[number]
type ExamplePage = (typeof examplePages)[number]
type ButtonVariant = NonNullable<React.ComponentProps<typeof Button>["variant"]>
type ButtonSize = NonNullable<React.ComponentProps<typeof Button>["size"]>
type SurfaceVariant = NonNullable<
  React.ComponentProps<typeof Surface>["variant"]
>
type SurfacePadding = NonNullable<
  React.ComponentProps<typeof Surface>["padding"]
>
type CalendarDensity = NonNullable<
  React.ComponentProps<typeof CalendarPreview>["density"]
>

type DesignSystemDemoProps = {
  routeSegments?: string[]
}

export function DesignSystemDemo({
  routeSegments = [],
}: DesignSystemDemoProps) {
  const router = useRouter()
  const reducedMotion = useReducedMotion()
  const previewScrollRef = React.useRef<HTMLElement | null>(null)
  const routeKey = routeSegments.join("/")
  const routedState = React.useMemo(
    () => getRouteState(routeKey ? routeKey.split("/") : []),
    [routeKey]
  )
  const [activeComponentId, setActiveComponentId] = React.useState<ComponentId>(
    routedState.componentId
  )
  const [activeSection, setActiveSection] = React.useState<DesignNavSection>(
    routedState.section
  )
  const [componentSearch, setComponentSearch] = React.useState("")
  const [textVariant, setTextVariant] = React.useState<TextVariant>("title")
  const [textTone, setTextTone] = React.useState<TextTone>("primary")
  const [textAlign, setTextAlign] = React.useState<TextAlign>("start")
  const [layoutGap, setLayoutGap] = React.useState<Gap>("md")
  const [gridGap, setGridGap] = React.useState<GridGap>("md")
  const [layoutAlign, setLayoutAlign] = React.useState<Align>("stretch")
  const [clusterJustify, setClusterJustify] = React.useState<Justify>("start")
  const [columns, setColumns] = React.useState<GridColumns>("two")
  const [dividerInset, setDividerInset] = React.useState<DividerInset>("none")
  const [badgeTone, setBadgeTone] = React.useState<BadgeTone>("accent")
  const [badgeSize, setBadgeSize] = React.useState<BadgeSize>("md")
  const [avatarSize, setAvatarSize] = React.useState<AvatarSize>("md")
  const [avatarShape, setAvatarShape] = React.useState<AvatarShape>("circle")
  const [avatarTone, setAvatarTone] = React.useState<AvatarTone>("neutral")
  const [appBarSize, setAppBarSize] = React.useState<AppBarSize>("large")
  const [appBarAlign, setAppBarAlign] = React.useState<AppBarAlign>("center")
  const [pageHeaderSize, setPageHeaderSize] =
    React.useState<PageHeaderSize>("large")
  const [pageHeaderAlign, setPageHeaderAlign] =
    React.useState<PageHeaderAlign>("start")
  const [pillVariant, setPillVariant] = React.useState<PillVariant>("chip")
  const [pillSize, setPillSize] = React.useState<PillSize>("md")
  const [pillValue, setPillValue] = React.useState<
    "all" | "selling" | "buying" | "events"
  >("all")
  const [bannerTone, setBannerTone] = React.useState<BannerTone>("warning")
  const [bannerSize, setBannerSize] = React.useState<BannerSize>("md")
  const [listDensity, setListDensity] = React.useState<ListDensity>("regular")
  const [valueCardSize, setValueCardSize] = React.useState<ValueCardSize>("md")
  const [animatedNumberSample, setAnimatedNumberSample] =
    React.useState<AnimatedNumberSample>("88,888")
  const [actionGridColumn, setActionGridColumn] =
    React.useState<ActionGridColumns>("two")
  const [fabSize, setFabSize] = React.useState<FabSize>("md")
  const [fabTone, setFabTone] = React.useState<FabTone>("accent")
  const [chatSide, setChatSide] = React.useState<ChatSide>("outgoing")
  const [chatSize, setChatSize] = React.useState<ChatSize>("md")
  const [messageInputSize, setMessageInputSize] =
    React.useState<MessageInputSize>("md")
  const [examplePage, setExamplePage] = React.useState<ExamplePage>(
    routedState.examplePage
  )
  const [buttonVariant, setButtonVariant] =
    React.useState<ButtonVariant>("default")
  const [buttonSize, setButtonSize] = React.useState<ButtonSize>("default")
  const [buttonDisabled, setButtonDisabled] = React.useState(false)
  const [iconButtonSize, setIconButtonSize] =
    React.useState<(typeof iconSizes)[number]>("md")
  const [segmentedSize, setSegmentedSize] =
    React.useState<(typeof segmentedSizes)[number]>("md")
  const [segmentValue, setSegmentValue] = React.useState<
    "first" | "second" | "third"
  >("first")
  const [switchSize, setSwitchSize] =
    React.useState<(typeof switchSizes)[number]>("md")
  const [switchChecked, setSwitchChecked] = React.useState(true)
  const [surfaceVariant, setSurfaceVariant] =
    React.useState<SurfaceVariant>("panel")
  const [surfacePadding, setSurfacePadding] =
    React.useState<SurfacePadding>("md")
  const [calendarDensity, setCalendarDensity] =
    React.useState<CalendarDensity>("comfortable")
  const [activePreviewStyle, setActivePreviewStyle] =
    React.useState<(typeof previewStyles)[number]>("채움")
  const [activeStage, setActiveStage] = React.useState<SheetStage>("compact")
  const [isBottomSheetOpen, setIsBottomSheetOpen] = React.useState(false)
  const [selectedOptions, setSelectedOptions] = React.useState({
    alpha: true,
    beta: true,
    gamma: false,
  })

  const activeComponent =
    activeComponentId === "example-pages"
      ? getExamplePageDisplay(examplePage)
      : (componentItems.find((item) => item.id === activeComponentId) ??
        componentItems[0]!)

  React.useEffect(() => {
    previewScrollRef.current?.scrollTo({
      top: 0,
      behavior: reducedMotion ? "auto" : "smooth",
    })
  }, [activeComponentId, examplePage, reducedMotion])

  React.useEffect(() => {
    setActiveComponentId(routedState.componentId)
    setExamplePage(routedState.examplePage)
    setActiveSection(routedState.section)
  }, [routedState.componentId, routedState.examplePage, routedState.section])

  function navigateToComponent(componentId: ComponentId) {
    setActiveComponentId(componentId)
    setActiveSection(getComponentSection(componentId))
    router.push(getDesignSystemPath(componentId, examplePage))
  }

  function navigateToExamplePage(nextExamplePage: ExamplePage) {
    setActiveComponentId("example-pages")
    setActiveSection("examples")
    setExamplePage(nextExamplePage)
    router.push(getDesignSystemPath("example-pages", nextExamplePage))
  }

  function navigateToSection(section: DesignNavSection) {
    const target = getSectionDefaultTarget(section)

    setActiveSection(section)
    setActiveComponentId(target.componentId)
    setExamplePage(target.examplePage)
    setComponentSearch("")
    router.push(getDesignSystemPath(target.componentId, target.examplePage))
  }

  function toggleOption(value: keyof typeof selectedOptions) {
    setSelectedOptions((current) => {
      const enabledCount = Object.values(current).filter(Boolean).length

      if (current[value] && enabledCount <= 1) {
        return current
      }

      return { ...current, [value]: !current[value] }
    })
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[var(--ds-surface-inset)] text-foreground">
      <div className="grid min-h-dvh grid-rows-[auto_minmax(0,1fr)]">
        <TopBar activeComponent={activeComponent} />
        <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[13.5rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)_21rem]">
          <ComponentSidebar
            activeComponentId={activeComponentId}
            activeSection={activeSection}
            examplePage={examplePage}
            onSearchChange={setComponentSearch}
            onSelectExample={navigateToExamplePage}
            onSelect={navigateToComponent}
            onSelectSection={navigateToSection}
            searchValue={componentSearch}
          />
          <MobileComponentNav
            activeComponentId={activeComponentId}
            activeSection={activeSection}
            examplePage={examplePage}
            onSelect={navigateToComponent}
            onSelectExample={navigateToExamplePage}
            onSelectSection={navigateToSection}
          />
          <section
            ref={previewScrollRef}
            className="min-h-0 overflow-y-auto bg-[var(--ds-surface-inset)] px-0 py-0 sm:px-3 sm:py-4 lg:px-6 lg:py-5"
          >
            <div className="mx-auto w-full sm:max-w-[28rem]">
              <PreviewCanvas>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={
                      activeComponentId === "example-pages"
                        ? `${activeComponentId}-${examplePage}`
                        : activeComponentId
                    }
                    className="h-full"
                    variants={screenVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={
                      reducedMotion
                        ? { duration: motionTokens.duration.instant }
                        : {
                            duration: motionTokens.duration.emphasis,
                            ease: motionTokens.ease.enter,
                          }
                    }
                  >
                    <PreviewStage
                      activeComponentId={activeComponentId}
                      activePreviewStyle={activePreviewStyle}
                      activeStage={activeStage}
                      actionGridColumn={actionGridColumn}
                      animatedNumberSample={animatedNumberSample}
                      appBarAlign={appBarAlign}
                      appBarSize={appBarSize}
                      avatarShape={avatarShape}
                      avatarSize={avatarSize}
                      avatarTone={avatarTone}
                      badgeSize={badgeSize}
                      badgeTone={badgeTone}
                      bannerSize={bannerSize}
                      bannerTone={bannerTone}
                      buttonDisabled={buttonDisabled}
                      buttonSize={buttonSize}
                      buttonVariant={buttonVariant}
                      calendarDensity={calendarDensity}
                      chatSide={chatSide}
                      chatSize={chatSize}
                      clusterJustify={clusterJustify}
                      columns={columns}
                      dividerInset={dividerInset}
                      examplePage={examplePage}
                      fabSize={fabSize}
                      fabTone={fabTone}
                      gridGap={gridGap}
                      iconButtonSize={iconButtonSize}
                      listDensity={listDensity}
                      layoutAlign={layoutAlign}
                      layoutGap={layoutGap}
                      messageInputSize={messageInputSize}
                      valueCardSize={valueCardSize}
                      onOpenBottomSheet={() => setIsBottomSheetOpen(true)}
                      pageHeaderAlign={pageHeaderAlign}
                      pageHeaderSize={pageHeaderSize}
                      pillSize={pillSize}
                      pillValue={pillValue}
                      pillVariant={pillVariant}
                      segmentValue={segmentValue}
                      segmentedSize={segmentedSize}
                      selectedOptions={selectedOptions}
                      setPillValue={setPillValue}
                      setSegmentValue={setSegmentValue}
                      surfacePadding={surfacePadding}
                      surfaceVariant={surfaceVariant}
                      switchChecked={switchChecked}
                      switchSize={switchSize}
                      setSwitchChecked={setSwitchChecked}
                      textAlign={textAlign}
                      textTone={textTone}
                      textVariant={textVariant}
                      toggleOption={toggleOption}
                    />
                  </motion.div>
                </AnimatePresence>
              </PreviewCanvas>
              <ComponentUsage item={activeComponent} />
            </div>
          </section>
          <ControlsPanel
            activeComponentId={activeComponentId}
            activePreviewStyle={activePreviewStyle}
            activeStage={activeStage}
            actionGridColumn={actionGridColumn}
            animatedNumberSample={animatedNumberSample}
            appBarAlign={appBarAlign}
            appBarSize={appBarSize}
            avatarShape={avatarShape}
            avatarSize={avatarSize}
            avatarTone={avatarTone}
            badgeSize={badgeSize}
            badgeTone={badgeTone}
            bannerSize={bannerSize}
            bannerTone={bannerTone}
            buttonDisabled={buttonDisabled}
            buttonSize={buttonSize}
            buttonVariant={buttonVariant}
            calendarDensity={calendarDensity}
            chatSide={chatSide}
            chatSize={chatSize}
            clusterJustify={clusterJustify}
            columns={columns}
            dividerInset={dividerInset}
            examplePage={examplePage}
            fabSize={fabSize}
            fabTone={fabTone}
            gridGap={gridGap}
            iconButtonSize={iconButtonSize}
            listDensity={listDensity}
            layoutAlign={layoutAlign}
            layoutGap={layoutGap}
            messageInputSize={messageInputSize}
            valueCardSize={valueCardSize}
            onNavigateComponent={navigateToComponent}
            onSelectExamplePage={navigateToExamplePage}
            pillSize={pillSize}
            pillVariant={pillVariant}
            segmentedSize={segmentedSize}
            selectedOptions={selectedOptions}
            setActionGridColumn={setActionGridColumn}
            setActivePreviewStyle={setActivePreviewStyle}
            setActiveStage={setActiveStage}
            setAnimatedNumberSample={setAnimatedNumberSample}
            setAppBarAlign={setAppBarAlign}
            setAppBarSize={setAppBarSize}
            setAvatarShape={setAvatarShape}
            setAvatarSize={setAvatarSize}
            setAvatarTone={setAvatarTone}
            setBadgeSize={setBadgeSize}
            setBadgeTone={setBadgeTone}
            setBannerSize={setBannerSize}
            setBannerTone={setBannerTone}
            setButtonDisabled={setButtonDisabled}
            setButtonSize={setButtonSize}
            setButtonVariant={setButtonVariant}
            setCalendarDensity={setCalendarDensity}
            setChatSide={setChatSide}
            setChatSize={setChatSize}
            setClusterJustify={setClusterJustify}
            setColumns={setColumns}
            setDividerInset={setDividerInset}
            setFabSize={setFabSize}
            setFabTone={setFabTone}
            setGridGap={setGridGap}
            setIconButtonSize={setIconButtonSize}
            setListDensity={setListDensity}
            setLayoutAlign={setLayoutAlign}
            setLayoutGap={setLayoutGap}
            setMessageInputSize={setMessageInputSize}
            setValueCardSize={setValueCardSize}
            setPageHeaderAlign={setPageHeaderAlign}
            setPageHeaderSize={setPageHeaderSize}
            setPillSize={setPillSize}
            setPillVariant={setPillVariant}
            setSegmentedSize={setSegmentedSize}
            setSurfacePadding={setSurfacePadding}
            setSurfaceVariant={setSurfaceVariant}
            setSwitchChecked={setSwitchChecked}
            setSwitchSize={setSwitchSize}
            setTextAlign={setTextAlign}
            setTextTone={setTextTone}
            setTextVariant={setTextVariant}
            surfacePadding={surfacePadding}
            surfaceVariant={surfaceVariant}
            pageHeaderAlign={pageHeaderAlign}
            pageHeaderSize={pageHeaderSize}
            switchChecked={switchChecked}
            switchSize={switchSize}
            textAlign={textAlign}
            textTone={textTone}
            textVariant={textVariant}
            toggleOption={toggleOption}
          />
        </div>
      </div>

      <BottomSheet
        description="공통 BottomSheet는 현재 화면 맥락 위에 임시 표면으로 올라옵니다."
        onOpenChange={setIsBottomSheetOpen}
        open={isBottomSheetOpen}
        title="하단 시트"
        footer={
          <div className="grid gap-2">
            <Button type="button" onClick={() => setIsBottomSheetOpen(false)}>
              확인
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsBottomSheetOpen(false)}
            >
              닫기
            </Button>
          </div>
        }
      >
        <div className="rounded-[22px] bg-background/58 p-4 text-sm leading-6 text-foreground/62">
          시트 안의 콘텐츠는 도메인과 무관하게 제목, 설명, 선택지, 확인 행동으로
          조합할 수 있습니다.
        </div>
      </BottomSheet>
    </main>
  )
}

function TopBar({ activeComponent }: { activeComponent: ComponentItem }) {
  return (
    <header className="border-b border-foreground/[0.08] bg-[var(--surface-panel)] px-4 py-3 backdrop-blur-2xl lg:px-5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.72rem] font-semibold tracking-normal text-foreground/42 uppercase">
            Toda Mobile UI
          </p>
          <h1 className="truncate text-lg font-semibold">
            {activeComponent.title}
          </h1>
        </div>
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <ThemeModeToggle />
          <span className="hidden sm:inline-flex">
            <StatusBadge status={activeComponent.status} />
          </span>
        </div>
      </div>
    </header>
  )
}

function ThemeModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      className="inline-flex size-9 items-center justify-center gap-1.5 rounded-full border border-foreground/[0.08] bg-background/64 text-xs font-semibold text-foreground/70 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]/35 sm:w-auto sm:px-2.5"
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span
        aria-hidden="true"
        className="grid size-5 place-items-center rounded-full bg-foreground/[0.08] text-[0.72rem]"
      >
        {isDark ? "D" : "L"}
      </span>
      <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
    </button>
  )
}

function ComponentSidebar({
  activeComponentId,
  activeSection,
  examplePage,
  onSearchChange,
  onSelectExample,
  onSelect,
  onSelectSection,
  searchValue,
}: {
  activeComponentId: ComponentId
  activeSection: DesignNavSection
  examplePage: ExamplePage
  onSearchChange: (value: string) => void
  onSelectExample: (examplePage: ExamplePage) => void
  onSelect: (id: ComponentId) => void
  onSelectSection: (section: DesignNavSection) => void
  searchValue: string
}) {
  const normalizedSearch = searchValue.trim().toLowerCase()
  const sectionItems =
    activeSection === "examples"
      ? []
      : componentItems.filter(
          (item) =>
            item.id !== "example-pages" &&
            getComponentSection(item.id) === activeSection
        )
  const visibleItems = normalizedSearch
    ? sectionItems.filter((item) =>
        [
          item.title,
          item.description,
          item.category,
          componentCategoryLabels[item.category],
          item.status,
          item.variantAxes.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch)
      )
    : sectionItems
  const visibleGroups = componentGroups
    .map((group) => ({
      group,
      items: visibleItems.filter((item) => item.category === group),
    }))
    .filter(({ items }) => items.length > 0)
  const visibleExamples = examplePages.filter((page) => {
    const item = examplePageItems[page]

    if (!normalizedSearch) {
      return true
    }

    return [page, item.title, item.description]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch)
  })
  const activeSectionLabel =
    designNavSections.find((section) => section.id === activeSection)?.label ??
    "컴포넌트"

  return (
    <aside className="hidden min-h-0 overflow-y-auto border-r border-foreground/[0.08] bg-[var(--surface-subtle)] px-3 py-3 backdrop-blur-2xl lg:block">
      <div className="mb-3 px-2">
        <p className="text-[0.72rem] font-semibold tracking-normal text-foreground/42 uppercase">
          Design System
        </p>
        <p className="mt-1 text-sm leading-5 text-foreground/54">
          카테고리를 나누고 모바일 프레임에서 각각 검증합니다.
        </p>
      </div>
      <LayoutGroup id="design-system-section-tabs">
        <div className="mb-4 grid gap-1 rounded-[18px] bg-foreground/[0.045] p-1">
          {designNavSections.map((section) => {
            const selected = activeSection === section.id

            return (
              <button
                key={section.id}
                type="button"
                className={cn(
                  "relative min-h-10 rounded-[14px] px-3 text-left text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]/35",
                  selected
                    ? "text-foreground"
                    : "text-foreground/46 hover:text-foreground/72"
                )}
                onClick={() => onSelectSection(section.id)}
              >
                {selected ? (
                  <motion.span
                    layoutId="sidebar-active-section"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[14px] bg-background shadow-[var(--ds-elevation-1)]"
                    transition={motionTokens.intent.selectionFlow}
                  />
                ) : null}
                <span className="relative z-10 flex items-center justify-between gap-2">
                  <span>{section.label}</span>
                  <span className="truncate text-[0.68rem] font-medium text-foreground/38">
                    {section.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </LayoutGroup>
      <div className="mb-4 px-2">
        <label className="sr-only" htmlFor="design-system-component-search">
          {activeSectionLabel} 검색
        </label>
        <input
          id="design-system-component-search"
          className="h-11 w-full rounded-full border border-foreground/[0.08] bg-background/72 px-4 text-sm font-medium text-foreground transition-shadow outline-none placeholder:text-foreground/32 focus:ring-2 focus:ring-[var(--ds-accent)]/25"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={`${activeSectionLabel} 검색`}
          type="search"
          value={searchValue}
        />
      </div>
      <LayoutGroup id="design-system-sidebar">
        {activeSection === "examples" ? (
          visibleExamples.length > 0 ? (
            <div className="space-y-1">
              {visibleExamples.map((page) => {
                const item = examplePageItems[page]
                const selected = examplePage === page

                return (
                  <button
                    key={page}
                    type="button"
                    className={cn(
                      "relative w-full rounded-[18px] px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]/35",
                      selected
                        ? "text-foreground"
                        : "text-foreground/62 hover:bg-background/46"
                    )}
                    onClick={() => onSelectExample(page)}
                  >
                    {selected ? (
                      <motion.span
                        layoutId="sidebar-active-example"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-[18px] bg-background shadow-[var(--ds-elevation-1)]"
                        transition={motionTokens.intent.selectionFlow}
                      />
                    ) : null}
                    <span className="relative z-10 grid min-w-0 gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {item.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-4 text-foreground/48">
                          {item.description}
                        </span>
                      </span>
                      <span>
                        <StatusBadge status="패턴" compact />
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-[18px] bg-background/58 px-3 py-4 text-sm leading-5 text-foreground/50">
              검색 결과가 없습니다.
            </div>
          )
        ) : visibleGroups.length > 0 ? (
          <div className="space-y-4">
            {visibleGroups.map(({ group, items }) => (
              <div
                key={group}
                className="min-w-0 border-t border-foreground/[0.08] pt-4 first:border-t-0 first:pt-0"
              >
                <p className="mb-1 px-2 text-[0.68rem] font-semibold tracking-normal text-foreground/38 uppercase">
                  {componentCategoryLabels[group]}
                </p>
                <div className="space-y-1">
                  {items.map((item) => {
                    const selected = activeComponentId === item.id

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(
                          "relative w-full rounded-[18px] px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]/35",
                          selected
                            ? "text-foreground"
                            : "text-foreground/62 hover:bg-background/46"
                        )}
                        onClick={() => onSelect(item.id)}
                      >
                        {selected ? (
                          <motion.span
                            layoutId="sidebar-active-component"
                            aria-hidden="true"
                            className="absolute inset-0 rounded-[18px] bg-background shadow-[var(--ds-elevation-1)]"
                            transition={motionTokens.intent.selectionFlow}
                          />
                        ) : null}
                        <span className="relative z-10 grid min-w-0 gap-2">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">
                              {item.title}
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-xs leading-4 text-foreground/48">
                              {item.description}
                            </span>
                          </span>
                          <span>
                            <StatusBadge status={item.status} compact />
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[18px] bg-background/58 px-3 py-4 text-sm leading-5 text-foreground/50">
            검색 결과가 없습니다.
          </div>
        )}
      </LayoutGroup>
    </aside>
  )
}

function MobileComponentNav({
  activeComponentId,
  activeSection,
  examplePage,
  onSelectExample,
  onSelect,
  onSelectSection,
}: {
  activeComponentId: ComponentId
  activeSection: DesignNavSection
  examplePage: ExamplePage
  onSelectExample: (examplePage: ExamplePage) => void
  onSelect: (id: ComponentId) => void
  onSelectSection: (section: DesignNavSection) => void
}) {
  const sectionItems =
    activeSection === "examples"
      ? []
      : componentItems.filter(
          (item) =>
            item.id !== "example-pages" &&
            getComponentSection(item.id) === activeSection
        )
  const activeComponent =
    activeComponentId === "example-pages"
      ? getExamplePageDisplay(examplePage)
      : getComponentItem(activeComponentId)

  return (
    <nav className="border-b border-foreground/[0.08] bg-[var(--surface-panel)] px-3 py-3 backdrop-blur-2xl lg:hidden">
      <div className="mx-auto max-w-[28rem] space-y-3">
        <div className="grid grid-cols-4 gap-1 rounded-[18px] bg-foreground/[0.045] p-1">
          {designNavSections.map((section) => {
            const selected = activeSection === section.id

            return (
              <button
                key={section.id}
                type="button"
                className={cn(
                  "min-h-10 min-w-0 rounded-[14px] px-1.5 text-center text-[0.86rem] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]/35",
                  selected
                    ? "bg-background text-foreground shadow-[var(--ds-elevation-1)]"
                    : "text-foreground/48"
                )}
                onClick={() => onSelectSection(section.id)}
              >
                <span className="block truncate">{section.mobileLabel}</span>
              </button>
            )
          })}
        </div>

        <div className="rounded-[22px] bg-background/64 p-3 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="truncate text-[0.72rem] font-semibold tracking-normal text-foreground/42 uppercase">
              {activeSection === "examples" ? "Example" : "Component"}
            </span>
            {activeComponent ? (
              <StatusBadge status={activeComponent.status} />
            ) : null}
          </div>
          <label className="relative block min-w-0">
            <span className="sr-only">
              {activeSection === "examples" ? "예시 페이지" : "컴포넌트"} 선택
            </span>
            <select
              className="h-11 w-full appearance-none rounded-full border border-foreground/[0.08] bg-background/82 pr-11 pl-4 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-[var(--ds-accent)]/25"
              value={
                activeSection === "examples" ? examplePage : activeComponentId
              }
              onChange={(event) => {
                if (activeSection === "examples") {
                  onSelectExample(event.target.value as ExamplePage)
                  return
                }

                onSelect(event.target.value as ComponentId)
              }}
            >
              {activeSection === "examples"
                ? examplePages.map((page) => (
                    <option key={page} value={page}>
                      {examplePageItems[page].title}
                    </option>
                  ))
                : sectionItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
            </select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-4 flex size-4 -translate-y-1/2 items-center justify-center text-foreground/72"
            >
              <svg
                viewBox="0 0 16 16"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              >
                <path d="m4 6 4 4 4-4" />
              </svg>
            </span>
          </label>
        </div>
      </div>
    </nav>
  )
}

function PreviewStage(props: {
  activeComponentId: ComponentId
  activePreviewStyle: string
  activeStage: SheetStage
  actionGridColumn: ActionGridColumns
  animatedNumberSample: AnimatedNumberSample
  appBarAlign: AppBarAlign
  appBarSize: AppBarSize
  avatarShape: AvatarShape
  avatarSize: AvatarSize
  avatarTone: AvatarTone
  badgeSize: BadgeSize
  badgeTone: BadgeTone
  bannerSize: BannerSize
  bannerTone: BannerTone
  buttonDisabled: boolean
  buttonSize: ButtonSize
  buttonVariant: ButtonVariant
  calendarDensity: CalendarDensity
  chatSide: ChatSide
  chatSize: ChatSize
  clusterJustify: Justify
  columns: GridColumns
  dividerInset: DividerInset
  examplePage: ExamplePage
  fabSize: FabSize
  fabTone: FabTone
  gridGap: GridGap
  iconButtonSize: "sm" | "md"
  listDensity: ListDensity
  layoutAlign: Align
  layoutGap: Gap
  messageInputSize: MessageInputSize
  valueCardSize: ValueCardSize
  onOpenBottomSheet: () => void
  pageHeaderAlign: PageHeaderAlign
  pageHeaderSize: PageHeaderSize
  pillSize: PillSize
  pillValue: "all" | "selling" | "buying" | "events"
  pillVariant: PillVariant
  segmentValue: "first" | "second" | "third"
  segmentedSize: "sm" | "md" | "lg"
  selectedOptions: Record<"alpha" | "beta" | "gamma", boolean>
  setPillValue: (value: "all" | "selling" | "buying" | "events") => void
  setSegmentValue: (value: "first" | "second" | "third") => void
  setSwitchChecked: (checked: boolean) => void
  surfacePadding: SurfacePadding
  surfaceVariant: SurfaceVariant
  switchChecked: boolean
  switchSize: "sm" | "md" | "lg"
  textAlign: TextAlign
  textTone: TextTone
  textVariant: TextVariant
  toggleOption: (value: "alpha" | "beta" | "gamma") => void
}) {
  const { activeComponentId } = props
  const reducedMotion = useReducedMotion()
  const detailTransition = reducedMotion
    ? { duration: motionTokens.duration.instant }
    : {
        duration: motionTokens.duration.base,
        ease: motionTokens.ease.enter,
      }

  return (
    <div className="flex h-full flex-col bg-[var(--calendar-app-bg)]">
      {activeComponentId === "example-pages" ? null : (
        <MobileTopBar activeComponentId={activeComponentId} />
      )}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto",
          activeComponentId === "example-pages"
            ? "px-0 pt-0 pb-0"
            : "px-5 pt-5 pb-8"
        )}
      >
        {activeComponentId === "typography" ? (
          <PhoneSection title="Typography" description="텍스트 역할과 의미 톤">
            <motion.div
              className="mt-10"
              variants={listVariants}
              initial="exit"
              animate="enter"
              exit="exit"
              transition={detailTransition}
            >
              <Stack gap="xl">
                <div>
                  <Text variant="caption" tone="muted">
                    2026.04.26
                  </Text>
                  <Text
                    align={props.textAlign}
                    tone={props.textTone}
                    variant={props.textVariant}
                    className="mt-2"
                  >
                    오늘의 화면은 너무 많은 설명 없이도 읽혀야 합니다
                  </Text>
                </div>
                <Stack gap="md">
                  {[
                    "섹션 제목은 20px 안팎으로 단단하게",
                    "본문은 15px 전후와 24px line-height",
                    "캡션은 흐리지만 터치 영역은 줄이지 않기",
                  ].map((label) => (
                    <ListRow key={label} title={label} />
                  ))}
                </Stack>
                <Text variant="caption" tone="muted">
                  iOS 계열 화면에서는 글자 크기보다 줄 간격과 그룹 간 여백이
                  먼저 안정감을 만듭니다.
                </Text>
              </Stack>
            </motion.div>
          </PhoneSection>
        ) : null}

        {activeComponentId === "spacing" ? (
          <PhoneSection title="Spacing" description="모바일 간격 토큰">
            <Stack gap="lg" className="mt-8">
              <SpacingScale items={spacingItems} />
              <Stack gap={props.layoutGap}>
                <ListRow title="작은 그룹" description="8px 또는 12px" />
                <ListRow title="기본 그룹" description="16px" />
                <ListRow title="큰 화면 분리" description="24px 이상" />
              </Stack>
            </Stack>
          </PhoneSection>
        ) : null}

        {activeComponentId === "color" ? (
          <PhoneSection title="Color" description="표면과 의미 색상 토큰">
            <Grid columns="two" gap="sm" className="mt-8">
              {colorItems.map((item) => (
                <TokenSwatch
                  key={item.token}
                  label={item.name}
                  token={item.token}
                />
              ))}
            </Grid>
          </PhoneSection>
        ) : null}

        {activeComponentId === "stack" ? (
          <PhoneSection title="Stack" description="세로 흐름과 간격">
            <Stack
              align={props.layoutAlign}
              gap={props.layoutGap}
              className="mt-8"
            >
              <ListRow title="오늘" description="상단 요약 영역" />
              <ListRow title="다음 일정" description="내용 영역" strong />
              <ListRow title="완료된 항목" description="하단 보조 영역" />
            </Stack>
          </PhoneSection>
        ) : null}

        {activeComponentId === "cluster" ? (
          <PhoneSection title="Cluster" description="가로 묶음과 줄바꿈">
            <Cluster
              align={props.layoutAlign}
              gap={props.layoutGap}
              justify={props.clusterJustify}
              className="mt-8"
            >
              {["Neutral", "Accent", "Success", "Danger"].map(
                (label, index) => (
                  <Badge
                    key={label}
                    tone={badgeTones[index] ?? "neutral"}
                    size={props.badgeSize}
                  >
                    {label}
                  </Badge>
                )
              )}
            </Cluster>
          </PhoneSection>
        ) : null}

        {activeComponentId === "grid" ? (
          <PhoneSection title="Grid" description="모바일 그리드 프리미티브">
            <Grid columns={props.columns} gap={props.gridGap} className="mt-8">
              {Array.from({ length: 6 }, (_, index) => (
                <GridPreviewTile
                  key={index}
                  label={`Item ${index + 1}`}
                  value={`${index + 2}`}
                />
              ))}
            </Grid>
          </PhoneSection>
        ) : null}

        {activeComponentId === "divider" ? (
          <PhoneSection title="Divider" description="정보 그룹 구분">
            <Stack gap="md" className="mt-8">
              <Text variant="label">설정</Text>
              <Divider inset={props.dividerInset} />
              <ListRow title="알림" description="켜짐" />
              <Divider inset={props.dividerInset} />
              <ListRow title="동기화" description="방금 전" />
              <Divider inset={props.dividerInset} />
              <ListRow title="화면 밀도" description="기본" />
            </Stack>
          </PhoneSection>
        ) : null}

        {activeComponentId === "badge" ? (
          <PhoneSection title="Badge" description="짧은 상태 라벨">
            <Stack gap="lg" className="mt-8">
              <ListRow
                title="업데이트 상태"
                description="상태는 짧고 명확하게"
                accessory={
                  <Badge tone={props.badgeTone} size={props.badgeSize}>
                    상태
                  </Badge>
                }
              />
              <ListRow
                title="보조 정보"
                description="배지는 본문을 대신하지 않습니다."
              />
            </Stack>
          </PhoneSection>
        ) : null}

        {activeComponentId === "avatar" ? (
          <PhoneSection
            title="Avatar"
            description="프로필, 아이콘, 썸네일 자리"
          >
            <Stack gap="xl" className="mt-8">
              <div className="flex min-h-28 items-center justify-center rounded-[28px] bg-white/62">
                <Avatar
                  shape={props.avatarShape}
                  size={props.avatarSize}
                  tone={props.avatarTone}
                >
                  A
                </Avatar>
              </div>
              <Stack gap="none">
                <ListItem
                  title="프로필 행"
                  subtitle="size와 shape만 바꿔도 리스트 밀도가 달라집니다."
                  leading={
                    <Avatar
                      shape={props.avatarShape}
                      size={props.avatarSize}
                      tone={props.avatarTone}
                    >
                      P
                    </Avatar>
                  }
                />
                <ListItem
                  title="서비스 아이콘"
                  subtitle="톤은 의미 색상과 연결합니다."
                  leading={
                    <Avatar
                      shape={props.avatarShape}
                      size="sm"
                      tone={props.avatarTone}
                    >
                      S
                    </Avatar>
                  }
                />
              </Stack>
            </Stack>
          </PhoneSection>
        ) : null}

        {activeComponentId === "app-bar" ? (
          <div className="-mx-5 -mt-5">
            <AppBar
              align={props.appBarAlign}
              size={props.appBarSize}
              title={props.appBarSize === "large" ? "Community" : "테토키"}
              subtitle={props.appBarSize === "large" ? undefined : "상태 배지"}
              leading={
                props.appBarSize === "large" ? undefined : (
                  <IconButton aria-label="뒤로가기" size="md">
                    <span aria-hidden="true">‹</span>
                  </IconButton>
                )
              }
              trailing={
                <>
                  <IconButton aria-label="검색" size="md">
                    <Glyph label="S" />
                  </IconButton>
                  <IconButton aria-label="설정" size="md">
                    <Glyph label="G" />
                  </IconButton>
                </>
              }
            />
            <div className="px-5 pt-6">
              <ListItem
                title="상단 영역 아래 첫 콘텐츠"
                subtitle="앱바는 화면의 정보 구조를 가장 먼저 정리합니다."
                leading={<Avatar shape="rounded">A</Avatar>}
              />
            </div>
          </div>
        ) : null}

        {activeComponentId === "page-header" ? (
          <div className="-mx-5 -mt-5">
            <PageHeader
              align={props.pageHeaderAlign}
              size={props.pageHeaderSize}
              title="토스증권"
              meta={
                <span>
                  나스닥 100 선물 <AnimatedNumber value="27,435.00" />{" "}
                  <span className="text-[var(--ds-danger)]">+1.8%</span>
                </span>
              }
              trailing={
                <>
                  <IconButton aria-label="검색" size="md">
                    <Glyph label="S" />
                  </IconButton>
                  <IconButton aria-label="메뉴" size="md">
                    <Glyph label="M" />
                  </IconButton>
                </>
              }
            />
            <div className="px-5 pt-5">
              <ListItem
                title="헤더 아래 첫 콘텐츠"
                subtitle="화면 대표 제목과 부가 지표를 같은 라인에서 다룹니다."
                leading={<Avatar shape="rounded">H</Avatar>}
              />
            </div>
          </div>
        ) : null}

        {activeComponentId === "pill-tabs" ? (
          <PhoneSection title="PillTabs" description="텍스트 탭과 필터 칩">
            <Stack gap="xl" className="mt-8">
              <PillTabs
                ariaLabel="필터 탭"
                options={pillDemoOptions}
                size={props.pillSize}
                value={props.pillValue}
                variant={props.pillVariant}
                onValueChange={props.setPillValue}
              />
              <ListItem
                title="선택된 탭의 콘텐츠"
                subtitle="선택 pill은 shared-layout으로 이동합니다."
                leading={<Avatar shape="rounded">T</Avatar>}
              />
            </Stack>
          </PhoneSection>
        ) : null}

        {activeComponentId === "notice-banner" ? (
          <PhoneSection title="NoticeBanner" description="공지와 권한 요청">
            <Stack gap="lg" className="mt-8">
              <NoticeBanner
                size={props.bannerSize}
                tone={props.bannerTone}
                title="중요한 정보를 놓치지 않도록 알림을 켜보세요."
                action="설정 보기"
                leading={
                  <Avatar shape="rounded" tone="accent">
                    N
                  </Avatar>
                }
                trailing={<span aria-hidden="true">›</span>}
              />
              <ListItem
                title="아래 콘텐츠"
                subtitle="배너는 화면 흐름 안에서 한 덩어리로 읽힙니다."
              />
            </Stack>
          </PhoneSection>
        ) : null}

        {activeComponentId === "list-item" ? (
          <PhoneSection
            title="ListItem"
            description="메뉴, 채팅, 피드의 기본 행"
          >
            <Stack gap="none" className="mt-8">
              <ListItem
                density={props.listDensity}
                title="주식"
                subtitle="조건주문 · 지정가 알림"
                leading={
                  <Avatar shape="rounded" tone="accent">
                    A
                  </Avatar>
                }
                meta="7개"
                trailing={<span className="text-foreground/30">›</span>}
              />
              <ListItem
                density={props.listDensity}
                title="커뮤니티"
                subtitle="프로필 · 주제별 커뮤니티"
                leading={<Avatar shape="rounded">C</Avatar>}
              />
              <ListItem
                density={props.listDensity}
                title="알림"
                subtitle="읽지 않은 항목이 있습니다."
                leading={
                  <Avatar shape="rounded" tone="danger">
                    B
                  </Avatar>
                }
                trailing={<Badge tone="accent">10+</Badge>}
              />
            </Stack>
          </PhoneSection>
        ) : null}

        {activeComponentId === "value-card" ? (
          <PhoneSection
            title="ValueCard"
            description="값을 담는 중립 슬롯 카드"
          >
            <Grid columns="two" gap="md" className="mt-8">
              <ValueCard
                size={props.valueCardSize}
                label="Label"
                value="Value"
                description="Supporting text"
              />
              <ValueCard
                size={props.valueCardSize}
                label="State"
                value="Active"
                trailing={<Badge tone="accent">Badge</Badge>}
              />
              <ValueCard
                size={props.valueCardSize}
                label="Count"
                value={
                  <>
                    <AnimatedNumber value={24} />
                    <span className="ml-1 text-foreground/48">items</span>
                  </>
                }
                leading={
                  <Avatar size="sm" shape="rounded" tone="accent">
                    V
                  </Avatar>
                }
                description="Optional leading and trailing slots"
                className="col-span-2"
              />
            </Grid>
          </PhoneSection>
        ) : null}

        {activeComponentId === "animated-number" ? (
          <PhoneSection title="AnimatedNumber" description="자릿수별 숫자 롤링">
            <Stack gap="xl" className="mt-8">
              <div className="rounded-[28px] bg-white/62 p-5">
                <Text variant="caption" tone="muted">
                  샘플 숫자
                </Text>
                <p className="mt-2 text-[2rem] leading-9 font-semibold text-foreground tabular-nums">
                  <AnimatedNumber value={props.animatedNumberSample} />
                </p>
              </div>
              <Stack gap="none">
                <ListItem
                  title="잔액"
                  trailing={
                    <Text variant="label">
                      <AnimatedNumber value="5,987.05" />
                    </Text>
                  }
                />
                <ListItem
                  title="읽지 않은 메시지"
                  trailing={
                    <Badge tone="accent">
                      <AnimatedNumber value="43" />
                    </Badge>
                  }
                />
              </Stack>
            </Stack>
          </PhoneSection>
        ) : null}

        {activeComponentId === "action-grid" ? (
          <PhoneSection title="ActionGrid" description="서비스 바로가기">
            <ActionGrid
              className="mt-8"
              columns={props.actionGridColumn}
              items={actionGridItems}
            />
          </PhoneSection>
        ) : null}

        {activeComponentId === "button" ? (
          <PhoneSection title="Button" description="주요 행동과 보조 행동">
            <div className="mt-8 flex min-h-[37rem] flex-col justify-between">
              <Stack gap="md">
                <ListRow title="검토할 항목" description="3개 남음" />
                <ListRow title="동기화" description="안정적" />
              </Stack>
              <Stack gap="sm">
                <Text tone="secondary">
                  모바일 CTA는 화면 하단에서 명확해야 합니다.
                </Text>
                <Button
                  disabled={props.buttonDisabled}
                  size={props.buttonSize}
                  type="button"
                  variant={props.buttonVariant}
                >
                  주요 행동
                </Button>
              </Stack>
            </div>
          </PhoneSection>
        ) : null}

        {activeComponentId === "icon-button" ? (
          <PhoneSection title="IconButton" description="도구성 행동">
            <div className="mt-8">
              <Cluster gap="sm" justify="between">
                <IconButton aria-label="이전" size={props.iconButtonSize}>
                  <span aria-hidden="true">‹</span>
                </IconButton>
                <Text variant="label">상단 도구 영역</Text>
                <IconButton aria-label="설정" size={props.iconButtonSize}>
                  <span aria-hidden="true">S</span>
                </IconButton>
              </Cluster>
              <Stack gap="md" className="mt-10">
                <ListRow
                  title="목록 항목"
                  description="아이콘 버튼은 보조 행동에 둡니다."
                />
                <ListRow
                  title="상세 설정"
                  description="작아도 터치 영역은 유지합니다."
                />
              </Stack>
            </div>
          </PhoneSection>
        ) : null}

        {activeComponentId === "segmented-control" ? (
          <PhoneSection title="SegmentedControl" description="동일 위계 선택">
            <Stack gap="lg" className="mt-8">
              <SegmentedControl
                ariaLabel="샘플 세그먼트"
                options={segmentOptions}
                size={props.segmentedSize}
                value={props.segmentValue}
                onValueChange={props.setSegmentValue}
              />
              <ListRow
                title="첫 번째 화면"
                description="선택된 세그먼트에 따라 내용이 바뀝니다."
              />
              <ListRow
                title="두 번째 화면"
                description="같은 깊이의 옵션만 세그먼트로 묶습니다."
              />
            </Stack>
          </PhoneSection>
        ) : null}

        {activeComponentId === "switch-control" ? (
          <PhoneSection title="SwitchControl" description="즉시 전환 상태">
            <Stack gap="md" className="mt-8">
              <ListRow
                title="상태 켜기"
                description="변경 즉시 적용"
                accessory={
                  <SwitchControl
                    checked={props.switchChecked}
                    label="상태 켜기"
                    size={props.switchSize}
                    onCheckedChange={props.setSwitchChecked}
                  />
                }
              />
              <ListRow
                title="설명 텍스트"
                description="스위치는 저장 버튼 없이 상태가 바뀝니다."
              />
            </Stack>
          </PhoneSection>
        ) : null}

        {activeComponentId === "floating-action-button" ? (
          <div className="relative min-h-full">
            <PhoneSection
              title="FloatingActionButton"
              description="화면 위 주요 행동"
            >
              <Stack gap="md" className="mt-8">
                <ListItem
                  title="피드 콘텐츠"
                  subtitle="기본 콘텐츠 위에 CTA가 떠 있습니다."
                />
                <ListItem
                  title="다음 콘텐츠"
                  subtitle="주요 행동은 엄지 영역에 둡니다."
                />
              </Stack>
            </PhoneSection>
            <FloatingActionButton
              className="absolute right-0 bottom-5"
              size={props.fabSize}
              tone={props.fabTone}
              icon={<span aria-hidden="true">+</span>}
            >
              글쓰기
            </FloatingActionButton>
          </div>
        ) : null}

        {activeComponentId === "chat-bubble" ? (
          <PhoneSection title="ChatBubble" description="수신과 발신 메시지">
            <Stack gap="md" className="mt-8">
              <ChatBubble side="incoming" size={props.chatSize} meta="10:30">
                일정 보고 놀러오세요
              </ChatBubble>
              <ChatBubble
                side={props.chatSide}
                size={props.chatSize}
                meta="10:32"
              >
                이번 주는 어렵고 다음 주에 볼게요
              </ChatBubble>
              <ChatBubble side="incoming" size={props.chatSize} meta="10:34">
                편할 때 결정하세요
              </ChatBubble>
            </Stack>
          </PhoneSection>
        ) : null}

        {activeComponentId === "message-input" ? (
          <div className="flex min-h-full flex-col">
            <PhoneSection title="MessageInput" description="하단 입력 바">
              <Stack gap="md" className="mt-8">
                <ChatBubble side="incoming">안녕하세요</ChatBubble>
                <ChatBubble side="outgoing">메시지를 남겨둘게요</ChatBubble>
              </Stack>
            </PhoneSection>
            <div className="mt-auto flex items-center gap-2 pb-1">
              <IconButton aria-label="첨부" size="md">
                <span aria-hidden="true">+</span>
              </IconButton>
              <MessageInput
                className="flex-1"
                size={props.messageInputSize}
                placeholder="Write a message"
                trailing={<Glyph label="S" />}
              />
            </div>
          </div>
        ) : null}

        {activeComponentId === "surface" ? (
          <PhoneSection title="Surface" description="표면 깊이와 여백">
            <Stack gap="lg" className="mt-8">
              <Surface
                padding={props.surfacePadding}
                variant={props.surfaceVariant}
                className="rounded-[26px]"
              >
                <Text variant="label">공통 표면</Text>
                <Text tone="secondary" className="mt-2">
                  표면 variant는 깊이와 재질만 표현합니다.
                </Text>
              </Surface>
              <ListRow
                title="기본 캔버스"
                description="일반 콘텐츠는 배경 위에 직접 놓습니다."
              />
            </Stack>
          </PhoneSection>
        ) : null}

        {activeComponentId === "bottom-sheet" ? (
          <PhoneSection title="BottomSheet" description="임시 하단 표면">
            <div className="mt-8 flex min-h-[37rem] flex-col justify-between">
              <Stack gap="md">
                <ListRow
                  title="현재 화면"
                  description="시트가 열려도 맥락을 잃지 않습니다."
                />
                <ListRow
                  title="임시 작업"
                  description="짧은 확인과 선택에 사용"
                />
              </Stack>
              <Stack gap="sm">
                <Text tone="secondary">
                  프리뷰 안의 버튼으로 실제 시트를 열 수 있습니다.
                </Text>
                <Button type="button" onClick={props.onOpenBottomSheet}>
                  시트 열기
                </Button>
              </Stack>
            </div>
          </PhoneSection>
        ) : null}

        {activeComponentId === "calendar-preview" ? (
          <CalendarPreview
            className="rounded-[22px]"
            density={props.calendarDensity}
            days={previewDays}
            monthLabel="2026년 4월"
            previewStyleLabel={props.activePreviewStyle}
          />
        ) : null}

        {activeComponentId === "menu-checkbox" ? (
          <PhoneSection
            title="MenuCheckboxGroup"
            description="메뉴형 다중 선택"
          >
            <div className="mt-8 flex items-start justify-between">
              <div>
                <Text variant="label">옵션 필터</Text>
                <Text variant="caption" tone="muted" className="mt-1">
                  마지막 하나는 유지합니다.
                </Text>
              </div>
              <FormatFilter
                description="표시할 UI 옵션을 고릅니다."
                onToggle={props.toggleOption}
                options={[
                  { value: "alpha", label: "옵션 A" },
                  { value: "beta", label: "옵션 B" },
                  { value: "gamma", label: "옵션 C" },
                ]}
                selected={props.selectedOptions}
                title="옵션"
                triggerLabel="옵션 필터 열기"
              />
            </div>
          </PhoneSection>
        ) : null}

        {activeComponentId === "three-stage-sheet" ? (
          <ThreeStageSheetPreview
            activeStage={props.activeStage}
            className="rounded-[28px]"
          />
        ) : null}

        {activeComponentId === "example-pages" ? (
          <ExamplePagePreview examplePage={props.examplePage} />
        ) : null}
      </div>
    </div>
  )
}

function ControlsPanel(props: {
  activeComponentId: ComponentId
  activePreviewStyle: (typeof previewStyles)[number]
  activeStage: SheetStage
  actionGridColumn: ActionGridColumns
  animatedNumberSample: AnimatedNumberSample
  appBarAlign: AppBarAlign
  appBarSize: AppBarSize
  avatarShape: AvatarShape
  avatarSize: AvatarSize
  avatarTone: AvatarTone
  badgeSize: BadgeSize
  badgeTone: BadgeTone
  bannerSize: BannerSize
  bannerTone: BannerTone
  buttonDisabled: boolean
  buttonSize: ButtonSize
  buttonVariant: ButtonVariant
  calendarDensity: CalendarDensity
  chatSide: ChatSide
  chatSize: ChatSize
  clusterJustify: Justify
  columns: GridColumns
  dividerInset: DividerInset
  examplePage: ExamplePage
  fabSize: FabSize
  fabTone: FabTone
  gridGap: GridGap
  iconButtonSize: "sm" | "md"
  listDensity: ListDensity
  layoutAlign: Align
  layoutGap: Gap
  messageInputSize: MessageInputSize
  valueCardSize: ValueCardSize
  onNavigateComponent: (componentId: ComponentId) => void
  onSelectExamplePage: (examplePage: ExamplePage) => void
  pageHeaderAlign: PageHeaderAlign
  pageHeaderSize: PageHeaderSize
  pillSize: PillSize
  pillVariant: PillVariant
  selectedOptions: Record<"alpha" | "beta" | "gamma", boolean>
  segmentedSize: "sm" | "md" | "lg"
  setActionGridColumn: (value: ActionGridColumns) => void
  setActivePreviewStyle: (value: (typeof previewStyles)[number]) => void
  setActiveStage: (value: SheetStage) => void
  setAnimatedNumberSample: (value: AnimatedNumberSample) => void
  setAppBarAlign: (value: AppBarAlign) => void
  setAppBarSize: (value: AppBarSize) => void
  setAvatarShape: (value: AvatarShape) => void
  setAvatarSize: (value: AvatarSize) => void
  setAvatarTone: (value: AvatarTone) => void
  setBadgeSize: (value: BadgeSize) => void
  setBadgeTone: (value: BadgeTone) => void
  setBannerSize: (value: BannerSize) => void
  setBannerTone: (value: BannerTone) => void
  setButtonDisabled: (value: boolean) => void
  setButtonSize: (value: ButtonSize) => void
  setButtonVariant: (value: ButtonVariant) => void
  setCalendarDensity: (value: CalendarDensity) => void
  setChatSide: (value: ChatSide) => void
  setChatSize: (value: ChatSize) => void
  setClusterJustify: (value: Justify) => void
  setColumns: (value: GridColumns) => void
  setDividerInset: (value: DividerInset) => void
  setFabSize: (value: FabSize) => void
  setFabTone: (value: FabTone) => void
  setGridGap: (value: GridGap) => void
  setIconButtonSize: (value: "sm" | "md") => void
  setListDensity: (value: ListDensity) => void
  setLayoutAlign: (value: Align) => void
  setLayoutGap: (value: Gap) => void
  setMessageInputSize: (value: MessageInputSize) => void
  setValueCardSize: (value: ValueCardSize) => void
  setPageHeaderAlign: (value: PageHeaderAlign) => void
  setPageHeaderSize: (value: PageHeaderSize) => void
  setPillSize: (value: PillSize) => void
  setPillVariant: (value: PillVariant) => void
  setSegmentedSize: (value: "sm" | "md" | "lg") => void
  setSurfacePadding: (value: SurfacePadding) => void
  setSurfaceVariant: (value: SurfaceVariant) => void
  setSwitchChecked: (value: boolean) => void
  setSwitchSize: (value: "sm" | "md" | "lg") => void
  setTextAlign: (value: TextAlign) => void
  setTextTone: (value: TextTone) => void
  setTextVariant: (value: TextVariant) => void
  surfacePadding: SurfacePadding
  surfaceVariant: SurfaceVariant
  switchChecked: boolean
  switchSize: "sm" | "md" | "lg"
  textAlign: TextAlign
  textTone: TextTone
  textVariant: TextVariant
  toggleOption: (value: "alpha" | "beta" | "gamma") => void
}) {
  const activeItem =
    componentItems.find((item) => item.id === props.activeComponentId) ??
    componentItems[0]!

  return (
    <aside className="border-t border-foreground/[0.08] bg-[var(--surface-subtle)] px-4 py-4 backdrop-blur-2xl lg:col-start-2 xl:col-auto xl:min-h-0 xl:overflow-y-auto xl:border-t-0 xl:border-l">
      <div className="mb-4">
        <p className="text-[0.72rem] font-semibold tracking-normal text-foreground/42 uppercase">
          Controls
        </p>
        <h2 className="mt-1 text-lg font-semibold">UI variant</h2>
      </div>

      <ControlGroup>
        {props.activeComponentId === "typography" ? (
          <>
            <ControlSegment
              label="Variant"
              options={textVariants}
              value={props.textVariant}
              onChange={props.setTextVariant}
            />
            <ControlSegment
              label="Tone"
              options={textTones}
              value={props.textTone}
              onChange={props.setTextTone}
            />
            <ControlSegment
              label="Align"
              options={textAligns}
              value={props.textAlign}
              onChange={props.setTextAlign}
            />
          </>
        ) : null}

        {props.activeComponentId === "stack" ? (
          <>
            <ControlSegment
              label="Gap"
              options={gaps}
              value={props.layoutGap}
              onChange={props.setLayoutGap}
            />
            <ControlSegment
              label="Align"
              options={aligns}
              value={props.layoutAlign}
              onChange={props.setLayoutAlign}
            />
          </>
        ) : null}

        {props.activeComponentId === "cluster" ? (
          <>
            <ControlSegment
              label="Gap"
              options={gaps}
              value={props.layoutGap}
              onChange={props.setLayoutGap}
            />
            <ControlSegment
              label="Align"
              options={aligns}
              value={props.layoutAlign}
              onChange={props.setLayoutAlign}
            />
            <ControlSegment
              label="Justify"
              options={justifies}
              value={props.clusterJustify}
              onChange={props.setClusterJustify}
            />
          </>
        ) : null}

        {props.activeComponentId === "grid" ? (
          <>
            <ControlSegment
              label="Columns"
              options={gridColumns}
              value={props.columns}
              onChange={props.setColumns}
            />
            <ControlSegment
              label="Gap"
              options={gridGaps}
              value={props.gridGap}
              onChange={props.setGridGap}
            />
          </>
        ) : null}

        {props.activeComponentId === "divider" ? (
          <ControlSegment
            label="Inset"
            options={dividerInsets}
            value={props.dividerInset}
            onChange={props.setDividerInset}
          />
        ) : null}

        {props.activeComponentId === "badge" ? (
          <>
            <ControlSegment
              label="Tone"
              options={badgeTones}
              value={props.badgeTone}
              onChange={props.setBadgeTone}
            />
            <ControlSegment
              label="Size"
              options={badgeSizes}
              value={props.badgeSize}
              onChange={props.setBadgeSize}
            />
          </>
        ) : null}

        {props.activeComponentId === "avatar" ? (
          <>
            <ControlSegment
              label="Size"
              options={avatarSizes}
              value={props.avatarSize}
              onChange={props.setAvatarSize}
            />
            <ControlSegment
              label="Shape"
              options={avatarShapes}
              value={props.avatarShape}
              onChange={props.setAvatarShape}
            />
            <ControlSegment
              label="Tone"
              options={avatarTones}
              value={props.avatarTone}
              onChange={props.setAvatarTone}
            />
          </>
        ) : null}

        {props.activeComponentId === "app-bar" ? (
          <>
            <ControlSegment
              label="Size"
              options={appBarSizes}
              value={props.appBarSize}
              onChange={props.setAppBarSize}
            />
            <ControlSegment
              label="Align"
              options={appBarAligns}
              value={props.appBarAlign}
              onChange={props.setAppBarAlign}
            />
          </>
        ) : null}

        {props.activeComponentId === "page-header" ? (
          <>
            <ControlSegment
              label="Size"
              options={pageHeaderSizes}
              value={props.pageHeaderSize}
              onChange={props.setPageHeaderSize}
            />
            <ControlSegment
              label="Align"
              options={pageHeaderAligns}
              value={props.pageHeaderAlign}
              onChange={props.setPageHeaderAlign}
            />
          </>
        ) : null}

        {props.activeComponentId === "pill-tabs" ? (
          <>
            <ControlSegment
              label="Variant"
              options={pillVariants}
              value={props.pillVariant}
              onChange={props.setPillVariant}
            />
            <ControlSegment
              label="Size"
              options={pillSizes}
              value={props.pillSize}
              onChange={props.setPillSize}
            />
          </>
        ) : null}

        {props.activeComponentId === "notice-banner" ? (
          <>
            <ControlSegment
              label="Tone"
              options={bannerTones}
              value={props.bannerTone}
              onChange={props.setBannerTone}
            />
            <ControlSegment
              label="Size"
              options={bannerSizes}
              value={props.bannerSize}
              onChange={props.setBannerSize}
            />
          </>
        ) : null}

        {props.activeComponentId === "list-item" ? (
          <ControlSegment
            label="Density"
            options={listDensities}
            value={props.listDensity}
            onChange={props.setListDensity}
          />
        ) : null}

        {props.activeComponentId === "value-card" ? (
          <ControlSegment
            label="Size"
            options={valueCardSizes}
            value={props.valueCardSize}
            onChange={props.setValueCardSize}
          />
        ) : null}

        {props.activeComponentId === "animated-number" ? (
          <ControlSegment
            label="Value"
            options={animatedNumberSamples}
            value={props.animatedNumberSample}
            onChange={props.setAnimatedNumberSample}
          />
        ) : null}

        {props.activeComponentId === "action-grid" ? (
          <ControlSegment
            label="Columns"
            options={actionGridColumns}
            value={props.actionGridColumn}
            onChange={props.setActionGridColumn}
          />
        ) : null}

        {props.activeComponentId === "button" ? (
          <>
            <ControlSegment
              label="Variant"
              options={buttonVariants}
              value={props.buttonVariant}
              onChange={props.setButtonVariant}
            />
            <ControlSegment
              label="Size"
              options={buttonSizes}
              value={props.buttonSize}
              onChange={props.setButtonSize}
            />
            <ToggleControl
              checked={props.buttonDisabled}
              label="Disabled"
              onChange={props.setButtonDisabled}
            />
          </>
        ) : null}

        {props.activeComponentId === "icon-button" ? (
          <ControlSegment
            label="Size"
            options={iconSizes}
            value={props.iconButtonSize}
            onChange={props.setIconButtonSize}
          />
        ) : null}

        {props.activeComponentId === "segmented-control" ? (
          <ControlSegment
            label="Size"
            options={segmentedSizes}
            value={props.segmentedSize}
            onChange={props.setSegmentedSize}
          />
        ) : null}

        {props.activeComponentId === "switch-control" ? (
          <>
            <ControlSegment
              label="Size"
              options={switchSizes}
              value={props.switchSize}
              onChange={props.setSwitchSize}
            />
            <ToggleControl
              checked={props.switchChecked}
              label="Checked"
              onChange={props.setSwitchChecked}
            />
          </>
        ) : null}

        {props.activeComponentId === "floating-action-button" ? (
          <>
            <ControlSegment
              label="Size"
              options={fabSizes}
              value={props.fabSize}
              onChange={props.setFabSize}
            />
            <ControlSegment
              label="Tone"
              options={fabTones}
              value={props.fabTone}
              onChange={props.setFabTone}
            />
          </>
        ) : null}

        {props.activeComponentId === "chat-bubble" ? (
          <>
            <ControlSegment
              label="Side"
              options={chatSides}
              value={props.chatSide}
              onChange={props.setChatSide}
            />
            <ControlSegment
              label="Size"
              options={chatSizes}
              value={props.chatSize}
              onChange={props.setChatSize}
            />
          </>
        ) : null}

        {props.activeComponentId === "message-input" ? (
          <ControlSegment
            label="Size"
            options={messageInputSizes}
            value={props.messageInputSize}
            onChange={props.setMessageInputSize}
          />
        ) : null}

        {props.activeComponentId === "surface" ? (
          <>
            <ControlSegment
              label="Surface"
              options={surfaceVariants}
              value={props.surfaceVariant}
              onChange={props.setSurfaceVariant}
            />
            <ControlSegment
              label="Padding"
              options={surfacePaddings}
              value={props.surfacePadding}
              onChange={props.setSurfacePadding}
            />
          </>
        ) : null}

        {props.activeComponentId === "calendar-preview" ? (
          <>
            <ControlSegment
              label="Density"
              options={calendarDensities}
              value={props.calendarDensity}
              onChange={props.setCalendarDensity}
            />
            <ControlSegment
              label="Preview style"
              options={previewStyles}
              value={props.activePreviewStyle}
              onChange={props.setActivePreviewStyle}
            />
          </>
        ) : null}

        {props.activeComponentId === "menu-checkbox" ? (
          <>
            <ToggleControl
              checked={props.selectedOptions.alpha}
              label="Option A"
              onChange={() => props.toggleOption("alpha")}
            />
            <ToggleControl
              checked={props.selectedOptions.beta}
              label="Option B"
              onChange={() => props.toggleOption("beta")}
            />
            <ToggleControl
              checked={props.selectedOptions.gamma}
              label="Option C"
              onChange={() => props.toggleOption("gamma")}
            />
          </>
        ) : null}

        {props.activeComponentId === "three-stage-sheet" ? (
          <ControlOptions
            label="Stage"
            options={sheetStages}
            value={props.activeStage}
            onChange={props.setActiveStage}
          />
        ) : null}

        {props.activeComponentId === "example-pages" ? (
          <>
            <div className="rounded-[22px] bg-background/58 p-4">
              <p className="text-sm font-semibold">
                {examplePageItems[props.examplePage].title}
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground/58">
                {examplePageItems[props.examplePage].description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {examplePages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]/35",
                      props.examplePage === page
                        ? "bg-foreground text-background"
                        : "bg-foreground/[0.06] text-foreground/52 hover:text-foreground"
                    )}
                    onClick={() => props.onSelectExamplePage(page)}
                  >
                    {examplePageItems[page].title}
                  </button>
                ))}
              </div>
            </div>
            <ExampleComponentLinks
              examplePage={props.examplePage}
              onNavigate={props.onNavigateComponent}
            />
          </>
        ) : null}
      </ControlGroup>

      <div className="mt-6 rounded-[22px] bg-background/58 p-4">
        <p className="text-sm font-semibold">Variant 축</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {activeItem.variantAxes.map((axis) => (
            <Badge key={axis} tone="neutral" size="sm">
              {axis}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-foreground/58">
          도메인 값은 샘플 콘텐츠에만 두고, 공통 API는 UI 속성으로만 확장합니다.
        </p>
      </div>
    </aside>
  )
}

function ExampleComponentLinks({
  examplePage,
  onNavigate,
}: {
  examplePage: ExamplePage
  onNavigate: (componentId: ComponentId) => void
}) {
  const usedComponents = examplePageComponentMap[examplePage]

  return (
    <div className="rounded-[22px] bg-background/58 p-4">
      <p className="text-sm font-semibold">이 예시가 쓰는 컴포넌트</p>
      <p className="mt-1 text-xs leading-5 text-foreground/48">
        항목을 누르면 해당 컴포넌트 문서로 이동합니다.
      </p>
      <div className="mt-3 grid gap-2">
        {usedComponents.map((componentId) => {
          const component = getComponentItem(componentId)

          if (!component) {
            return null
          }

          return (
            <button
              key={component.id}
              type="button"
              className="flex min-h-12 items-center justify-between gap-3 rounded-[16px] bg-background/72 px-3 text-left text-sm font-semibold text-foreground transition-colors outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]/35"
              onClick={() => onNavigate(component.id)}
            >
              <span className="min-w-0">
                <span className="block truncate">{component.title}</span>
                <span className="block truncate text-xs font-medium text-foreground/42">
                  {componentCategoryLabels[component.category]}
                </span>
              </span>
              <span aria-hidden="true" className="shrink-0 text-foreground/28">
                ›
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const chatListRowsByFilter: Record<
  PillDemoValue,
  Array<{
    title: string
    subtitle: string
    meta?: string
    badge?: string
  }>
> = {
  all: [
    {
      title: "사진을 찍고 글을 씁니다",
      subtitle: "새 메시지가 도착했습니다.",
      meta: "6d",
    },
    {
      title: "2030 서울권 도서관",
      subtitle: "모임 공지가 올라왔어요.",
      badge: "10+",
    },
    {
      title: "우솔배드민턴 클럽",
      subtitle: "새 일정이 공유됐습니다.",
      meta: "8:20",
    },
    { title: "테토키", subtitle: "모임이 아니었어요", meta: "7:38" },
  ],
  selling: [
    { title: "거래 문의", subtitle: "오늘 가능하신가요?", meta: "1m" },
    { title: "중고 카메라", subtitle: "안심결제로 하면 되나요?", badge: "5" },
    { title: "픽업 일정", subtitle: "저녁 7시에 갈게요.", meta: "2h" },
  ],
  buying: [
    { title: "관심 상품", subtitle: "가격이 조금 내려갔어요.", meta: "now" },
    { title: "예약 확인", subtitle: "내일 오전에 뵐게요.", meta: "10:12" },
    { title: "동네 나눔", subtitle: "아직 받을 수 있나요?", meta: "1d" },
  ],
  events: [
    {
      title: "동네 산책 이벤트",
      subtitle: "새 혜택이 열렸습니다.",
      badge: "2",
    },
    {
      title: "모임 챌린지",
      subtitle: "이번 주 참여자가 늘었어요.",
      meta: "today",
    },
    { title: "쿠폰 알림", subtitle: "오늘까지 사용할 수 있어요.", meta: "3h" },
  ],
}

const communityRowsBySection: Record<
  CommunitySectionValue,
  Array<{ title: string; subtitle: string; meta: string; tag: string }>
> = {
  life: [
    {
      title: "양양홍천고속도로",
      subtitle: "에서 911한테 따였네요",
      meta: "서초1동 · 조회 348",
      tag: "취미",
    },
    {
      title: "레전드 학생",
      subtitle: "이중약속에 파토까지 완벽엔딩",
      meta: "서초2동 · 조회 525",
      tag: "일반",
    },
    {
      title: "괜히 샀다 멀미난다",
      subtitle: "하 ㅠㅠ 이걸 왜",
      meta: "서초1동 · 조회 3,498",
      tag: "생활/편의",
    },
  ],
  club: [
    {
      title: "아침 러닝 같이 하실 분",
      subtitle: "매주 화목 7시에 모여요",
      meta: "방배동 · 멤버 18",
      tag: "운동",
    },
    {
      title: "사진 산책 모임",
      subtitle: "가볍게 찍고 커피 마셔요",
      meta: "서초동 · 멤버 42",
      tag: "취미",
    },
    {
      title: "주말 보드게임",
      subtitle: "초보자도 편하게 오세요",
      meta: "잠원동 · 멤버 27",
      tag: "모임",
    },
  ],
  cafe: [
    {
      title: "조용한 작업 카페 추천",
      subtitle: "콘센트 자리 많은 곳 있을까요?",
      meta: "반포동 · 댓글 12",
      tag: "카페",
    },
    {
      title: "디카페인 맛있는 곳",
      subtitle: "저녁에 가도 부담 없는 곳",
      meta: "서초1동 · 조회 221",
      tag: "질문",
    },
    {
      title: "신상 베이커리 후기",
      subtitle: "소금빵은 꽤 괜찮았어요",
      meta: "양재동 · 조회 894",
      tag: "후기",
    },
  ],
  apt: [
    {
      title: "엘리베이터 점검 안내",
      subtitle: "내일 오전 10시부터래요",
      meta: "래미안 · 댓글 4",
      tag: "공지",
    },
    {
      title: "분리수거장 위치 문의",
      subtitle: "처음 이사 와서 헷갈리네요",
      meta: "서초아파트 · 조회 76",
      tag: "생활",
    },
    {
      title: "택배 보관함 오류",
      subtitle: "혹시 같은 문제 있으신가요?",
      meta: "반포자이 · 댓글 9",
      tag: "문의",
    },
  ],
}

const communityFilterCopy: Record<CommunityFilterValue, string> = {
  recommend: "지금 읽기 좋은 글을 우선 보여줍니다.",
  popular: "반응이 빠르게 올라온 글 위주로 정렬합니다.",
  info: "생활에 바로 도움이 되는 글만 모읍니다.",
  food: "맛집과 음식 이야기만 가볍게 훑습니다.",
}

const chatActionPreview: Record<ChatActionValue, string> = {
  gift: "선물하기 옵션이 열렸습니다.",
  board: "게시판에서 공지와 규칙을 확인합니다.",
  schedule: "다가오는 일정을 빠르게 확인합니다.",
  challenge: "현재 진행 중인 챌린지를 보여줍니다.",
}

function ExamplePagePreview({ examplePage }: { examplePage: ExamplePage }) {
  const [chatFilter, setChatFilter] = React.useState<PillDemoValue>("all")
  const [chatAction, setChatAction] = React.useState<ChatActionValue>("gift")
  const [communitySection, setCommunitySection] =
    React.useState<CommunitySectionValue>("life")
  const [communityFilter, setCommunityFilter] =
    React.useState<CommunityFilterValue>("recommend")
  const [calendarMode, setCalendarMode] =
    React.useState<CalendarControlValue>("details")
  const [calendarSelectedOptions, setCalendarSelectedOptions] = React.useState<
    Record<CalendarControlValue, boolean>
  >({
    compact: false,
    stacked: true,
    details: true,
    list: false,
  })
  const [commerceCategory, setCommerceCategory] =
    React.useState<CommerceCategoryValue>("outer")
  const [storeSection, setStoreSection] =
    React.useState<StoreSectionValue>("curation")

  function toggleCalendarOption(value: CalendarControlValue) {
    setCalendarSelectedOptions((current) => ({
      ...current,
      [value]: !current[value],
    }))
  }

  if (examplePage === "service-menu") {
    return (
      <ExampleScreen>
        <PageHeader
          size="regular"
          title="서비스"
          leading={
            <IconButton aria-label="뒤로가기">
              <span aria-hidden="true">‹</span>
            </IconButton>
          }
          trailing={
            <>
              <IconButton aria-label="검색">
                <Glyph label="S" />
              </IconButton>
              <IconButton aria-label="설정">
                <Glyph label="G" />
              </IconButton>
            </>
          }
        />
        <div className="px-5 pb-6">
          <div className="grid grid-cols-2 overflow-hidden rounded-[20px] bg-foreground/[0.055]">
            <button className="min-h-12 border-r border-foreground/[0.06] text-[0.9rem] font-semibold text-foreground/72">
              알림
            </button>
            <button className="min-h-12 text-[0.9rem] font-semibold text-foreground/72">
              고객센터
            </button>
          </div>
          <Stack gap="xs" className="mt-6">
            <ListItem title="매일 적립금 받는 출석체크" divider={false} />
            <ListItem title="주식 모으기" meta="수수료 무료" divider={false} />
            <ListItem title="증시 캘린더" divider={false} />
            <ListItem title="진행중인 이벤트" meta="7개" divider={false} />
          </Stack>
          <Divider className="my-5" />
          <Text variant="label" tone="muted">
            서비스 목록
          </Text>
          <Stack gap="none" className="mt-3">
            {["주식", "채권", "옵션", "계좌", "인사이트", "커뮤니티"].map(
              (label, index) => (
                <ListItem
                  key={label}
                  density="regular"
                  title={label}
                  subtitle={index % 2 === 0 ? "조건주문 · 알림" : undefined}
                  leading={
                    <Avatar size="sm" shape="rounded">
                      {label.slice(0, 1)}
                    </Avatar>
                  }
                  divider={false}
                />
              )
            )}
          </Stack>
        </div>
      </ExampleScreen>
    )
  }

  if (examplePage === "my-dashboard") {
    return (
      <ExampleScreen surface="muted">
        <PageHeader
          size="large"
          title="My Karrot"
          trailing={
            <IconButton aria-label="설정">
              <Glyph label="G" />
            </IconButton>
          }
        />
        <div className="space-y-3 px-5 pb-6">
          <NoticeBanner
            tone="neutral"
            size="md"
            title="동네 사람들이 아는 꿀팁을 확인해보세요."
            leading={
              <Avatar size="sm" shape="rounded">
                K
              </Avatar>
            }
            trailing={<span aria-hidden="true">×</span>}
          />
          <NoticeBanner
            tone="neutral"
            size="md"
            title="여름밤의장터"
            leading={<Avatar size="md">P</Avatar>}
            trailing={<span aria-hidden="true">›</span>}
          />
          <Surface variant="panel" padding="md" className="rounded-[26px]">
            <div className="flex items-center justify-between">
              <Text variant="label">Pay</Text>
              <Text variant="title">KRW 4,500</Text>
            </div>
            <Cluster gap="md" className="mt-4">
              <Button variant="ghost">Charge</Button>
              <Button variant="ghost">Send</Button>
              <Button className="ml-auto rounded-full">Pay</Button>
            </Cluster>
          </Surface>
          <Surface variant="panel" padding="md" className="rounded-[26px]">
            <Text variant="title">Services</Text>
            <ActionGrid className="mt-5" items={actionGridItems} />
          </Surface>
        </div>
      </ExampleScreen>
    )
  }

  if (examplePage === "chat-list") {
    return (
      <ExampleScreen>
        <PageHeader
          size="large"
          title="Chats"
          trailing={
            <>
              <IconButton aria-label="알림">
                <Glyph label="B" />
              </IconButton>
              <IconButton aria-label="설정">
                <Glyph label="G" />
              </IconButton>
            </>
          }
        />
        <div className="px-5 pb-6">
          <PillTabs
            ariaLabel="채팅 필터"
            options={pillDemoOptions}
            size="md"
            value={chatFilter}
            variant="chip"
            onValueChange={setChatFilter}
          />
          <NoticeBanner
            className="mt-5"
            tone="warning"
            size="md"
            title="Turn on notifications. You could miss important messages."
            trailing={<span aria-hidden="true">›</span>}
          />
          <AnimatedExamplePanel panelKey={`chat-list-${chatFilter}`}>
            <Stack gap="none" className="mt-4">
              {chatListRowsByFilter[chatFilter].map((row, index) => (
                <ListItem
                  key={row.title}
                  density="roomy"
                  title={row.title}
                  subtitle={row.subtitle}
                  leading={<Avatar size="md">{index + 1}</Avatar>}
                  meta={row.meta}
                  trailing={
                    row.badge ? <Badge tone="accent">{row.badge}</Badge> : null
                  }
                />
              ))}
            </Stack>
          </AnimatedExamplePanel>
        </div>
      </ExampleScreen>
    )
  }

  if (examplePage === "chat-thread") {
    return (
      <ExampleScreen>
        <PageHeader
          size="regular"
          align="center"
          title="테토키"
          meta={<Badge tone="danger">40.3°C</Badge>}
          leading={
            <IconButton aria-label="뒤로가기">
              <span aria-hidden="true">‹</span>
            </IconButton>
          }
          trailing={
            <IconButton aria-label="더보기">
              <Glyph label="M" />
            </IconButton>
          }
        />
        <div className="border-y border-foreground/[0.06] px-4 py-2.5">
          <PillTabs
            ariaLabel="채팅 액션"
            options={chatActionOptions}
            value={chatAction}
            variant="soft"
            size="sm"
            onValueChange={setChatAction}
          />
        </div>
        <AnimatedExamplePanel panelKey={`chat-thread-${chatAction}`}>
          <Stack gap="sm" className="px-5 pt-4">
            <NoticeBanner
              size="sm"
              tone="neutral"
              title={chatActionPreview[chatAction]}
            />
            <ChatBubble side="outgoing" meta="10:29">
              재미있게 운동해보려고 들어왔어요
            </ChatBubble>
            <ChatBubble side="incoming" meta="10:30">
              일정 보고 놀러오세요
            </ChatBubble>
            <ChatBubble side="outgoing" meta="12:57">
              혹시 비용이 있는 모임인가요?
            </ChatBubble>
            <ChatBubble side="incoming" meta="12:59">
              분위기 보시고 결정하세요. 부족한 분들은 개인 레슨도 있어요.
            </ChatBubble>
          </Stack>
        </AnimatedExamplePanel>
        <div className="mt-auto flex items-center gap-2 px-4 pb-5">
          <IconButton aria-label="첨부">
            <span aria-hidden="true">+</span>
          </IconButton>
          <MessageInput className="flex-1" placeholder="Write a message here" />
          <IconButton aria-label="전송">
            <span aria-hidden="true">›</span>
          </IconButton>
        </div>
      </ExampleScreen>
    )
  }

  if (examplePage === "social-dm") {
    return (
      <ExampleScreen>
        <AppBar
          align="center"
          size="regular"
          title="masasa_film"
          subtitle="프로필 상태 업데이트 있음"
          trailing={
            <IconButton aria-label="메시지 작성">
              <Glyph label="W" />
            </IconButton>
          }
        />
        <div className="space-y-5 px-5 pb-6">
          <label className="flex min-h-12 items-center gap-3 rounded-[18px] bg-foreground/[0.055] px-4 text-foreground/52 focus-within:ring-2 focus-within:ring-[var(--ds-accent)]/25">
            <span className="sr-only">DM 검색</span>
            <Glyph label="S" />
            <input
              className="min-w-0 flex-1 bg-transparent text-[1rem] font-semibold outline-none placeholder:text-foreground/44"
              placeholder="Search"
              type="search"
            />
          </label>
          <ActionGrid
            columns="two"
            gap="lg"
            items={[
              {
                id: "note",
                label: "Your note",
                description: "Location off",
                icon: <Avatar size="xl">Me</Avatar>,
              },
              {
                id: "map",
                label: "Map",
                description: "Nearby friends",
                icon: (
                  <span className="grid size-20 place-items-center rounded-full bg-[linear-gradient(135deg,#9ed7ff,#dff7c8)] text-sm font-semibold text-foreground/70">
                    Map
                  </span>
                ),
              },
            ]}
          />
          <div className="flex items-center justify-between">
            <Text variant="title">Messages</Text>
            <Text variant="label" tone="muted">
              Requests
            </Text>
          </div>
          <Text tone="secondary">
            Chats will appear here after you send or receive a message.{" "}
            <span className="font-semibold text-[#4057ff]">Get started</span>
          </Text>
          <Text variant="title">Suggestions</Text>
          <Stack gap="sm">
            {[
              ["트렌드포털", "Tap to chat", "Tp"],
              ["스테이폴리오 | 10년의 큐레이션", "Tap to chat", "SF"],
              ["경제&라이프스타일 매거진 | 에크케", "Tap to chat", "ek"],
            ].map(([title, subtitle, avatar]) => (
              <ListItem
                key={title}
                density="regular"
                divider={false}
                title={title}
                subtitle={subtitle}
                leading={<Avatar size="lg">{avatar}</Avatar>}
                trailing={
                  <IconButton aria-label={`${title}에게 사진 보내기`}>
                    <Glyph label="C" />
                  </IconButton>
                }
              />
            ))}
          </Stack>
          <NoticeBanner
            tone="neutral"
            size="sm"
            title="Your notifications are off."
            action="Turn on"
            leading={<Glyph label="N" />}
            trailing={<span aria-hidden="true">×</span>}
          />
        </div>
      </ExampleScreen>
    )
  }

  if (examplePage === "calendar-toolbar") {
    return (
      <ExampleScreen>
        <div className="relative px-5 pt-5">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              className="h-12 rounded-full bg-white/86 px-4 text-[1rem] shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
            >
              <span aria-hidden="true">‹</span>
              2026
            </Button>
            <div className="flex min-h-12 items-center gap-1 rounded-full bg-white/88 p-1 shadow-[0_14px_34px_rgba(15,23,42,0.1)] backdrop-blur-2xl">
              <IconButton aria-label="보기 메뉴" className="shadow-none">
                <Glyph label="V" />
              </IconButton>
              <IconButton aria-label="검색" className="shadow-none">
                <Glyph label="S" />
              </IconButton>
              <FormatFilter
                title="View filters"
                triggerLabel="보기 옵션 선택"
                description="월 화면에서 동시에 켤 표시 방식을 고릅니다."
                options={calendarControlOptions}
                selected={calendarSelectedOptions}
                onToggle={toggleCalendarOption}
              />
            </div>
          </div>
          <Text
            as="h2"
            className="mt-8 text-[3rem] leading-none font-semibold tracking-normal"
          >
            April
          </Text>
          <div className="mt-5">
            <SegmentedControl
              ariaLabel="달력 보기 방식"
              options={calendarSegmentOptions}
              value={calendarMode}
              size="sm"
              onValueChange={setCalendarMode}
            />
          </div>
          <Surface
            variant="floating"
            padding="sm"
            className="absolute top-[5.3rem] right-5 z-20 w-[16rem] rounded-[2rem]"
          >
            <Stack gap="xs">
              {calendarControlOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-checked={calendarSelectedOptions[option.value]}
                  role="menuitemcheckbox"
                  className="flex min-h-12 items-center gap-3 rounded-[18px] px-3 text-left text-[1rem] font-semibold transition-colors outline-none hover:bg-foreground/[0.055] focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]/35"
                  onClick={() => toggleCalendarOption(option.value)}
                >
                  <span className="grid size-6 place-items-center">
                    {calendarSelectedOptions[option.value] ? "✓" : null}
                  </span>
                  <Glyph label={option.value === "list" ? "L" : "M"} />
                  <span>{option.label}</span>
                </button>
              ))}
            </Stack>
          </Surface>
        </div>
        <MiniEventMonth mode={calendarMode} />
      </ExampleScreen>
    )
  }

  if (examplePage === "commerce-category") {
    return (
      <ExampleScreen>
        <PageHeader
          size="regular"
          align="center"
          title="남성의류"
          meta={<span aria-hidden="true">⌄</span>}
          leading={
            <IconButton aria-label="뒤로가기">
              <span aria-hidden="true">‹</span>
            </IconButton>
          }
          trailing={
            <>
              <IconButton aria-label="검색">
                <Glyph label="S" />
              </IconButton>
              <IconButton aria-label="장바구니">
                <Glyph label="B" />
              </IconButton>
            </>
          }
        />
        <div className="border-b border-foreground/[0.07] px-5 pb-3">
          <PillTabs
            ariaLabel="상위 카테고리"
            options={commerceCategoryOptions}
            value={commerceCategory}
            variant="text"
            size="md"
            onValueChange={setCommerceCategory}
          />
        </div>
        <div className="border-b border-foreground/[0.07] px-5 py-3">
          <PillTabs
            ariaLabel="상품 필터"
            options={[
              { value: "all", label: "전체" },
              { value: "jacket", label: "재킷" },
              { value: "denim", label: "데님" },
              { value: "training", label: "트레이닝" },
            ]}
            value="all"
            variant="chip"
            size="sm"
            onValueChange={() => undefined}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-foreground/[0.07] px-5 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["단독", "색상", "가격대", "상품정보", "브랜드"].map((label) => (
            <Button
              key={label}
              variant="secondary"
              className="h-10 rounded-full bg-foreground/[0.055] px-4 text-foreground/70"
            >
              {label}⌄
            </Button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-6">
          <Grid columns="three" gap="sm">
            {commerceProducts.map((product) => (
              <CommerceProductCard key={product.name} product={product} />
            ))}
          </Grid>
        </div>
      </ExampleScreen>
    )
  }

  if (examplePage === "store-home") {
    return (
      <ExampleScreen>
        <AppBar
          size="large"
          title="스토어"
          leading={
            <span className="grid size-8 place-items-center rounded-[8px] bg-[#4ec260] text-base font-semibold text-white">
              N
            </span>
          }
          trailing={
            <>
              <IconButton aria-label="알림">
                <Glyph label="N" />
              </IconButton>
              <IconButton aria-label="장바구니">
                <Glyph label="B" />
              </IconButton>
            </>
          }
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          <label className="flex min-h-12 items-center gap-3 rounded-[18px] border border-[#6b48f6]/70 bg-white px-4 text-foreground/52 focus-within:ring-2 focus-within:ring-[#6b48f6]/25">
            <span className="sr-only">스토어 검색</span>
            <Glyph label="S" />
            <input
              className="min-w-0 flex-1 bg-transparent text-[1rem] font-semibold outline-none placeholder:text-foreground/44"
              placeholder="상품명 또는 브랜드 입력"
              type="search"
            />
            <Glyph label="C" />
          </label>
          <section className="-mx-5 mt-4 bg-[#a9dd72] px-5 py-7 text-white">
            <div className="grid grid-cols-[1fr_7rem] items-center gap-3">
              <div>
                <Text
                  as="h2"
                  className="text-[1.55rem] leading-8 font-semibold text-white"
                >
                  3% 추가 적립 멤데이 오픈까지 단 하루!
                </Text>
                <Text className="mt-2 font-semibold text-white/90">
                  오직 하루만 드리는 특별 적립 찬스
                </Text>
              </div>
              <div className="grid aspect-square place-items-center rounded-full bg-white/30 text-[2rem] font-semibold">
                3%
              </div>
            </div>
          </section>
          <ActionGrid
            columns="four"
            gap="md"
            items={storeShortcutItems}
            className="mt-5"
          />
          <PillTabs
            ariaLabel="스토어 섹션"
            className="mt-6"
            options={storeSectionOptions}
            value={storeSection}
            variant="text"
            size="md"
            onValueChange={setStoreSection}
          />
          <Text variant="title" className="mt-5">
            <span className="text-[#6b48f6]">21nak</span>님을 위한 큐레이션
          </Text>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {["FOR YOU", "CAP", "SHIRT", "POUCH", "JEWEL", "TOY"].map(
              (label, index) => (
                <StoreBadge
                  key={label}
                  label={label}
                  size="lg"
                  tone={
                    ["violet", "charcoal", "silver", "navy", "cream", "coral"][
                      index
                    ] ?? "violet"
                  }
                />
              )
            )}
          </div>
          <Grid columns="three" gap="sm" className="mt-5">
            {[
              { label: "급상승 스타일", tone: "navy" },
              { label: "여름 모자", tone: "sage" },
              { label: "지난주 클릭", tone: "silver" },
            ].map(({ label, tone }) => (
              <CurationTile key={label} label={label} tone={tone} />
            ))}
          </Grid>
        </div>
      </ExampleScreen>
    )
  }

  if (examplePage === "social-feed") {
    return (
      <ExampleScreen>
        <div className="min-h-0 flex-1 overflow-y-auto pb-6">
          <FeedPostPreview
            author="lingrongdang"
            caption="홍태준이 자존감을 지키는 법..."
            date="April 17"
            tone="portrait"
          />
          <FeedPostPreview
            author="dicero_kr"
            caption="새 던전 이벤트"
            date="April 18"
            tone="game"
          />
        </div>
      </ExampleScreen>
    )
  }

  if (examplePage === "finance-home") {
    return (
      <ExampleScreen>
        <PageHeader
          size="large"
          title="토스증권"
          meta={
            <span>
              나스닥 100 선물{" "}
              <span className="text-[var(--ds-danger)]">
                <AnimatedNumber
                  animationKey="finance-home-market-index"
                  respectReducedMotion={false}
                  value="27,435.00"
                />{" "}
                +1.8%
              </span>
            </span>
          }
          trailing={
            <>
              <IconButton aria-label="검색">
                <Glyph label="S" />
              </IconButton>
              <IconButton aria-label="메뉴">
                <Glyph label="M" />
              </IconButton>
            </>
          }
        />
        <div className="px-5 pb-6">
          <NoticeBanner
            size="md"
            title="국내 어닝콜도 이제 들을 수 있어요"
            action="일정 보기 ›"
            leading={
              <Avatar size="sm" shape="rounded" tone="accent">
                A
              </Avatar>
            }
          />
          <Text variant="title" className="mt-6">
            기본계좌
          </Text>
          <Grid columns="two" gap="sm" className="mt-3">
            <ValueCard
              label="원화"
              value={
                <>
                  <AnimatedNumber
                    animationKey="finance-home-krw"
                    respectReducedMotion={false}
                    value={14}
                  />
                  원
                </>
              }
            />
            <ValueCard
              label="달러"
              value={
                <>
                  <span>$</span>
                  <AnimatedNumber
                    animationKey="finance-home-usd"
                    respectReducedMotion={false}
                    value="2,818"
                  />
                </>
              }
            />
          </Grid>
          <Text variant="title" className="mt-7">
            내 투자
          </Text>
          <Text
            as="p"
            className="mt-1 flex items-baseline text-[2.05rem] leading-none font-semibold"
          >
            <span className="leading-none">$</span>
            <AnimatedNumber
              animationKey="finance-home-invested-total"
              respectReducedMotion={false}
              value="8,663.06"
            />
          </Text>
          <Text tone="accent" className="mt-2 flex items-baseline leading-none">
            <span className="leading-none">-$</span>
            <AnimatedNumber
              animationKey="finance-home-invested-delta"
              respectReducedMotion={false}
              value="305.03"
            />
            <span className="ml-1 leading-none">(3.4%)</span>
          </Text>
          <Stack gap="none" className="mt-6">
            <ListItem
              title="SIVR"
              subtitle="83주"
              trailing={
                <Text variant="label">
                  $
                  <AnimatedNumber
                    animationKey="finance-home-sivr"
                    respectReducedMotion={false}
                    value="5,987.05"
                  />
                </Text>
              }
              leading={<Avatar size="md">S</Avatar>}
            />
            <ListItem
              title="나이키"
              subtitle="60주"
              trailing={
                <Text variant="label">
                  $
                  <AnimatedNumber
                    animationKey="finance-home-nike"
                    respectReducedMotion={false}
                    value="2,676.01"
                  />
                </Text>
              }
              leading={<Avatar size="md">N</Avatar>}
            />
          </Stack>
        </div>
      </ExampleScreen>
    )
  }

  return (
    <ExampleScreen>
      <PageHeader
        size="large"
        title="Community"
        trailing={
          <>
            <IconButton aria-label="검색">
              <Glyph label="S" />
            </IconButton>
            <IconButton aria-label="알림">
              <Glyph label="B" />
            </IconButton>
            <IconButton aria-label="메뉴">
              <Glyph label="M" />
            </IconButton>
          </>
        }
      />
      <div className="px-5 pb-24">
        <PillTabs
          ariaLabel="커뮤니티 섹션"
          options={communitySectionOptions}
          value={communitySection}
          variant="text"
          size="md"
          onValueChange={setCommunitySection}
        />
        <PillTabs
          ariaLabel="커뮤니티 필터"
          className="mt-4"
          options={communityFilterOptions}
          value={communityFilter}
          variant="chip"
          size="md"
          onValueChange={setCommunityFilter}
        />
        <AnimatedExamplePanel
          panelKey={`community-${communitySection}-${communityFilter}`}
        >
          <Text variant="caption" tone="muted" className="mt-4">
            {communityFilterCopy[communityFilter]}
          </Text>
          <Stack gap="none" className="mt-2">
            {communityRowsBySection[communitySection].map((row, index) => (
              <ListItem
                key={`${row.title}-${communityFilter}`}
                density="roomy"
                title={row.title}
                subtitle={row.subtitle}
                description={row.meta}
                leading={<Badge tone="neutral">{row.tag}</Badge>}
                trailing={
                  <Avatar size="lg" shape="rounded">
                    {index + 1}
                  </Avatar>
                }
              />
            ))}
          </Stack>
        </AnimatedExamplePanel>
      </div>
      <FloatingActionButton
        className="absolute right-5 bottom-8"
        icon={<span aria-hidden="true">+</span>}
      >
        글쓰기
      </FloatingActionButton>
    </ExampleScreen>
  )
}

function MiniEventMonth({ mode }: { mode: CalendarControlValue }) {
  const days = Array.from({ length: 28 }, (_, index) => index + 1)

  return (
    <div className="mt-5 grid flex-1 grid-cols-7 overflow-hidden border-t border-foreground/[0.08] opacity-70">
      {days.map((day) => (
        <div
          key={day}
          className="min-h-[6rem] border-r border-b border-foreground/[0.06] px-1.5 py-2"
        >
          <div
            className={cn(
              "text-center text-[1.05rem] font-semibold tabular-nums",
              day % 7 === 5 ? "text-foreground/42" : "text-foreground"
            )}
          >
            {day}
          </div>
          <div className="mt-2 space-y-1">
            {day % 3 === 0 ? (
              <EventPill
                label={mode === "list" ? "List" : "Daily"}
                tone="lavender"
              />
            ) : null}
            {day % 4 === 0 ? <EventPill label="memo" tone="green" /> : null}
            {day % 5 === 0 ? <EventPill label="7 AM" tone="peach" /> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function EventPill({
  label,
  tone,
}: {
  label: string
  tone: "green" | "lavender" | "peach"
}) {
  return (
    <div
      className={cn(
        "truncate rounded-md px-1.5 py-1 text-[0.66rem] leading-none font-semibold",
        tone === "lavender" && "bg-[#c6c4da] text-[#070737]",
        tone === "green" && "bg-[#d9f3cc] text-[#477f38]",
        tone === "peach" && "bg-[#f8dfbf] text-[#8b5826]"
      )}
    >
      {label}
    </div>
  )
}

function CommerceProductCard({
  product,
}: {
  product: (typeof commerceProducts)[number]
}) {
  return (
    <article className="min-w-0">
      <ProductArt tone={product.color} />
      <div className="mt-2 space-y-1 px-1">
        <Text variant="label" className="truncate">
          {product.brand} <span aria-hidden="true">›</span>
        </Text>
        <Text className="line-clamp-2 text-[0.8rem] leading-5">
          {product.name}
        </Text>
        <Text variant="label" className="tabular-nums">
          {product.discount ? (
            <span className="mr-1 text-[var(--ds-accent)]">
              {product.discount}
            </span>
          ) : null}
          {product.price}
        </Text>
        <Text variant="caption" tone="muted">
          likes {product.likes} · 5.0
        </Text>
      </div>
    </article>
  )
}

function ProductArt({ tone }: { tone: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative aspect-square overflow-hidden rounded-[10px] bg-foreground/[0.055]",
        tone === "sage" && "bg-[#cbd3bd]",
        tone === "silver" && "bg-[#d9dde1]",
        tone === "black" && "bg-[#191a1d]",
        tone === "navy" && "bg-[#222b35]",
        tone === "charcoal" && "bg-[#32343a]",
        tone === "mist" && "bg-[#cfd4d1]"
      )}
    >
      <span className="absolute top-2 right-2 text-sm font-semibold text-white drop-shadow">
        H
      </span>
      <span
        className={cn(
          "absolute top-[23%] left-1/2 h-[54%] w-[46%] -translate-x-1/2 rounded-t-[42%] rounded-b-[16%] bg-white/58 shadow-[inset_0_-12px_20px_rgba(15,23,42,0.12)]",
          tone === "black" && "bg-neutral-950",
          tone === "navy" && "bg-[#1c2632]",
          tone === "charcoal" && "bg-[#24262b]"
        )}
      />
      <span className="absolute top-[34%] left-[22%] h-[34%] w-[20%] rotate-12 rounded-full bg-white/34" />
      <span className="absolute top-[34%] right-[22%] h-[34%] w-[20%] -rotate-12 rounded-full bg-white/34" />
    </div>
  )
}

function StoreBadge({
  label,
  size = "md",
  tone,
}: {
  label: string
  size?: "md" | "lg"
  tone: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full text-center text-[0.68rem] leading-none font-semibold text-white",
        size === "md" ? "size-14" : "size-16",
        tone === "red" && "bg-[#d9504a]",
        tone === "green" && "bg-[#4cbf68]",
        tone === "coral" && "bg-[#e4604d]",
        tone === "blue" && "bg-[#7aa6ff]",
        tone === "cream" && "bg-[#f2eadc] text-[#b56b2f]",
        tone === "violet" && "bg-[#6b48f6]",
        tone === "teal" && "bg-[#1b6d5a]",
        tone === "charcoal" && "bg-[#24272d]",
        tone === "silver" && "bg-[#d9dde1] text-foreground",
        tone === "navy" && "bg-[#253244]",
        tone === "sage" && "bg-[#cbd3bd] text-foreground"
      )}
    >
      {label}
    </span>
  )
}

function CurationTile({ label, tone }: { label: string; tone: string }) {
  return (
    <article className="overflow-hidden rounded-[14px] bg-white shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)]">
      <div className="p-2">
        <Badge tone="accent" size="sm">
          {label}
        </Badge>
      </div>
      <ProductArt tone={tone} />
    </article>
  )
}

function FeedPostPreview({
  author,
  caption,
  date,
  tone,
}: {
  author: string
  caption: string
  date: string
  tone: "game" | "portrait"
}) {
  return (
    <article className="border-b border-foreground/[0.08] bg-white">
      <AppBar
        size="compact"
        title={author}
        subtitle={`${author} · Original audio`}
        leading={<Avatar size="sm">{author.slice(0, 2)}</Avatar>}
        trailing={
          <IconButton
            aria-label={`${author} 더보기`}
            className="border-0 shadow-none"
          >
            <Glyph label="M" />
          </IconButton>
        }
      />
      <div
        role="img"
        aria-label={`${author} 피드 미디어`}
        className={cn(
          "relative aspect-[1.08/1] overflow-hidden",
          tone === "portrait"
            ? "bg-[linear-gradient(160deg,#2b1b18,#5d4137_55%,#211714)]"
            : "bg-[linear-gradient(160deg,#1a2035,#513d75_48%,#302034)]"
        )}
      >
        {tone === "portrait" ? (
          <div className="absolute inset-x-[22%] top-[12%] bottom-0 rounded-t-full bg-[linear-gradient(180deg,#d0a485,#4a2c26)] opacity-90" />
        ) : (
          <>
            <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[#3b3347]" />
            <div className="absolute top-[28%] left-[28%] size-36 rounded-[38%] bg-[#a36ade] shadow-[0_0_40px_rgba(163,106,222,0.5)]" />
            <div className="absolute bottom-[14%] left-[10%] size-16 rounded-[32%] bg-[#d6c178]" />
            <div className="absolute right-[12%] bottom-[12%] size-14 rounded-[32%] bg-[#95b24f]" />
          </>
        )}
        <div className="absolute inset-x-8 bottom-8 text-center text-[1.3rem] leading-8 font-semibold text-white drop-shadow">
          {tone === "portrait"
            ? "나와 결이 맞지 않을 거라고 생각한 사람을 만남으로써"
            : "새로운 던전에서 보상이 기다립니다"}
        </div>
      </div>
      <div className="space-y-2 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[0.95rem] font-semibold">
            <span>H 9,886</span>
            <span>C 14</span>
            <span>S 2,401</span>
          </div>
          <Glyph label="B" />
        </div>
        <Text variant="label">
          {author} <span className="font-medium">{caption}</span>{" "}
          <span className="text-foreground/48">more</span>
        </Text>
        <Text variant="caption" tone="muted">
          {date}
        </Text>
      </div>
    </article>
  )
}

function AnimatedExamplePanel({
  children,
  panelKey,
}: {
  children: React.ReactNode
  panelKey: string
}) {
  const reducedMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={panelKey}
        initial={{ opacity: 0, y: reducedMotion ? 0 : 8, scale: 0.992 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reducedMotion ? 0 : -6, scale: 0.996 }}
        transition={
          reducedMotion
            ? { duration: motionTokens.duration.instant }
            : {
                duration: motionTokens.duration.base,
                ease: motionTokens.ease.enter,
              }
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

function ExampleScreen({
  children,
  surface = "canvas",
}: {
  children: React.ReactNode
  surface?: "canvas" | "muted"
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-full flex-col overflow-hidden pt-[max(1.25rem,env(safe-area-inset-top))]",
        surface === "muted"
          ? "bg-foreground/[0.045]"
          : "bg-[var(--calendar-app-bg)]"
      )}
    >
      {children}
    </div>
  )
}

function PreviewCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full bg-[var(--ds-surface-inset)] sm:mx-auto sm:rounded-[34px] sm:p-2 sm:shadow-[0_28px_80px_rgba(15,23,42,0.16)]">
      <div className="relative h-[calc(100dvh-13.75rem)] min-h-[560px] overflow-hidden bg-[var(--calendar-app-bg)] sm:h-[780px] sm:max-h-[calc(100dvh-7rem)] sm:rounded-[28px] sm:ring-1 sm:ring-foreground/[0.08]">
        {children}
      </div>
    </div>
  )
}

function MobileTopBar({
  activeComponentId,
}: {
  activeComponentId: ComponentId
}) {
  const item = componentItems.find(
    (candidate) => candidate.id === activeComponentId
  )

  return (
    <div className="px-5 pt-[max(3.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2">
        <div className="min-h-11 min-w-0 flex-1 rounded-full bg-[var(--calendar-nav)]/88 px-4 py-2.5 text-left text-[0.94rem] font-semibold text-foreground shadow-[0_10px_26px_rgba(15,23,42,0.06)] backdrop-blur-[18px]">
          <span>Design System</span>
          <span aria-hidden="true" className="mx-2 text-foreground/16">
            |
          </span>
          <span className="text-[0.76rem] font-medium text-foreground/58">
            {item?.category}
          </span>
        </div>
        <IconButton aria-label="설정 열기">
          <span aria-hidden="true" className="text-sm font-semibold">
            S
          </span>
        </IconButton>
      </div>
    </div>
  )
}

function PhoneSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode
  description: string
  title: string
}) {
  return (
    <section className="min-h-full">
      <p className="text-[0.72rem] font-semibold tracking-normal text-foreground/42 uppercase">
        Preview
      </p>
      <h3 className="mt-1.5 text-[1.7rem] leading-8 font-semibold text-balance">
        {title}
      </h3>
      <p className="mt-2 text-[0.95rem] leading-6 text-foreground/58">
        {description}
      </p>
      {children}
    </section>
  )
}

function ComponentUsage({ item }: { item: ComponentItem }) {
  return (
    <section className="mx-3 mt-4 rounded-[28px] bg-background/58 p-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:mx-0 sm:mt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.72rem] font-semibold tracking-normal text-foreground/42 uppercase">
            Usage
          </p>
          <h2 className="mt-1 text-xl font-semibold">{item.title}</h2>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-foreground/58">
        {item.description}
      </p>
    </section>
  )
}

function ListRow({
  accessory,
  description,
  strong = false,
  title,
}: {
  accessory?: React.ReactNode
  description?: string
  strong?: boolean
  title: string
}) {
  return (
    <motion.div
      layout
      variants={listItemVariants}
      transition={motionTokens.intent.selectionFlow}
      className="flex min-h-14 items-center justify-between gap-3 border-b border-foreground/[0.07] py-3"
    >
      <div className="min-w-0">
        <Text variant="label" className={cn(strong && "text-[1rem]")}>
          {title}
        </Text>
        {description ? (
          <Text variant="caption" tone="muted" className="mt-0.5">
            {description}
          </Text>
        ) : null}
      </div>
      {accessory ? <div className="shrink-0">{accessory}</div> : null}
    </motion.div>
  )
}

function GridPreviewTile({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      layout
      variants={listItemVariants}
      transition={motionTokens.intent.selectionFlow}
      className="min-h-[7.5rem] rounded-[24px] bg-background/62 p-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)]"
    >
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="display" className="mt-4">
        {value}
      </Text>
    </motion.div>
  )
}

function Glyph({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-5 place-items-center rounded-full bg-current/12 text-[0.62rem] leading-none font-semibold"
    >
      {label}
    </span>
  )
}

function ControlGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>
}

function ControlSegment<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: T) => void
  options: readonly T[]
  value: T
}) {
  return (
    <ControlOptions
      label={label}
      onChange={onChange}
      options={options.map((option) => ({ label: option, value: option }))}
      value={value}
    />
  )
}

function ControlOptions<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: T) => void
  options: Array<{ label: string; value: T }>
  value: T
}) {
  const groupId = React.useId()
  const reducedMotion = useReducedMotion()

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-foreground/72">{label}</p>
      <LayoutGroup id={groupId}>
        <div className="grid gap-1 rounded-[18px] bg-black/[0.045] p-1">
          {options.map((option) => {
            const selected = value === option.value

            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "relative min-h-10 rounded-[14px] px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]/35",
                  selected
                    ? "text-foreground"
                    : "text-foreground/48 hover:text-foreground/72"
                )}
                onClick={() => onChange(option.value)}
              >
                {selected ? (
                  <motion.span
                    layoutId="control-option-selection"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[14px] bg-white shadow-[var(--ds-elevation-1)]"
                    transition={
                      reducedMotion
                        ? { duration: motionTokens.duration.instant }
                        : motionTokens.intent.selectionFlow
                    }
                  />
                ) : null}
                <span className="relative z-10">{option.label}</span>
              </button>
            )
          })}
        </div>
      </LayoutGroup>
    </div>
  )
}

function ToggleControl({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3 rounded-[18px] bg-background/58 px-3">
      <span className="text-sm font-medium text-foreground/72">{label}</span>
      <input
        checked={checked}
        className="size-5 accent-[var(--ds-accent)]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  )
}

function StatusBadge({
  compact = false,
  status,
}: {
  compact?: boolean
  status: ComponentStatus
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-1 font-semibold",
        compact ? "text-[0.62rem]" : "text-[0.68rem]",
        status === "사용 가능" && "bg-emerald-500/10 text-emerald-700",
        status === "초안" && "bg-[var(--ds-accent)]/10 text-[var(--ds-accent)]",
        status === "패턴" && "bg-sky-500/10 text-sky-700",
        status === "토큰" && "bg-foreground/[0.06] text-foreground/52"
      )}
    >
      {status}
    </span>
  )
}
