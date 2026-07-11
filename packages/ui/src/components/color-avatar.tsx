import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type Ref,
} from "react"

/**
 * ColorAvatar — 색/seed 하나로 만드는 유기적 그라디언트 오브 아바타.
 *
 * 왜 별도 컴포넌트인가: Avatar 는 이니셜·이미지 컨테이너(순수 표현)지만
 * 이건 seed 로부터 색을 파생해 그리는 "생성 그래픽"이다. 관심사가 다르다.
 * size/shape 스케일은 Avatar(avatarVariants)와 같은 값으로 맞춰 정합.
 *
 * 매끄러움: feGaussianBlur(래스터·이음새) 대신 **투명으로 페더된 radial blob** 여러 겹을
 * base 구(球) 위에 얹어 색이 경계 없이 녹게 한다. 벡터라 어떤 크기에서도 크리스프.
 *
 * host-agnostic: 박스 지오메트리를 인라인 스타일로 그려 Tailwind 없는 호스트
 * (마이그레이션 중인 Astryx 앱 등)에서도 그대로 렌더된다. 오브는 순수 SVG.
 * 유일한 외부 CSS 는 ambient 모션 키프레임(`ds-orb-*`, globals.css) 뿐 —
 * 없으면 모션만 빠지고 오브는 정상(graceful degradation).
 *
 * 색은 유저 데이터(정체성 색)라 토큰이 아니다 — 이미지 픽셀과 같은 콘텐츠.
 * (규칙1은 하드코딩 "디자인 토큰" 금지지, 데이터 파생색 금지가 아니다.)
 * 유효한 hex(`#RRGGBB`)가 오면 존중하고, 아니면 seed 해시로 hue 를 뽑아 유저별 안정 룩.
 *
 * 모션: animated 면 blob 이 미세하게 드리프트. reduce-motion 정지.
 * 작은 사이즈(chat 버블)에선 animated={false} 권장.
 */

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl"
type AvatarShape = "circle" | "rounded" | "squircle"

/** Avatar(avatarVariants)의 size-* 스케일과 동일한 px. */
const SIZE_PX: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 80,
}

/** Avatar 의 shape 라운드와 정합. DS 토큰 우선, 미로드 호스트용 px 폴백. */
const SHAPE_RADIUS: Record<AvatarShape, string> = {
  circle: "50%",
  rounded: "var(--radius-card, 12px)",
  squircle: "var(--radius-hero, 22px)",
}

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n))

interface Hsl {
  h: number
  s: number
  l: number
}

/** `#RRGGBB` → HSL. */
function hexToHsl(hex: string): Hsl {
  const v = hex.replace("#", "")
  const r = parseInt(v.slice(0, 2), 16) / 255
  const g = parseInt(v.slice(2, 4), 16) / 255
  const b = parseInt(v.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const l = (max + min) / 2
  let s = 0
  let h = 0
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r:
        h = ((((g - b) / d) % 6) + 6) % 6
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h *= 60
  }
  return { h, s: s * 100, l: l * 100 }
}

/** 문자열 → 안정 정수 해시 (FNV-1a). SSR/CSR 동일 → hydration 안전. */
function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 색 → 오브의 기준 {h,s,l}. hex 는 존중하되 보기 좋은 범위로 clamp, 아니면 seed hue. */
function resolveBase(color: string | undefined, seed: string): Hsl {
  const isHex = typeof color === "string" && /^#?[0-9a-fA-F]{6}$/.test(color)
  if (isHex) {
    const c = hexToHsl(color.startsWith("#") ? color : `#${color}`)
    return { h: c.h, s: clamp(c.s, 50, 80), l: clamp(c.l, 44, 60) }
  }
  return { h: hashStr(seed || "orb") % 360, s: 70, l: 54 }
}

const hue = (h: number) => (h + 360) % 360
const css = (h: number, s: number, l: number) =>
  `hsl(${Math.round(hue(h))} ${Math.round(clamp(s))}% ${Math.round(clamp(l))}%)`

