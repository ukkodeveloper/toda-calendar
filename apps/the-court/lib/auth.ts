/**
 * 로컬스토리지 기반 로그인.
 * 인증 토큰을 따로 쓰지 않고 { uuid, nickname, color } 존재 여부로 로그인을 판단한다.
 */

export interface AuthUser {
  uuid: string
  nickname: string
  color: string
}

const STORAGE_KEY = "hyeonhaengbeom.auth"

/** 저장된 로그인 정보. 없거나 깨졌으면 null. */
export function loadAuth(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthUser>
    if (!parsed.uuid || !parsed.nickname || !parsed.color) return null
    return { uuid: parsed.uuid, nickname: parsed.nickname, color: parsed.color }
  } catch {
    return null
  }
}

export function saveAuth(user: AuthUser): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearAuth(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
}

/** 로컬스토리지에 유효한 로그인 정보가 있으면 로그인된 상태로 본다. */
export function isLoggedIn(): boolean {
  return loadAuth() !== null
}

/**
 * 로그인. 아직 백엔드가 없어 프론트에서 uuid 를 만들어 저장하는 mock.
 * 실제 API 가 생기면 아래 uuid 생성부만
 *   const res = await fetch(`${API}/auth/login`, { method: "POST", body: JSON.stringify(input) })
 *   const { uuid } = await res.json()
 * 로 바꾸면 된다. (요청 { nickname, color } → 응답 { uuid, nickname, color })
 */
export async function login(input: {
  nickname: string
  color: string
}): Promise<AuthUser> {
  const user: AuthUser = {
    uuid: crypto.randomUUID(),
    nickname: input.nickname,
    color: input.color,
  }
  saveAuth(user)
  return user
}
