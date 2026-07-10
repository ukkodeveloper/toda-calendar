import { http } from "./client"
import type { CreateUserRequest, NicknameResponse, UserResponse } from "./types"

export const userApi = {
  create: (body: CreateUserRequest) =>
    http.post<UserResponse>("/api/users", { body }),

  get: (uuid: string) => http.get<UserResponse>(`/api/users/${uuid}`),

  randomNickname: () => http.get<NicknameResponse>("/api/users/nickname"),
}
