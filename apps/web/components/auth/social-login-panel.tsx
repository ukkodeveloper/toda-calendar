import { AUTH_ERROR_COPY, type AuthUiErrorCode } from "@/lib/auth/errors"
import { APP_AUTH_PROVIDERS } from "@/lib/auth/providers"

import { SocialLoginButton } from "./social-login-button"

type SocialLoginPanelProps = {
  authReady: boolean
  errorCode?: AuthUiErrorCode | null
  nextPath: string
}

export function SocialLoginPanel({
  authReady,
  errorCode,
  nextPath,
}: SocialLoginPanelProps) {
  const errorCopy = errorCode ? AUTH_ERROR_COPY[errorCode] : null

  return (
    <section
      aria-labelledby="social-login-title"
      className="fixed inset-x-0 bottom-0 z-30"
    >
      <div className="mx-auto w-full max-w-[32rem] px-3 pb-[max(0.9rem,env(safe-area-inset-bottom))] sm:px-5">
        <div className="rounded-[2rem] border border-white/50 bg-[color:var(--surface-panel)]/92 px-4 py-4 shadow-[0_28px_80px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:px-5 sm:py-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-foreground/45">
                Sign In
              </p>
              <h2
                id="social-login-title"
                className="mt-1 text-lg font-semibold tracking-[-0.04em] text-foreground"
              >
                Three entry points, one calm timeline.
              </h2>
            </div>
            <div className="rounded-full border border-white/55 bg-white/62 px-3 py-1 text-[0.68rem] font-medium tracking-[0.08em] text-foreground/56 uppercase">
              MVP
            </div>
          </div>

          <nav aria-label="Social sign in" className="space-y-3">
            {APP_AUTH_PROVIDERS.map((provider) => (
              <SocialLoginButton
                key={provider.id}
                authReady={authReady}
                nextPath={nextPath}
                provider={provider}
              />
            ))}
          </nav>

          <div
            aria-live="polite"
            className="mt-4 min-h-[4.5rem] rounded-[1.35rem] border border-white/55 bg-white/52 px-4 py-3"
          >
            {errorCopy ? (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold tracking-[-0.02em] text-foreground">
                  {errorCopy.title}
                </p>
                <p className="text-sm leading-6 text-foreground/66">
                  {errorCopy.description}
                </p>
              </div>
            ) : (
              <p className="text-sm leading-6 text-foreground/64">
                {authReady
                  ? "Toda owns the route contract and the API boundary. The provider only brokers the OAuth handshake."
                  : "OAuth wiring is pending. Add the public Supabase env vars first, then these same buttons will hand off to the real provider flow."}
              </p>
            )}
          </div>

          <p className="mt-4 px-1 text-[0.78rem] leading-5 text-foreground/46">
            By continuing, you agree to the Toda Calendar terms and privacy
            policy.
          </p>
        </div>
      </div>
    </section>
  )
}
