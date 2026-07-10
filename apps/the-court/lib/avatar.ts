/**
 * 색 하나로 HeroUI 풍 그라디언트 오브 아바타를 만든다.
 *
 * 색을 HSL 로 풀어 배경 틴트·하이라이트·그림자·메시 액센트를 파생하고,
 * 부드러운 SVG 구(球)를 그려 data URI 로 반환한다.
 * Astryx `<Avatar src={colorAvatarSrc(color)} />` 에 그대로 넣으면
 * Avatar 가 원으로 클리핑해 준다.
 */

interface Hsl {
  h: number
  s: number
  l: number
}

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n))

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

const hsl = ({ h, s, l }: Hsl) =>
  `hsl(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%)`
const shift = (c: Hsl, dh: number, ds: number, dl: number): Hsl => ({
  h: (c.h + dh + 360) % 360,
  s: clamp(c.s + ds),
  l: clamp(c.l + dl),
})

/**
 * 색에서 파생한 그라디언트 오브를 SVG data URI 로 반환.
 * @param color `#RRGGBB` 형식의 헥스 색
 */
export function colorAvatarSrc(color: string): string {
  const base = hexToHsl(color)

  const highlight = shift(base, 0, -12, +26) // 구의 밝은 정점
  const deep = shift(base, +8, +4, -18) // 외곽 그림자 → 볼륨감
  const accent = shift(base, +48, +6, +8) // 초록 속 파랑 같은 메시 액센트
  const tint = { h: base.h, s: clamp(base.s, 20, 55), l: 91 } // 연한 배경 필드

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
<defs>
<radialGradient id='orb' cx='38%' cy='32%' r='78%'>
<stop offset='0%' stop-color='${hsl(highlight)}'/>
<stop offset='48%' stop-color='${hsl(base)}'/>
<stop offset='100%' stop-color='${hsl(deep)}'/>
</radialGradient>
<filter id='soft' x='-40%' y='-40%' width='180%' height='180%'>
<feGaussianBlur stdDeviation='6'/>
</filter>
</defs>
<rect width='100' height='100' fill='${hsl(tint)}'/>
<circle cx='72' cy='74' r='30' fill='${hsl(accent)}' opacity='0.85' filter='url(#soft)'/>
<circle cx='50' cy='50' r='38' fill='url(#orb)' filter='url(#soft)'/>
</svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
