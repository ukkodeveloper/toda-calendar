"use client"

import { BottomSheet } from "@workspace/ui/components/bottom-sheet"
import { Button } from "@workspace/ui/components/button"

import { PRIMARY_OAUTH_PROVIDERS } from "@/lib/auth/providers"
import { appCopy } from "@/lib/copy"

type BackupPromptSheetProps = {
  authReady: boolean
  nextPath: string
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function BackupPromptSheet({
  authReady,
  nextPath,
  onOpenChange,
  open,
}: BackupPromptSheetProps) {
  return (
    <BottomSheet
      description={appCopy.page.calendar.backupPrompt.description}
      onOpenChange={onOpenChange}
      open={open}
      title={appCopy.page.calendar.backupPrompt.title}
      footer={
        <Button
          className="w-full"
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
        >
          {appCopy.page.calendar.backupPrompt.later}
        </Button>
      }
    >
      <div className="space-y-3 pb-2">
        {PRIMARY_OAUTH_PROVIDERS.map((provider) => {
          const href = `/auth/sign-in/${provider.id}?next=${encodeURIComponent(nextPath)}`

          if (!authReady) {
            return (
              <button
                key={provider.id}
                className="flex min-h-16 w-full items-center gap-3 rounded-[1.5rem] border border-black/8 bg-white/72 px-4 py-3 text-left opacity-55"
                disabled
                type="button"
              >
                <ProviderMark mark={provider.mark} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.98rem] font-semibold tracking-[-0.03em] text-foreground">
                    {provider.actionLabel}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-foreground/58">
                    {provider.description}
                  </span>
                </span>
              </button>
            )
          }

          return (
            <a
              key={provider.id}
              className="flex min-h-16 w-full items-center gap-3 rounded-[1.5rem] border border-black/8 bg-white/88 px-4 py-3 text-left shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]/50"
              href={href}
            >
              <ProviderMark mark={provider.mark} />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.98rem] font-semibold tracking-[-0.03em] text-foreground">
                  {provider.actionLabel}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-foreground/58">
                  {provider.description}
                </span>
              </span>
              <span aria-hidden="true" className="text-lg text-foreground/34">
                {"->"}
              </span>
            </a>
          )
        })}
      </div>
    </BottomSheet>
  )
}

function ProviderMark({ mark }: { mark: string }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-[linear-gradient(135deg,#fff_0%,#f4f6f8_100%)] text-base font-semibold tracking-[-0.04em] text-foreground">
      {mark}
    </span>
  )
}
