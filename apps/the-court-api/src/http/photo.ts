import type { PhotoResponse } from "@workspace/contracts"
import { Hono } from "hono"

import { type AppEnv, requireExistingUser } from "../context.js"
import { prisma } from "../db.js"
import { validationError } from "../errors.js"

// 사진 업로드 — multipart(파일). presigned/S3 는 백로그.
// ⚠️ 데모 저장: data URL 로 DB(Photo.url)에 인라인. 실 blob 스토리지(Vercel Blob/S3)는 인프라 스텝.
export const photoRoutes = new Hono<AppEnv>()

const MAX_BYTES = 5 * 1024 * 1024 // 5MB

// POST /api/photos (field: file) → {photoId, url}
photoRoutes.post("/photos", async (c) => {
  const uuid = await requireExistingUser(c)
  const body = await c.req.parseBody()
  const file = body["file"]
  if (!(file instanceof File)) {
    throw validationError({
      field: "file",
      message: "이미지 파일(file)이 필요합니다",
    })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  if (bytes.length > MAX_BYTES) {
    throw validationError({
      field: "file",
      message: "파일이 너무 큽니다(최대 5MB)",
    })
  }
  const mime = file.type || "image/jpeg"
  const url = `data:${mime};base64,${bytes.toString("base64")}`

  const photo = await prisma.photo.create({ data: { url, uploaderUuid: uuid } })
  return c.json(
    { photoId: photo.id, url: photo.url } satisfies PhotoResponse,
    201
  )
})
