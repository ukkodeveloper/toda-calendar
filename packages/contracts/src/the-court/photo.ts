import { z } from "zod"

// POST /api/photos (multipart, field: file) → 저장 URL 반환.
// presigned/S3 흐름은 백로그 — 지금은 서버 경유 multipart 직접.
export const photoResponseSchema = z.object({
  photoId: z.number().int(),
  url: z.string(),
})

export type PhotoResponse = z.infer<typeof photoResponseSchema>
