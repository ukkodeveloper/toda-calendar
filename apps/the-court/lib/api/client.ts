import { loadAuth } from "@/lib/auth"

// 빈 문자열 = 같은 origin (Next.js rewrites가 /api/* → 백엔드로 프록시)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  userUuid?: string | null
}

async function request<T>(
  path: string,
  { body, userUuid, headers, ...init }: RequestOptions = {}
): Promise<T> {
  const auth = loadAuth()
  const uuid = userUuid !== undefined ? userUuid : (auth?.uuid ?? null)

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
    const text = await res.text().catch(() => "")
    throw new ApiError(res.status, text || res.statusText)
  }

  const text = await res.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

async function upload<T>(path: string, file: File): Promise<T> {
  const auth = loadAuth()
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: auth?.uuid ? { "X-User-Uuid": auth.uuid } : {},
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new ApiError(res.status, text || res.statusText)
  }

  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export const http = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "GET" }),

  post: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST" }),

  upload: <T>(path: string, file: File) => upload<T>(path, file),
}

export { BASE_URL }
