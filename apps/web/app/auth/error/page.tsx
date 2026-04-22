import Link from "next/link"

import {
  AUTH_ERROR_COPY,
  toAuthUiErrorCode,
} from "@/lib/auth/errors"
import {
  buildLoginPath,
  getFirstQueryValue,
  sanitizeNextPath,
} from "@/lib/auth/session"

type AuthErrorPageProps = {
  searchParams: Promise<{
    code?: string | string[]
    next?: string | string[]
  }>
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const query = await searchParams
  const code = toAuthUiErrorCode(getFirstQueryValue(query.code))
  const nextPath = sanitizeNextPath(getFirstQueryValue(query.next))
  const copy = code
    ? AUTH_ERROR_COPY[code]
    : {
        description:
          "The auth flow stopped on an unexpected edge. Head back to login and try again.",
        title: "Authentication ran into a rough edge",
      }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(255,255,255,0.68)_30%,transparent_62%),linear-gradient(180deg,#f6f1ea_0%,#eef3f6_54%,#f8f8f6_100%)] px-5 py-10 text-foreground sm:px-8">
      <section
        aria-labelledby="auth-error-title"
        className="w-full max-w-[30rem] rounded-[2rem] border border-white/60 bg-white/72 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:p-8"
      >
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-foreground/48">
          Auth Error
        </p>
        <h1
          id="auth-error-title"
          className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-foreground"
        >
          {copy.title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-foreground/66 sm:text-base">
          {copy.description}
        </p>

        {code ? (
          <p className="mt-5 rounded-full border border-white/60 bg-white/72 px-3 py-1.5 text-xs font-medium tracking-[0.12em] text-foreground/45 uppercase">
            Code: {code}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={buildLoginPath({ next: nextPath })}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-white transition-opacity hover:opacity-92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]/50"
          >
            Back to login
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/65 bg-white/78 px-5 text-sm font-medium text-foreground transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]/50"
          >
            Return home
          </Link>
        </div>
      </section>
    </main>
  )
}
