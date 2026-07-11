// 유저 — 실 REST. 로그인 없음, 서버가 uuid 발급(클라 localStorage 저장).
import { http } from "./client"
import type { CreateUserRequest, NicknameResponse, UserResponse } from "./types"

export const userApi = {
  create: (body: CreateUserRequest): Promise<UserResponse> =>
    http.post<UserResponse>("/api/users", { body }),

  get: (uuid: string): Promise<UserResponse> =>
    http.get<UserResponse>(`/api/users/${uuid}`),

  randomNickname: (): Promise<NicknameResponse> =>
    http.get<NicknameResponse>("/api/users/nickname"),
}
