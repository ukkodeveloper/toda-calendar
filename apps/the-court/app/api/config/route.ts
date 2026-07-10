import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/** 클라이언트가 런타임에 서버 env를 읽어야 할 때 사용. */
export function GET() {
  const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:8080"
  // http:// → ws://, https:// → wss://
  const wsUrl =
    apiOrigin.replace(/^https/, "wss").replace(/^http(?!s)/, "ws") + "/ws"
  return NextResponse.json({ wsUrl })
}
