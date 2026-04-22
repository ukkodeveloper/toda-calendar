import type { VerifiedAccessTokenIdentity } from "../../domain/authenticated-user.js"

export interface AccessTokenVerifier {
  verify(accessToken: string): Promise<VerifiedAccessTokenIdentity>
}
