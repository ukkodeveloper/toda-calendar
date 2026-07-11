"use client"

import { type ReactNode, type Ref } from "react"

import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { Badge, type BadgeTone } from "@workspace/ui/components/badge"
import { ColorAvatar } from "@workspace/ui/components/color-avatar"
import { Icon, type IconSvgElement } from "@workspace/ui/components/icon"
import { cn } from "@workspace/ui/lib/utils"

/**
 * CaseCard — "누구의 어떤 사건"을 한 행에 담는 상태 카드(리스트·스트림 공용).
 * ActionCard 처럼 Base UI Button(headless) 위라 포커스·키보드·네이티브 button 이 보장된다(규칙5·7).
 *
 * 구조: [정체성 아바타 + 상태 아이콘 점] · [제목 + 피고/상태 부제] · [상태 pill + chevron].
 *  - 아바타(ColorAvatar seed)로 피고가 "누구"인지, 코너 점의 색·아이콘으로 사건이 "어떤 상태"인지 즉시 스캔된다.
 *  - 상태는 도메인 값이 아니라 UI 속성(tone/statusIcon/statusLabel)으로 받는다(design-system.ts 원칙).
 *    도메인(등록/재판중/유·무죄)→tone 매핑은 소비 앱이 소유한다.
 *  - 색·라운드·타이포는 semantic 토큰만(규칙1·2·3), 변이는 CVA 로만(규칙8).
 */
const caseCardVariants = cva(
  "group/case-card flex w-full items-center gap-3 rounded-panel border bg-surface-raised px-3.5 py-3 text-left shadow-elevation-1 transition-[background-color,box-shadow,transform] outline-none hover:bg-surface-hover hover:shadow-elevation-2 focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface-canvas active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      selected: {
        true: "border-border-brand ring-2 ring-ring-focus",
        false: "border-border-subtle",
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
)

/** 아바타 코너의 상태 점 — tone 색을 채우고 상태 아이콘을 얹는다. */
const caseStatusDotVariants = cva(
  "absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-pill ring-2 ring-surface-raised group-hover/case-card:ring-surface-hover [&_svg]:size-3",
  {
    variants: {
      tone: {
        neutral:
          "border border-border-strong bg-surface-hover text-text-secondary",
        brand: "bg-fill-brand text-text-on-brand",
        success: "bg-fill-success text-text-on-fill",
        danger: "bg-fill-danger text-text-on-fill",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

type CaseCardTone = NonNullable<
  VariantProps<typeof caseStatusDotVariants>["tone"]
>

type CaseCardProps = Omit<ButtonPrimitive.Props, "title"> & {
  /** 상태 색조. 소비 앱이 도메인 상태에서 파생해 넘긴다. */
  tone?: CaseCardTone
  /** 코너 점·pill 에 쓰는 상태 아이콘. */
  statusIcon: IconSvgElement
  /** 우측 pill 라벨(짧게: 접수·재판 중·유죄·무죄). */
  statusLabel: string
  /** 피고 정체성 아바타 seed(닉네임 권장). */
  avatarSeed: string
  /** 선택: 피고 정체성 hex 색. 없으면 seed 로 파생. */
  avatarColor?: string
  /** 사건 제목 — "어떤 사건". */
  title: ReactNode
  /** 부제 — "피고 {이름} · 상태" 등. */
  subtitle?: ReactNode
  /** 하이라이트(목록에서 방금 그 사건 강조). */
  selected?: boolean
  ref?: Ref<HTMLButtonElement>
}

function CaseCard({
  className,
  tone = "neutral",
  statusIcon,
  statusLabel,
  avatarSeed,
  avatarColor,
  title,
  subtitle,
  selected,
  type,
  ref,
  ...props
}: CaseCardProps) {
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="case-card"
      type={props.render ? type : (type ?? "button")}
      className={cn(caseCardVariants({ selected }), className)}
      {...props}
    >
      <span className="relative shrink-0">
        <ColorAvatar
          seed={avatarSeed}
          color={avatarColor}
          size="sm"
          shape="rounded"
          animated={false}
        />
        <span className={cn(caseStatusDotVariants({ tone }))}>
          <Icon icon={statusIcon} />
        </span>
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body font-strong text-text-primary">
          {title}
        </span>
        {subtitle ? (
          <span className="truncate text-caption font-emphasis text-text-tertiary">
            {subtitle}
          </span>
        ) : null}
      </span>

      <span className="flex shrink-0 items-center gap-1.5">
        <Badge tone={tone as BadgeTone} size="sm">
          {statusLabel}
        </Badge>
        <span className="flex text-text-tertiary transition-transform group-hover/case-card:translate-x-0.5">
          <Icon icon={ArrowRight01Icon} size="sm" />
        </span>
      </span>
    </ButtonPrimitive>
  )
}

export { CaseCard, caseCardVariants }
export type { CaseCardProps, CaseCardTone }
