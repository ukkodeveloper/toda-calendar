"use client"

import Link from "next/link"
import * as React from "react"

import { BottomSheet } from "@workspace/ui/components/bottom-sheet"
import { Button } from "@workspace/ui/components/button"

import { PRIMARY_OAUTH_PROVIDERS } from "@/lib/auth/providers"
import type { AppSession } from "@/lib/auth/app-session"
import { appCopy } from "@/lib/copy"

type SettingsPageShellProps = {
  session: AppSession
}

export function SettingsPageShell({ session }: SettingsPageShellProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const authReady = session.runtime === "configured"
  const isAuthenticated = session.isAuthenticated

  function handleConfirmSignOut() {
    setIsSigningOut(true)
    window.location.assign("/auth/sign-out")
  }

  return (
    <>
      <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),rgba(255,255,255,0.54)_28%,transparent_54%),linear-gradient(180deg,#f7f1e9_0%,#eff2f5_42%,#f8f8f5_100%)] px-4 pt-[max(1rem,calc(env(safe-area-inset-top)+0.4rem))] pb-[calc(7rem+env(safe-area-inset-bottom))] text-foreground sm:px-6">
        <div className="mx-auto max-w-2xl">
          <header className="flex items-center justify-between gap-3 pb-6">
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-white/82 px-4 py-2 text-sm font-medium text-foreground shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl"
              href="/"
            >
              <BackIcon />
              {appCopy.page.settings.backToCalendar}
            </Link>
            <h1 className="text-lg font-semibold tracking-[-0.04em]">
              {appCopy.page.settings.title}
            </h1>
          </header>

          <div className="space-y-4">
            <section className="rounded-[2rem] border border-white/60 bg-white/72 p-5 shadow-[0_20px_48px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-foreground/42">
                Account
              </p>
              {isAuthenticated ? (
                <div className="mt-3 space-y-3">
                  <div className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Connected
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.04em] text-foreground">
                      {appCopy.page.settings.accountLoggedInTitle}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-foreground/62">
                      {appCopy.page.settings.accountLoggedInBody}
                    </p>
                  </div>
                  <div className="rounded-[1.35rem] border border-black/6 bg-white/72 px-4 py-3 text-sm text-foreground/72">
                    {session.identity?.email ?? "No email"}
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.04em] text-foreground">
                      {appCopy.page.settings.accountGuestTitle}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-foreground/62">
                      {authReady
                        ? appCopy.page.settings.accountGuestBody
                        : appCopy.page.settings.runtimePending}
                    </p>
                  </div>

                  {authReady ? (
                    <div className="space-y-3">
                      {PRIMARY_OAUTH_PROVIDERS.map((provider) => (
                        <a
                          key={provider.id}
                          className="flex min-h-15 items-center gap-3 rounded-[1.4rem] border border-black/8 bg-white/84 px-4 py-3 text-left shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]/50"
                          href={`/auth/sign-in/${provider.id}?next=${encodeURIComponent("/settings")}`}
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#fff_0%,#f4f6f8_100%)] text-base font-semibold text-foreground">
                            {provider.mark}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-foreground">
                              {provider.actionLabel}
                            </span>
                            <span className="mt-0.5 block text-xs leading-5 text-foreground/56">
                              {provider.description}
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/60 bg-white/68 p-5 shadow-[0_20px_48px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-foreground/42">
                Sync
              </p>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-foreground">
                {appCopy.page.settings.backupTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-foreground/62">
                {appCopy.page.settings.backupBody}
              </p>
            </section>
          </div>
        </div>

        {isAuthenticated ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
            <div className="pointer-events-auto mx-auto max-w-2xl rounded-[1.8rem] border border-white/60 bg-white/86 p-3 shadow-[0_-10px_36px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <Button
                className="w-full"
                size="lg"
                type="button"
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
              >
                {appCopy.page.settings.logoutCta}
              </Button>
            </div>
          </div>
        ) : null}
      </main>

      <BottomSheet
        description={appCopy.page.settings.logoutConfirmDescription}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title={appCopy.page.settings.logoutConfirmTitle}
        footer={
          <div className="flex gap-3">
            <Button
              className="flex-1"
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              {appCopy.component.settingsPage.closeConfirm}
            </Button>
            <Button
              className="flex-1"
              disabled={isSigningOut}
              type="button"
              variant="destructive"
              onClick={handleConfirmSignOut}
            >
              {appCopy.page.settings.logoutCta}
            </Button>
          </div>
        }
      >
        <div className="rounded-[1.4rem] border border-black/6 bg-white/68 px-4 py-4 text-sm leading-6 text-foreground/62">
          현재 기기 세션만 종료돼요. 다른 기기 세션은 그대로 유지돼요.
        </div>
      </BottomSheet>
    </>
  )
}

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m14.5 6.5-5 5 5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}
