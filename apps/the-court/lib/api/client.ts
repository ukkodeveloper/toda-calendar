// 실 백엔드(the-court-api · Hono REST) fetch 래퍼.
// base = NEXT_PUBLIC_API_URL, 모든 요청에 X-User-Uuid(auth) 자동 첨부.
// 에러는 백엔드 표준 응답 { error: { code, message, details? } } 로 파싱해 ApiError 로 표준화.
import { clearAuth, loadAuth } from "@/lib/auth"

// 절대 URL 로 직접 호출(CORS). rewrite 프록시 제거.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

/**
 * 자가치유 — uuid 를 보냈는데 401 이면 신원이 무효(예: DB 리셋으로 stale uuid).
 * 저장된 auth 를 비우고 온보딩으로 하드 리다이렉트해 새 계정을 발급받게 한다.
 * (온보딩 콜은 uuid 를 안 보내므로 여기 안 걸리고, 리다이렉트 루프도 없다.)
 */
function healStaleIdentity(status: number, sentUuid: string | null): void {
  if (status !== 401 || !sentUuid || typeof window === "undefined") return
  clearAuth()
  if (window.location.pathname !== "/onboarding") {
    window.location.href = "/onboarding"
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  userUuid?: string | null
}

// 백엔드 표준 에러: { error: { code, message, details? } }.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }

  // 자주 분기하는 상태를 편하게.
  get isUnauthorized() {
    return this.status === 401
  }
  get isForbidden() {
    return this.status === 403
  }
  get isNotFound() {
    return this.status === 404
  }
  get isConflict() {
    return this.status === 409
  }
  get isValidation() {
    return this.status === 422
  }
}

function resolveUuid(explicit: string | null | undefined): string | null {
  if (explicit !== undefined) return explicit
  return loadAuth()?.uuid ?? null
}

async function toApiError(res: Response): Promise<ApiError> {
  const text = await res.text().catch(() => "")
  let code = res.statusText || "HTTP_ERROR"
  let message = text || res.statusText
  let details: unknown
  if (text) {
    try {
      const parsed = JSON.parse(text) as {
        error?: { code?: string; message?: string; details?: unknown }
      }
      if (parsed.error) {
        code = parsed.error.code ?? code
        message = parsed.error.message ?? message
        details = parsed.error.details
      }
    } catch {
      // 비 JSON 응답은 텍스트 그대로.
    }
  }
  return new ApiError(res.status, code, message, details)
}

async function request<T>(
  path: string,
  { body, userUuid, headers, ...init }: RequestOptions = {}
): Promise<T> {
  const uuid = resolveUuid(userUuid)

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(uuid ? { "X-User-Uuid": uuid } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    healStaleIdentity(res.status, uuid)
    throw await toApiError(res)
  }

  const text = await res.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

async function upload<T>(path: string, file: File): Promise<T> {
  const uuid = loadAuth()?.uuid ?? null
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    // multipart 는 Content-Type 을 브라우저가 boundary 와 함께 지정하게 둔다.
    headers: uuid ? { "X-User-Uuid": uuid } : {},
    body: formData,
  })

  if (!res.ok) {
    healStaleIdentity(res.status, uuid)
    throw await toApiError(res)
  }
  return res.json() as Promise<T>
}

export const http = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "GET" }),

  post: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST" }),

  upload: <T>(path: string, file: File) => upload<T>(path, file),
}

export { BASE_URL }
