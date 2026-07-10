import { http } from "./client"
import type {
  PhotoResponse,
  PresignedUrlRequest,
  PresignedUrlResponse,
} from "./types"

export const photoApi = {
  /**
   * 파일을 multipart/form-data로 직접 업로드.
   * 용량이 크면 presignedUrl → S3 직접 업로드 → complete 흐름을 써라.
   */
  upload: (file: File) => http.upload<PhotoResponse>("/api/photos", file),

  /** S3 presigned URL 발급. uploadUrl로 PUT 후 complete를 호출한다. */
  presignedUrl: (body: PresignedUrlRequest) =>
    http.post<PresignedUrlResponse>("/api/photos/presigned-url", { body }),

  /** presigned URL로 S3에 파일을 올린다. 이 함수는 API 서버가 아닌 S3에 직접 요청한다. */
  uploadToS3: (uploadUrl: string, file: File) =>
    fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "image/jpeg" },
      body: file,
    }).then((res) => {
      if (!res.ok) throw new Error(`S3 업로드 실패: ${res.status}`)
    }),

  /** S3 업로드 완료 신호. 이후 photoId를 report에 사용한다. */
  complete: (photoId: number) =>
    http.post<PhotoResponse>(`/api/photos/${photoId}/complete`),
}

/** presigned URL 방식으로 사진을 업로드하는 편의 함수. */
export async function uploadPhoto(file: File): Promise<PhotoResponse> {
  const { photoId, uploadUrl } = await photoApi.presignedUrl({
    filename: file.name,
  })
  await photoApi.uploadToS3(uploadUrl, file)
  return photoApi.complete(photoId)
}
