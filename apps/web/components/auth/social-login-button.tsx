import type { AppAuthProviderDefinition } from "@/lib/auth/providers"
import { appCopy } from "@/lib/copy"

type SocialLoginButtonProps = {
  authReady: boolean
  nextPath: string
  provider: AppAuthProviderDefinition
}

const providerStyles = {
  apple: {
    button:
      "border-white/14 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(15,23,42,0.8))] text-white shadow-[0_18px_42px_rgba(15,23,42,0.18)]",
    mark: "bg-white/10 text-white",
    meta: "text-white/68",
  },
  google: {
    button:
      "border-white/60 bg-white/92 text-slate-900 shadow-[0_18px_42px_rgba(15,23,42,0.1)]",
    mark:
      "bg-[linear-gradient(135deg,#fff_0%,#f6f7fb_100%)] text-[color:#2563eb]",
    meta: "text-slate-500",
  },
  kakao: {
    button:
      "border-black/6 bg-[#fee500] text-slate-950 shadow-[0_18px_42px_rgba(254,229,0,0.22)]",
    mark: "bg-black/8 text-slate-950",
    meta: "text-slate-800/70",
  },
} as const

export function SocialLoginButton({
  authReady,
  nextPath,
  provider,
}: SocialLoginButtonProps) {
  const styles = providerStyles[provider.id]
  const descriptionId = `social-provider-${provider.id}-description`
  const href = `/auth/sign-in/${provider.id}?next=${encodeURIComponent(nextPath)}`

  const content = (
    <>
      <span
        aria-hidden="true"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.15rem] text-base font-semibold tracking-[-0.04em] ${styles.mark}`}
      >
        {provider.mark}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.98rem] font-semibold tracking-[-0.03em]">
          {provider.actionLabel}
        </span>
        <span
          id={descriptionId}
          className={`mt-0.5 block text-xs leading-5 ${styles.meta}`}
        >
          {provider.description}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="text-lg font-medium tracking-[-0.04em] opacity-55"
      >
        {authReady
          ? appCopy.component.socialLoginButton.readyTrailingMark
          : appCopy.component.socialLoginButton.disabledTrailingMark}
      </span>
    </>
  )

  if (!authReady) {
    return (
      <button
        type="button"
        disabled
        aria-describedby={descriptionId}
        className={`flex min-h-16 w-full items-center gap-3 rounded-[1.7rem] border px-4 py-3 text-left opacity-68 ${styles.button}`}
      >
        {content}
      </button>
    )
  }

  return (
    <a
      href={href}
      aria-describedby={descriptionId}
      className={`flex min-h-16 w-full items-center gap-3 rounded-[1.7rem] border px-4 py-3 transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]/50 ${styles.button}`}
    >
      {content}
    </a>
  )
}
