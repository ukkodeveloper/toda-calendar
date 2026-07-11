import { Hono } from "hono"

import { type AppEnv, requireUser } from "../context.js"
import { notImplemented, validationError } from "../errors.js"

// 사진 업로드 — tRPC/JSON 밖 일반 라우트(multipart). presigned/S3 는 백로그.
export const photoRoutes = new Hono<AppEnv>()

// POST /api/photos (multipart, field: file) → photoResponseSchema
photoRoutes.post("/photos", async (c) => {
  const uuid = requireUser(c)
  const body = await c.req.parseBody()
  const file = body["file"]
  if (!(file instanceof File)) {
    throw validationError({
      field: "file",
      message: "이미지 파일(file)이 필요합니다",
    })
  }
  void uuid
  void file
  // TODO(슬라이스 02): 저장(로컬/블롭) → prisma.photo.create({url, uploaderUuid}) → photoResponseSchema
  throw notImplemented("POST /api/photos")
})
