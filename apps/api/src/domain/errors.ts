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

export class InputValidationError extends AppError {
  constructor(message = "Request validation failed", details?: unknown) {
    super("VALIDATION_ERROR", 422, message, details)
  }
}

export class NotFoundError extends AppError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, 404, message, details)
  }
}
