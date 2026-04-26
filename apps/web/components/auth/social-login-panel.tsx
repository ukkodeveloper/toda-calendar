import { AUTH_ERROR_COPY, type AuthUiErrorCode } from "@/lib/auth/errors"
import { appCopy } from "@/lib/copy"
import { PRIMARY_OAUTH_PROVIDERS } from "@/lib/auth/providers"

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
      className="fixed inset-x-0 bottom-0 z-30 bg-background/96"
    >
      <div className="mx-auto w-full max-w-[28rem] px-5 pt-4 pb-[max(0.9rem,env(safe-area-inset-bottom))]">
        <div>
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {appCopy.component.socialLoginPanel.eyebrow}
              </p>
              <h2
                id="social-login-title"
                className="mt-1 text-[1.05rem] font-semibold text-foreground"
              >
                {appCopy.component.socialLoginPanel.title}
              </h2>
            </div>
            <div className="pt-0.5 text-[0.68rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {appCopy.component.socialLoginPanel.badge}
            </div>
          </div>

          <nav
            aria-label={appCopy.component.socialLoginPanel.navAriaLabel}
            className="divide-y divide-border/70"
          >
            {PRIMARY_OAUTH_PROVIDERS.map((provider) => (
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
            className="mt-4 min-h-[3.5rem]"
          >
            {errorCopy ? (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-foreground">
                  {errorCopy.title}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {errorCopy.description}
                </p>
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                {authReady
                  ? appCopy.component.socialLoginPanel.defaultReadyMessage
                  : appCopy.component.socialLoginPanel.defaultWaitingMessage}
              </p>
            )}
          </div>

          <p className="mt-3 text-[0.78rem] leading-5 text-muted-foreground/80">
            {appCopy.component.socialLoginPanel.agreement}
          </p>
        </div>
      </div>
    </section>
  )
}
