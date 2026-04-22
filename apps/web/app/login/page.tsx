import { redirect } from "next/navigation"

import { SocialLoginPanel } from "@/components/auth/social-login-panel"
import { toAuthUiErrorCode } from "@/lib/auth/errors"
import { getAppSession, getFirstQueryValue, sanitizeNextPath } from "@/lib/auth/session"
import { hasSupabaseAuthEnv } from "@/lib/supabase/config"

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[]
    next?: string | string[]
  }>
}

const featureCards = [
  {
    body: "Your month view, day editing flow, and API boundary stay under Toda ownership.",
    title: "Route-first auth",
  },
  {
    body: "The login surface is server-led, mobile-first, and shaped around a fixed safe-area panel.",
    title: "Calm entry",
  },
  {
    body: "Supabase can be swapped later because the UI only knows Toda routes and provider enums.",
    title: "Swappable broker",
  },
] as const

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
    <main className="relative min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),rgba(255,255,255,0.66)_28%,transparent_56%),linear-gradient(180deg,#f6f1ea_0%,#eef3f6_45%,#f8f8f6_100%)] text-foreground">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.88),transparent_46%),radial-gradient(circle_at_78%_14%,rgba(255,209,163,0.3),transparent_28%),radial-gradient(circle_at_52%_0%,rgba(255,151,138,0.12),transparent_30%)]"
      />
      <div
        aria-hidden="true"
        className="absolute right-[-4rem] bottom-[12rem] h-52 w-52 rounded-full bg-[rgba(255,255,255,0.5)] blur-3xl"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 pt-[max(2rem,calc(env(safe-area-inset-top)+1.5rem))] pb-[18rem] sm:px-8 lg:px-10">
        <header className="max-w-[36rem]">
          <div className="inline-flex rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-foreground/52 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            Toda Calendar
          </div>
          <h1 className="mt-6 text-[clamp(2.7rem,7vw,5.2rem)] font-semibold leading-[0.94] tracking-[-0.07em] text-foreground">
            Start your calm calendar
          </h1>
          <p className="mt-5 max-w-[30rem] text-base leading-7 text-foreground/66 sm:text-lg">
            Sign in to keep your month, memories, and editing state together.
            The screen stays light, but the auth boundary is explicit and ready
            for a provider swap later.
          </p>
        </header>

        <section
          aria-label="Login highlights"
          className="mt-14 grid gap-4 md:max-w-[44rem] md:grid-cols-3"
        >
          {featureCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.75rem] border border-white/55 bg-white/48 px-5 py-5 shadow-[0_20px_48px_rgba(15,23,42,0.06)] backdrop-blur-xl"
            >
              <p className="text-sm font-semibold tracking-[-0.03em] text-foreground">
                {card.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/60">
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