interface Blob {
  key: string
  color: string
  cx: number
  cy: number
  r: number
  alpha: number
  motionClass: string
}

type ColorAvatarProps = Omit<ComponentPropsWithoutRef<"span">, "color"> & {
  /** 유저별 안정 룩의 seed (닉네임 권장). */
  seed: string
  /** 선택: hex 색 override(`#RRGGBB`). 유효하지 않으면 무시하고 seed 로 파생. */
  color?: string
  /** Avatar 스케일(xs~xl) 또는 임의 px. 기본 md(48px). */
  size?: AvatarSize | number
  shape?: AvatarShape
  /** ambient 꿈틀 모션. 작은 사이즈에선 false 권장. */
  animated?: boolean
  /** 접근성 라벨. 기본값은 seed. */
  label?: string
  ref?: Ref<HTMLSpanElement>
}

function ColorAvatar({
  seed,
  color,
  size = "md",
  shape = "circle",
  animated = true,
  label,
  style,
  ref,
  ...props
}: ColorAvatarProps) {
  const px = typeof size === "number" ? size : SIZE_PX[size]
  const base = resolveBase(color, seed)
  // 인스턴스 id — 같은 룩끼리 겹쳐도 동일 gradient 라 안전, 다른 룩은 분리.
  const gid = `ds-orb-${hashStr(`${seed}|${color ?? ""}`).toString(36)}`

  const hi = css(base.h, base.s * 0.9, base.l + 22)
  const mid = css(base.h, base.s, base.l)
  const deep = css(base.h + 10, base.s + 4, base.l - 20)

  const blobs: Blob[] = [
    {
      key: "b1",
      color: css(base.h + 34, base.s + 6, base.l + 4),
      cx: 74,
      cy: 76,
      r: 46,
      alpha: 0.75,
      motionClass: "ds-orb-b1",
    },
    {
      key: "b2",
      color: css(base.h - 26, base.s + 2, base.l - 6),
      cx: 26,
      cy: 68,
      r: 42,
      alpha: 0.6,
      motionClass: "ds-orb-b2",
    },
    {
      key: "b3",
      color: css(base.h + 60, base.s + 10, base.l + 10),
      cx: 78,
      cy: 26,
      r: 34,
      alpha: 0.5,
      motionClass: "ds-orb-b3",
    },
  ]

  const boxStyle: CSSProperties = {
    display: "inline-block",
    flexShrink: 0,
    width: px,
    height: px,
    borderRadius: SHAPE_RADIUS[shape],
    overflow: "hidden",
    lineHeight: 0,
    ...style,
  }

  return (
    <span
      ref={ref}
      data-slot="color-avatar"
      role="img"
      aria-label={label ?? seed}
      style={boxStyle}
      {...props}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        style={{ display: "block" }}
        aria-hidden
        focusable="false"
      >
        <defs>
          <radialGradient id={`${gid}-orb`} cx="36%" cy="30%" r="85%">
            <stop offset="0" stopColor={hi} />
            <stop offset="0.55" stopColor={mid} />
            <stop offset="1" stopColor={deep} />
          </radialGradient>
          <radialGradient id={`${gid}-sheen`} cx="32%" cy="22%" r="45%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {blobs.map((b) => (
            <radialGradient
              key={b.key}
              id={`${gid}-${b.key}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0" stopColor={b.color} stopOpacity={b.alpha} />
              <stop
                offset="0.6"
                stopColor={b.color}
                stopOpacity={b.alpha * 0.35}
              />
              <stop offset="1" stopColor={b.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        <rect width="100" height="100" fill={`url(#${gid}-orb)`} />
        {blobs.map((b) => (
          <circle
            key={b.key}
            className={animated ? `ds-orb-blob ${b.motionClass}` : undefined}
            cx={b.cx}
            cy={b.cy}
            r={b.r}
            fill={`url(#${gid}-${b.key})`}
          />
        ))}
        <rect width="100" height="100" fill={`url(#${gid}-sheen)`} />
      </svg>
    </span>
  )
}

export { ColorAvatar }
export type { ColorAvatarProps }
