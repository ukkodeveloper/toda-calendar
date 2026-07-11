// 도메인 에러를 타입으로 모델링하고, HTTP 매핑은 app.onError(바깥 계층)에서.
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = new.target.name
  }
}

export const unauthorized = () =>
  new AppError("AUTH_REQUIRED", 401, "X-User-Uuid 헤더가 필요합니다")

export const notFound = (code: string, message: string) =>
  new AppError(code, 404, message)

export const conflict = (code: string, message: string) =>
  new AppError(code, 409, message)

export const validationError = (details?: unknown) =>
  new AppError("VALIDATION_ERROR", 422, "요청 검증에 실패했습니다", details)

// 슬라이스 01 스텁 — 라우트 뼈대만. 도메인·prisma 구현은 슬라이스 02.
export const notImplemented = (what: string) =>
  new AppError("NOT_IMPLEMENTED", 501, `${what} — 슬라이스 02에서 구현`)
