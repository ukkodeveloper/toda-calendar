import { useCallback, useEffect, useLayoutEffect, useRef } from "react"

/**
 * useStickToBottom — 카톡·인스타식 "하단 고정" 메시지 리스트.
 *
 * 새 콘텐츠가 붙거나 컨테이너가 줄어들면(소프트 키보드 열림·컴포저 멀티라인) 자동으로
 * 최하단으로 스크롤한다. 단 **사용자가 과거를 보려고 위로 스크롤한 상태면 억제**한다.
 *
 * 판정은 "붙기 전"의 near-bottom 상태(스크롤 이벤트로 갱신되는 ref)로 한다 — 새 콘텐츠는
 * scroll 이벤트를 안 내므로 ref 가 append 직전 상태를 그대로 유지한다(표준 패턴).
 *
 * 키보드 자체는 측정하지 않는다(계약: DS 훅이 --inset-keyboard 소유). 대신 스크롤
 * 컨테이너의 ResizeObserver 로 "줄어들면 하단 유지" 만 한다 — 플랫폼 중립.
 *
 * @param dep  콘텐츠 배열(또는 length). 바뀔 때마다 하단 고정을 재평가한다.
 */
export function useStickToBottom<T extends HTMLElement = HTMLDivElement>(
  dep: unknown
) {
  const ref = useRef<T>(null)
  // 초기값 true = 진입 시 최하단에서 시작(채팅 기본).
  const nearBottomRef = useRef(true)

  const NEAR_BOTTOM_THRESHOLD = 80 // px — 이 안이면 "하단을 보고 있다"로 본다.

  const scrollToBottom = useCallback(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  // 사용자 스크롤마다 near-bottom 여부를 기록. 새 콘텐츠 append 는 여기 안 걸린다.
  const onScroll = useCallback(() => {
    const el = ref.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    nearBottomRef.current = distance <= NEAR_BOTTOM_THRESHOLD
  }, [])

  // 새 콘텐츠: 붙기 전 하단이었으면 하단 유지(paint 전 = 깜빡임 없음).
  useLayoutEffect(() => {
    if (nearBottomRef.current) scrollToBottom()
  }, [dep, scrollToBottom])

  // 컨테이너 축소(키보드 열림·컴포저 성장·레이아웃 변동) 시에도 하단 유지.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      if (nearBottomRef.current) scrollToBottom()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [scrollToBottom])

  return { ref, onScroll, scrollToBottom }
}
