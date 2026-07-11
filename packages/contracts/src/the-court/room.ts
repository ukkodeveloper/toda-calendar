import { z } from "zod"

import { userTitleSchema } from "./enums.js"

// POST /rooms — 방 생성 → 참여코드 발급.
export const createRoomRequestSchema = z.object({
  title: z.string().trim().min(1).max(60),
})

export const roomResponseSchema = z.object({
  roomId: z.number().int(),
  title: z.string(),
  participationCode: z.string(),
  createdAt: z.string(), // ISO-8601
})

// POST /rooms/join — 참여코드로 입장.
export const joinRoomRequestSchema = z.object({
  participationCode: z.string().trim().min(1).max(12),
})

export const joinRoomResponseSchema = z.object({
  roomId: z.number().int(),
  title: z.string(),
  myTitle: userTitleSchema,
})

// GET /rooms — 참여중인 방 리스트(title + N명 + 참여코드).
// code: 멤버만 자기 방 목록을 보므로 노출 안전(이미 참여자) — 홈에서 초대 공유용.
export const roomListItemSchema = z.object({
  roomId: z.number().int(),
  title: z.string(),
  code: z.string(),
  participantCount: z.number().int().nonnegative(),
})

export const roomListResponseSchema = z.array(roomListItemSchema)

// GET /rooms/{id} — 방 상세.
export const roomDetailResponseSchema = z.object({
  roomId: z.number().int(),
  title: z.string(),
  code: z.string(),
  participantCount: z.number().int().nonnegative(),
  myTitle: userTitleSchema,
})

// GET /rooms/{id}/members — 멤버 목록(전과 N범/모범시민 뱃지용).
export const roomMemberSchema = z.object({
  uuid: z.string(),
  nickname: z.string(),
  title: userTitleSchema,
  color: z.string(),
  convictionCount: z.number().int().nonnegative(),
})

export const roomMembersResponseSchema = z.array(roomMemberSchema)

export type CreateRoomRequest = z.infer<typeof createRoomRequestSchema>
export type RoomResponse = z.infer<typeof roomResponseSchema>
export type JoinRoomRequest = z.infer<typeof joinRoomRequestSchema>
export type JoinRoomResponse = z.infer<typeof joinRoomResponseSchema>
export type RoomListItem = z.infer<typeof roomListItemSchema>
export type RoomListResponse = z.infer<typeof roomListResponseSchema>
export type RoomDetailResponse = z.infer<typeof roomDetailResponseSchema>
export type RoomMember = z.infer<typeof roomMemberSchema>
export type RoomMembersResponse = z.infer<typeof roomMembersResponseSchema>
