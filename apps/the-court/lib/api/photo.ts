// 인메모리 목 — 백엔드/S3 없이 증거사진 업로드가 돌게. shape 은 domain/api.md 유지.
// 실제 네트워크(서버·S3) 호출은 하지 않고 로컬 objectURL 을 s3Url 로 흉내낸다.
import type {
  PhotoResponse,
  PresignedUrlRequest,
  PresignedUrlResponse,
} from "./types"

const delay = (ms = 200) => new Promise<void>((r) => setTimeout(r, ms))

let nextPhotoId = 100

function fakeUrl(file?: File): string {
  if (file && typeof URL !== "undefined" && URL.createObjectURL) {
    try {
      return URL.createObjectURL(file)
    } catch {
      // ignore
    }
  }
  return "data:image/png;base64,"
}

export const photoApi = {
  upload: async (file: File): Promise<PhotoResponse> => {
    await delay()
    return { photoId: nextPhotoId++, s3Url: fakeUrl(file) }
  },

  presignedUrl: async (
    _body: PresignedUrlRequest
  ): Promise<PresignedUrlResponse> => {
    await delay()
    const photoId = nextPhotoId++
    return { photoId, uploadUrl: "mock://upload", s3Url: fakeUrl() }
  },

  // S3 직접 업로드는 목에서는 no-op.
  uploadToS3: async (_uploadUrl: string, _file: File): Promise<void> => {
    await delay(80)
  },

  complete: async (photoId: number): Promise<PhotoResponse> => {
    await delay(80)
    return { photoId, s3Url: fakeUrl() }
  },
}

/** 목: 파일을 받아 로컬 objectURL 로 즉시 PhotoResponse 를 돌려준다. */
export async function uploadPhoto(file: File): Promise<PhotoResponse> {
  await delay()
  return { photoId: nextPhotoId++, s3Url: fakeUrl(file) }
}
