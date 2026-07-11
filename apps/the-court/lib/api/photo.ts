// 증거사진 — 실 REST. multipart POST /api/photos → { photoId, url }.
// (presigned/S3 흐름은 백엔드 백로그 — 지금은 서버 경유 multipart 직접.)
import { http } from "./client"
import type { PhotoResponse } from "./types"

export const photoApi = {
  upload: (file: File): Promise<PhotoResponse> =>
    http.upload<PhotoResponse>("/api/photos", file),
}

/** 파일을 업로드해 { photoId, url } 를 돌려준다. */
export function uploadPhoto(file: File): Promise<PhotoResponse> {
  return http.upload<PhotoResponse>("/api/photos", file)
}
