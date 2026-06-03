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
      <main className="min-h-dvh bg-background px-5 pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] pb-[calc(5rem+env(safe-area-inset-bottom))] text-foreground">
        <div className="mx-auto w-full max-w-[28rem]">
          <header className="flex items-center justify-between gap-3 py-2">
            <Link
              className="inline-flex min-h-11 items-center gap-1.5 pr-3 text-[1.05rem] font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]/40"
              href="/"
            >
              <BackIcon />
              {appCopy.page.settings.backToCalendar}
            </Link>
            <h1 className="text-[1.08rem] font-semibold">
              {appCopy.page.settings.title}
            </h1>
          </header>

          <div className="pt-8">
            <section>
              <p className="px-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                계정
              </p>
              {isAuthenticated ? (
                <div className="mt-4 divide-y divide-border/70">
                  <div className="py-4">
                    <p className="text-[0.82rem] font-semibold text-emerald-700">
                      연결됨
                    </p>
                    <h2 className="mt-1 text-[1.08rem] font-semibold text-foreground">
                      {appCopy.page.settings.accountLoggedInTitle}
                    </h2>
                    <p className="mt-2 text-[0.95rem] leading-6 text-muted-foreground">
                      {appCopy.page.settings.accountLoggedInBody}
                    </p>
                  </div>
                  <div className="flex min-h-14 items-center justify-between gap-4 py-3 text-[0.95rem]">
                    <span className="text-muted-foreground">이메일</span>
                    <span className="min-w-0 truncate text-right font-medium">
                      {session.identity?.email ?? "No email"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="py-3">
                    <h2 className="text-[1.08rem] font-semibold text-foreground">
                      {appCopy.page.settings.accountGuestTitle}
                    </h2>
                    <p className="mt-2 text-[0.95rem] leading-6 text-muted-foreground">
                      {authReady
                        ? appCopy.page.settings.accountGuestBody
                        : appCopy.page.settings.runtimePending}
                    </p>
                  </div>

                  <div className="mt-3 divide-y divide-border/70">
                    <Link
                      className="flex min-h-14 items-center gap-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]/40"
                      href="/login?next=/settings"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.98rem] font-medium text-foreground">
                          {appCopy.page.settings.accountGuestCta}
                        </span>
                        <span className="mt-0.5 block text-[0.84rem] leading-5 text-muted-foreground">
                          {authReady
                            ? appCopy.page.settings.accountGuestBody
                            : appCopy.page.settings.runtimePending}
                        </span>
                      </span>
                      <span aria-hidden="true" className="text-muted-foreground">
                        <ChevronIcon />
                      </span>
                    </Link>

                    {authReady
                      ? PRIMARY_OAUTH_PROVIDERS.map((provider) => (
                          <a
                            key={provider.id}
                            className="flex min-h-14 items-center gap-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]/40"
                            href={`/auth/sign-in/${provider.id}?next=${encodeURIComponent("/settings")}`}
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center text-base font-semibold text-foreground">
                              {provider.mark}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[0.98rem] font-medium text-foreground">
                                {provider.actionLabel}
                              </span>
                              <span className="mt-0.5 block text-[0.84rem] leading-5 text-muted-foreground">
                                {provider.description}
                              </span>
                            </span>
                            <span aria-hidden="true" className="text-muted-foreground">
                              <ChevronIcon />
                            </span>
                          </a>
                        ))
                      : null}
                  </div>
                </div>
              )}
            </section>

            <section className="mt-10">
              <p className="px-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                동기화
              </p>
              <div className="mt-4 py-3">
                <h2 className="text-[1.08rem] font-semibold text-foreground">
                  {appCopy.page.settings.backupTitle}
                </h2>
                <p className="mt-2 text-[0.95rem] leading-6 text-muted-foreground">
                  {appCopy.page.settings.backupBody}
                </p>
              </div>
            </section>
          </div>
        </div>

        {isAuthenticated ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="pointer-events-auto mx-auto w-full max-w-[28rem]">
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
        <p className="text-sm leading-6 text-muted-foreground">
          현재 기기 세션만 종료돼요. 다른 기기 세션은 그대로 유지돼요.
        </p>
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

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m9.5 6.5 5 5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}
