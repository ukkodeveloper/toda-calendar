import type { SVGProps } from "react"

/**
 * 채팅 입력창 헤더에 쓰는 커스텀 액션 아이콘.
 * Astryx 기본 아이콘 세트에 확성기·카메라가 없어 직접 그린다.
 * 기본 아이콘 스타일과 맞춤: 24×24, fill none, stroke currentColor, width 1.5, round.
 * `<Icon icon={DeclareIcon} />` 컴포넌트 모드로 넘겨 크기·색을 위임한다.
 */

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
}

/** 공표(사건 등록) — 확성기. 스스로 공약을 방 전원에게 알린다. */
export function DeclareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1Z" />
      <path d="M18 9a4 4 0 0 1 0 6" />
      <path d="M7 15v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2" />
    </svg>
  )
}

/** 목격(고발) — 눈. 공약 위반을 목격해 고발한다. */
export function WitnessIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
