// 경량 구조적 로거 — pino 등 무거운 의존 없이 JSON 한 줄.
// BigInt 안전(replacer 로 Number 변환) — chat send 결과·인프라 이벤트 로깅용.
type Fields = Record<string, unknown>

function emit(
  level: "info" | "warn" | "error",
  event: string,
  fields?: Fields
): void {
  const line = { level, event, ts: new Date().toISOString(), ...fields }
  const text = JSON.stringify(line, (_k, v) =>
    typeof v === "bigint" ? Number(v) : v
  )
  if (level === "error") console.error(text)
  else console.log(text)
}

export const log = {
  info: (event: string, fields?: Fields) => emit("info", event, fields),
  warn: (event: string, fields?: Fields) => emit("warn", event, fields),
  error: (event: string, fields?: Fields) => emit("error", event, fields),
}
