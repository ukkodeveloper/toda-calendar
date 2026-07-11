// 인메모리 목 — 백엔드 없이 온보딩이 돌게. shape 은 domain/api.md 유지.
import { generateIdentity } from "@/lib/identity"
import type { CreateUserRequest, NicknameResponse, UserResponse } from "./types"

const delay = (ms = 200) => new Promise<void>((r) => setTimeout(r, ms))

let seq = 1
function makeUuid(): string {
  return `u-mock-${seq++}`
}

export const userApi = {
  create: async (body: CreateUserRequest): Promise<UserResponse> => {
    await delay()
    return { uuid: makeUuid(), nickname: body.nickname, color: body.color }
  },

  get: async (uuid: string): Promise<UserResponse> => {
    await delay()
    const { nickname, color } = generateIdentity()
    return { uuid, nickname, color }
  },

  randomNickname: async (): Promise<NicknameResponse> => {
    await delay()
    const { nickname, color } = generateIdentity()
    return { nickname, color }
  },
}
