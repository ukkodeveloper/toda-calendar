/**
 * 증거사진 전처리 — 프론트에서 리사이즈·압축하고 모바일 포맷(HEIC/HEIF 등)을 JPEG 로 통일한다.
 *
 * 왜: 업로드 대역폭·S3 용량을 줄이고, 브라우저(특히 데스크톱 Chrome)가 못 그리는 HEIC 를
 * 표준 JPEG 로 바꿔 어떤 기기에서 찍은 사진이든 그대로 올릴 수 있게 한다.
 */

const MAX_DIMENSION = 1600 // 긴 변 최대 px
const JPEG_QUALITY = 0.82
const HEIC_EXT_RE = /\.(heic|heif)$/i

/** HEIC/HEIF 여부. 브라우저가 type 을 비워 오는 경우가 많아 확장자도 함께 본다. */
function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    ((file.type === "" || file.type === "application/octet-stream") &&
      HEIC_EXT_RE.test(file.name))
  )
}

/** HEIC/HEIF → JPEG Blob. 무거운 디코더(libheif wasm)는 필요할 때만 동적 로드. */
async function heicToJpeg(file: File): Promise<Blob> {
  const { default: heic2any } = await import("heic2any")
  const out = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: JPEG_QUALITY,
  })
  if (Array.isArray(out)) {
    const first = out[0]
    if (!first) throw new Error("HEIC 변환 결과가 비었습니다")
    return first
  }
  return out
}

/**
 * Blob → 디코드된 이미지 소스.
 * createImageBitmap 우선(EXIF 회전 반영), 실패하면 <img> 로 폴백.
 */
async function decodeImage(
  blob: Blob
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" })
    } catch {
      // 일부 포맷은 createImageBitmap 이 못 그린다 → <img> 폴백
    }
  }
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

export interface OptimizedImage {
  /** 리사이즈·압축된 JPEG 파일 (업로드용) */
  file: File
  /** 미리보기용 object URL — 다 쓰면 revokeObjectURL 로 해제 */
  previewUrl: string
}

/**
 * 증거사진 한 장을 업로드 가능한 JPEG 로 최적화한다.
 * @throws 디코드/인코드에 실패하면(지원 못 하는 포맷 등) 에러를 던진다.
 */
export async function optimizeEvidencePhoto(
  input: File
): Promise<OptimizedImage> {
  // 1) HEIC 계열이면 먼저 JPEG 로 변환
  const source: Blob = isHeic(input) ? await heicToJpeg(input) : input

  // 2) 디코드 → 캔버스로 긴 변 기준 리사이즈
  const image = await decodeImage(source)
  const srcW = image.width
  const srcH = image.height
  const scale = Math.min(1, MAX_DIMENSION / Math.max(srcW, srcH))
  const w = Math.max(1, Math.round(srcW * scale))
  const h = Math.max(1, Math.round(srcH * scale))

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("canvas 2d context 를 얻지 못했습니다")
  ctx.drawImage(image as CanvasImageSource, 0, 0, w, h)
  if ("close" in image) image.close()

  // 3) JPEG 로 압축 출력
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  )
  if (!blob) throw new Error("이미지 인코딩에 실패했습니다")

  const name = input.name.replace(/\.[^.]+$/, "") + ".jpg"
  const file = new File([blob], name, {
    type: "image/jpeg",
    lastModified: Date.now(),
  })
  return { file, previewUrl: URL.createObjectURL(file) }
}
