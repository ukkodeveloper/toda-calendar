import { redirect } from "next/navigation"

import { SocialLoginPanel } from "@/components/auth/social-login-panel"
import { toAuthUiErrorCode } from "@/lib/auth/errors"
import { appCopy } from "@/lib/copy"
import { getAppSession, getFirstQueryValue, sanitizeNextPath } from "@/lib/auth/session"
import { hasSupabaseAuthEnv } from "@/lib/supabase/config"

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[]
    next?: string | string[]
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams
  const nextPath = sanitizeNextPath(getFirstQueryValue(query.next))
  const errorCode = toAuthUiErrorCode(getFirstQueryValue(query.error))
  const session = await getAppSession()
  const authReady = hasSupabaseAuthEnv()

  if (session.isAuthenticated) {
    redirect(nextPath)
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-[28rem] flex-col px-5 pt-[max(2rem,calc(env(safe-area-inset-top)+1.5rem))] pb-[18rem]">
        <header>
          <div className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {appCopy.page.login.badge}
          </div>
          <h1 className="mt-5 text-[2.45rem] font-semibold leading-[1.02] text-foreground">
            {appCopy.page.login.title}
          </h1>
          <p className="mt-5 text-[1rem] leading-7 text-muted-foreground">
            {appCopy.page.login.description}
          </p>
        </header>

        <section
          aria-label={appCopy.page.login.highlightsAriaLabel}
          className="mt-10 divide-y divide-border/70"
        >
          {appCopy.page.login.featureCards.map((card) => (
            <article key={card.title} className="py-4">
              <p className="text-[0.98rem] font-semibold text-foreground">
                {card.title}
              </p>
              <p className="mt-1.5 text-[0.92rem] leading-6 text-muted-foreground">
                {card.body}
              </p>
            </article>
          ))}
        </section>
      </div>

      <SocialLoginPanel
        authReady={authReady}
        errorCode={errorCode}
        nextPath={nextPath}
      />
    </main>
  )
}
