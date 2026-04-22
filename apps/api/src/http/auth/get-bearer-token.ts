import { InvalidAccessTokenError } from "../../domain/auth-errors.js"

export function getBearerToken(authorizationHeader: string | string[] | undefined) {
  if (!authorizationHeader) {
    return null
  }

  const header = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader

  if (!header) {
    return null
  }

  const [scheme, ...tokenParts] = header.trim().split(/\s+/)
  const token = tokenParts.join(" ")

  if (scheme !== "Bearer" || token.length === 0) {
    throw new InvalidAccessTokenError(
      "Authorization header must use the Bearer <token> format"
    )
  }

  return token
}
