import { AppError } from "./errors.js"

export class AuthRequiredError extends AppError {
  constructor(message = "Authentication is required") {
    super("AUTH_REQUIRED", 401, message)
  }
}

export class InvalidAccessTokenError extends AppError {
  constructor(message = "Access token is invalid", details?: unknown) {
    super("INVALID_ACCESS_TOKEN", 401, message, details)
  }
}

export class AuthBootstrapError extends AppError {
  constructor(message = "Authenticated user bootstrap failed", details?: unknown) {
    super("AUTH_BOOTSTRAP_FAILED", 500, message, details)
  }
}
