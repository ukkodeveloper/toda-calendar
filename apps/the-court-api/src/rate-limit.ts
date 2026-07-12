// 소켓별 토큰 버킷 — 순수·부작용 없음(테스트 가능). now 는 호출부가 주입(Date.now()).
// 기본: capacity 5 + refill 1 토큰 / 400ms = 5 msg / 2s 지속률.
export interface TokenBucket {
  // 토큰 1개 소비 시도. 남아 있으면 소비하고 true, 없으면 false.
  tryConsume(now: number): boolean
}

export function createTokenBucket(
  capacity: number,
  refillMs: number,
  now = Date.now()
): TokenBucket {
  let tokens = capacity
  let last = now
  return {
    tryConsume(t: number): boolean {
      // 경과분만큼 토큰 보충(capacity 상한).
      const elapsed = Math.max(0, t - last)
      last = t
      tokens = Math.min(capacity, tokens + elapsed / refillMs)
      if (tokens >= 1) {
        tokens -= 1
        return true
      }
      return false
    },
  }
}
